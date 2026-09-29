-- Provision every email/password account with the existing paper-trading data model.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_balance numeric(18, 4);
  display_name text;
begin
  select coalesce(
    (select (value ->> 'defaultStartingBalance')::numeric from public.platform_settings where key = 'trading'),
    100000
  ) into initial_balance;

  display_name := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Paper Trader');

  insert into public.profiles (id, email, display_name, starting_virtual_balance)
  values (new.id, new.email, display_name, initial_balance)
  on conflict (id) do nothing;

  insert into public.accounts (user_id, cash, starting_balance)
  values (new.id, initial_balance, initial_balance)
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.watchlists where user_id = new.id) then
    insert into public.watchlists (user_id, name) values (new.id, 'Primary');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- A user may only change their presentation fields. Role, status, balance, and email are protected.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() and (
    new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.starting_virtual_balance is distinct from old.starting_virtual_balance
  ) then
    raise exception 'Only administrators can change protected profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

drop policy if exists "profiles self update limited" on public.profiles;
create policy "profiles self update limited" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- Orders, trades, positions, accounts, and transactions are changed only by the RPC below.
drop policy if exists "orders owner create" on public.orders;
drop policy if exists "orders owner cancel" on public.orders;
revoke insert, update, delete on public.accounts from anon, authenticated;
revoke insert, update, delete on public.positions from anon, authenticated;
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.trades from anon, authenticated;
revoke insert, update, delete on public.transactions from anon, authenticated;

create or replace function public.place_paper_order(
  p_market_id uuid,
  p_side public.order_side,
  p_order_type public.order_type,
  p_quantity numeric,
  p_limit_price numeric default null
)
returns table (order_id uuid, status public.order_status, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  market_row public.markets%rowtype;
  trading_config jsonb;
  account_cash numeric(18, 4);
  position_quantity numeric(24, 8) := 0;
  position_average_price numeric(24, 8) := 0;
  position_realized_pnl numeric(18, 4) := 0;
  has_position boolean := false;
  fee_rate numeric(10, 8);
  slippage_rate numeric(10, 8);
  minimum_order_value numeric(18, 4);
  maximum_order_value numeric(18, 4);
  maximum_position_value numeric(18, 4);
  execution_price numeric(24, 8);
  order_value numeric(18, 4);
  fee numeric(18, 4);
  total_cost numeric(18, 4);
  realized_pnl numeric(18, 4) := 0;
  remaining_quantity numeric(24, 8);
  generated_order_id uuid := gen_random_uuid();
  now_at timestamptz := now();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.profiles where id = actor_id and status = 'active') then
    raise exception 'Active account required';
  end if;

  select * into market_row
  from public.markets
  where id = p_market_id and is_tradable and not is_archived
  for share;

  if not found then
    raise exception 'Market unavailable';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
    values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, coalesce(p_quantity, 0.00000001), p_limit_price, 'rejected', 'Invalid quantity', now_at);
    return query select generated_order_id, 'rejected'::public.order_status, 'Invalid quantity'::text;
    return;
  end if;

  if p_order_type = 'limit' and (p_limit_price is null or p_limit_price <= 0) then
    insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
    values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Invalid limit price', now_at);
    return query select generated_order_id, 'rejected'::public.order_status, 'Invalid limit price'::text;
    return;
  end if;

  select coalesce((select value from public.platform_settings where key = 'trading'), '{}'::jsonb) into trading_config;
  fee_rate := coalesce(market_row.trading_fee_rate, (trading_config ->> 'tradingFeeRate')::numeric, 0.0005);
  slippage_rate := coalesce(market_row.slippage_rate, (trading_config ->> 'slippageRate')::numeric, 0.0008);
  minimum_order_value := coalesce(market_row.min_order_value, (trading_config ->> 'minimumOrderValue')::numeric, 10);
  maximum_order_value := coalesce(market_row.max_order_value, (trading_config ->> 'maximumOrderValue')::numeric, 50000);
  maximum_position_value := coalesce((trading_config ->> 'maximumPositionValue')::numeric, 75000);
  execution_price := round(market_row.current_price * case when p_side = 'buy' then 1 + slippage_rate else 1 - slippage_rate end, 8);
  order_value := round(execution_price * p_quantity, 4);
  fee := round(order_value * fee_rate, 4);

  if order_value < minimum_order_value then
    insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
    values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Order rejected: below minimum order value', now_at);
    return query select generated_order_id, 'rejected'::public.order_status, 'Order rejected: below minimum order value'::text;
    return;
  end if;

  if order_value > maximum_order_value then
    insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
    values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Order rejected: above maximum order value', now_at);
    return query select generated_order_id, 'rejected'::public.order_status, 'Order rejected: above maximum order value'::text;
    return;
  end if;

  if p_order_type = 'limit' and ((p_side = 'buy' and market_row.current_price > p_limit_price) or (p_side = 'sell' and market_row.current_price < p_limit_price)) then
    insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, created_at)
    values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'open', now_at);
    return query select generated_order_id, 'open'::public.order_status, 'Limit order opened'::text;
    return;
  end if;

  select cash into account_cash from public.accounts where user_id = actor_id for update;
  if not found then
    raise exception 'Paper account not found';
  end if;

  select quantity, average_price, realized_pnl
  into position_quantity, position_average_price, position_realized_pnl
  from public.positions
  where user_id = actor_id and market_id = p_market_id
  for update;
  has_position := found;

  if not has_position then
    position_quantity := 0;
    position_average_price := 0;
    position_realized_pnl := 0;
  end if;

  if p_side = 'buy' then
    total_cost := order_value + fee;
    if account_cash < total_cost then
      insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
      values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Insufficient buying power', now_at);
      return query select generated_order_id, 'rejected'::public.order_status, 'Insufficient buying power'::text;
      return;
    end if;

    if (position_quantity * market_row.current_price) + order_value > maximum_position_value then
      insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
      values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Position limit exceeded', now_at);
      return query select generated_order_id, 'rejected'::public.order_status, 'Position limit exceeded'::text;
      return;
    end if;

    if has_position then
      update public.positions
      set quantity = round(position_quantity + p_quantity, 8),
          average_price = round(((position_quantity * position_average_price) + order_value) / (position_quantity + p_quantity), 8),
          updated_at = now_at
      where user_id = actor_id and market_id = p_market_id;
    else
      insert into public.positions (user_id, market_id, quantity, average_price, realized_pnl, updated_at)
      values (actor_id, p_market_id, p_quantity, execution_price, 0, now_at);
    end if;

    account_cash := account_cash - total_cost;
  else
    if not has_position or position_quantity < p_quantity then
      insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, rejection_reason, created_at)
      values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'rejected', 'Insufficient position', now_at);
      return query select generated_order_id, 'rejected'::public.order_status, 'Insufficient position'::text;
      return;
    end if;

    realized_pnl := round((execution_price - position_average_price) * p_quantity - fee, 4);
    remaining_quantity := round(position_quantity - p_quantity, 8);

    if remaining_quantity = 0 then
      delete from public.positions where user_id = actor_id and market_id = p_market_id;
    else
      update public.positions
      set quantity = remaining_quantity,
          realized_pnl = position_realized_pnl + realized_pnl,
          updated_at = now_at
      where user_id = actor_id and market_id = p_market_id;
    end if;

    account_cash := account_cash + order_value - fee;
  end if;

  update public.accounts set cash = round(account_cash, 4), updated_at = now_at where user_id = actor_id;

  insert into public.orders (id, user_id, market_id, side, order_type, quantity, limit_price, status, created_at, filled_at, average_fill_price)
  values (generated_order_id, actor_id, p_market_id, p_side, p_order_type, p_quantity, p_limit_price, 'filled', now_at, now_at, execution_price);

  insert into public.trades (id, order_id, user_id, market_id, side, quantity, execution_price, total_value, realized_pnl, created_at)
  values (gen_random_uuid(), generated_order_id, actor_id, p_market_id, p_side, p_quantity, execution_price, order_value, realized_pnl, now_at);

  insert into public.transactions (user_id, trade_id, type, amount, balance_after, created_at)
  select actor_id, id, case when p_side = 'buy' then 'PAPER_BUY' else 'PAPER_SELL' end,
    case when p_side = 'buy' then -(order_value + fee) else order_value - fee end,
    round(account_cash, 4), now_at
  from public.trades where order_id = generated_order_id;

  insert into public.notifications (user_id, title, body, created_at)
  values (actor_id, 'Order filled', market_row.symbol || ' ' || upper(p_side::text) || ' order filled with virtual funds.', now_at);

  insert into public.admin_audit_logs (action, actor_id, target_table, target_id, new_value, created_at)
  values ('TRADE_EXECUTED', actor_id, 'orders', generated_order_id::text, jsonb_build_object('side', p_side, 'quantity', p_quantity, 'execution_price', execution_price), now_at);

  return query select generated_order_id, 'filled'::public.order_status, 'Order filled with virtual funds'::text;
end;
$$;

create or replace function public.cancel_paper_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  update public.orders
  set status = 'cancelled'
  where id = p_order_id and user_id = actor_id and status in ('pending', 'open');

  if not found then
    raise exception 'Open order not found';
  end if;

  insert into public.admin_audit_logs (action, actor_id, target_table, target_id)
  values ('ORDER_CANCELLED', actor_id, 'orders', p_order_id::text);

  return true;
end;
$$;

revoke all on function public.place_paper_order(uuid, public.order_side, public.order_type, numeric, numeric) from public;
revoke all on function public.cancel_paper_order(uuid) from public;
grant execute on function public.place_paper_order(uuid, public.order_side, public.order_type, numeric, numeric) to authenticated;
grant execute on function public.cancel_paper_order(uuid) to authenticated;

-- Persistent, transparent simulated-market configuration and OHLC candle history.
create table public.market_simulation_settings (
  market_id uuid primary key references public.markets(id) on delete cascade,
  up_probability numeric(6, 5) not null default 0.45 check (up_probability >= 0 and up_probability <= 1),
  down_probability numeric(6, 5) not null default 0.45 check (down_probability >= 0 and down_probability <= 1),
  flat_probability numeric(6, 5) not null default 0.10 check (flat_probability >= 0 and flat_probability <= 1),
  volatility numeric(10, 8) not null default 0.02 check (volatility > 0),
  maximum_move numeric(10, 8) not null default 0.05 check (maximum_move > 0),
  updated_at timestamptz not null default now(),
  check (abs(up_probability + down_probability + flat_probability - 1) < 0.00001)
);

create table public.market_candles (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  interval text not null,
  open numeric(24, 8) not null check (open > 0),
  high numeric(24, 8) not null check (high > 0),
  low numeric(24, 8) not null check (low > 0),
  close numeric(24, 8) not null check (close > 0),
  volume numeric(24, 4) not null default 0 check (volume >= 0),
  opened_at timestamptz not null,
  check (high >= greatest(open, close)),
  check (low <= least(open, close)),
  unique (market_id, interval, opened_at)
);

create index market_candles_market_interval_opened_idx on public.market_candles(market_id, interval, opened_at desc);

alter table public.market_simulation_settings enable row level security;
alter table public.market_candles enable row level security;
create policy "simulation settings readable" on public.market_simulation_settings for select using (true);
create policy "simulation settings admin writes" on public.market_simulation_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "market candles readable" on public.market_candles for select using (true);
create policy "market candles admin writes" on public.market_candles for all using (public.is_admin()) with check (public.is_admin());

insert into public.markets (symbol, name, category, current_price, previous_close, volume, day_low, day_high, year_low, year_high, is_tradable, data_mode)
values ('RDL', 'Redledger', 'Crypto', 1.00000000, 0.98400000, 3250000, 0.96100000, 1.02800000, 0.62000000, 1.18000000, true, 'SIMULATED DATA')
on conflict (symbol) do update set
  name = excluded.name,
  category = excluded.category,
  current_price = excluded.current_price,
  previous_close = excluded.previous_close,
  volume = excluded.volume,
  day_low = excluded.day_low,
  day_high = excluded.day_high,
  year_low = excluded.year_low,
  year_high = excluded.year_high,
  is_tradable = excluded.is_tradable,
  data_mode = excluded.data_mode;

insert into public.market_simulation_settings (market_id, up_probability, down_probability, flat_probability, volatility, maximum_move)
select id, 0.45000, 0.45000, 0.10000, 0.02500000, 0.06000000
from public.markets where symbol = 'RDL'
on conflict (market_id) do nothing;

with rdl as (
  select id, current_price from public.markets where symbol = 'RDL'
), candles as (
  select
    id,
    series_point,
    current_price * (1 + sin(series_point / 8.0) * 0.04 + cos(series_point / 5.0) * 0.01) as open_price,
    current_price * (1 + sin((series_point + 1) / 8.0) * 0.04 + cos((series_point + 1) / 5.0) * 0.01) as close_price,
    date_trunc('hour', now()) - ((80 - series_point) * interval '1 hour') as opened_at
  from rdl cross join generate_series(1, 80) as series_point
)
insert into public.market_candles (market_id, interval, open, high, low, close, volume, opened_at)
select
  id,
  '1h',
  round(open_price::numeric, 8),
  round((greatest(open_price, close_price) * 1.012)::numeric, 8),
  round((least(open_price, close_price) * 0.988)::numeric, 8),
  round(close_price::numeric, 8),
  round((15000 + series_point * 850)::numeric, 4),
  opened_at
from candles
on conflict (market_id, interval, opened_at) do nothing;
