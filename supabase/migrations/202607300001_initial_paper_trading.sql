create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.market_category as enum ('Stocks', 'Crypto', 'Forex', 'Indices', 'Commodities');
create type public.order_side as enum ('buy', 'sell');
create type public.order_type as enum ('market', 'limit');
create type public.order_status as enum ('pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected');
create type public.data_mode as enum ('LIVE MARKET DATA', 'SIMULATED DATA');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  status public.account_status not null default 'active',
  role public.app_role not null default 'user',
  starting_virtual_balance numeric(18, 4) not null default 100000 check (starting_virtual_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  category public.market_category not null,
  current_price numeric(24, 8) not null check (current_price > 0),
  previous_close numeric(24, 8) not null check (previous_close > 0),
  volume numeric(24, 4) not null default 0 check (volume >= 0),
  day_low numeric(24, 8) not null,
  day_high numeric(24, 8) not null,
  year_low numeric(24, 8) not null,
  year_high numeric(24, 8) not null,
  is_tradable boolean not null default true,
  is_archived boolean not null default false,
  data_mode public.data_mode not null default 'SIMULATED DATA',
  min_order_value numeric(18, 4),
  max_order_value numeric(18, 4),
  trading_fee_rate numeric(10, 8),
  slippage_rate numeric(10, 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cash numeric(18, 4) not null check (cash >= 0),
  starting_balance numeric(18, 4) not null check (starting_balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  quantity numeric(24, 8) not null check (quantity >= 0),
  average_price numeric(24, 8) not null check (average_price >= 0),
  realized_pnl numeric(18, 4) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, market_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  side public.order_side not null,
  order_type public.order_type not null,
  quantity numeric(24, 8) not null check (quantity > 0),
  limit_price numeric(24, 8) check (limit_price is null or limit_price > 0),
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  filled_at timestamptz,
  average_fill_price numeric(24, 8),
  rejection_reason text
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  side public.order_side not null,
  quantity numeric(24, 8) not null check (quantity > 0),
  execution_price numeric(24, 8) not null check (execution_price > 0),
  total_value numeric(18, 4) not null check (total_value >= 0),
  realized_pnl numeric(18, 4) not null default 0,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trade_id uuid references public.trades(id),
  type text not null,
  amount numeric(18, 4) not null,
  balance_after numeric(18, 4) not null,
  created_at timestamptz not null default now()
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Primary',
  created_at timestamptz not null default now()
);

create table public.watchlist_items (
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (watchlist_id, market_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_by uuid not null references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references public.profiles(id),
  target_table text,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index markets_category_idx on public.markets(category);
create index orders_user_status_idx on public.orders(user_id, status, created_at desc);
create index trades_user_created_idx on public.trades(user_id, created_at desc);
create index audit_action_created_idx on public.admin_audit_logs(action, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.platform_settings enable row level security;
alter table public.markets enable row level security;
alter table public.accounts enable row level security;
alter table public.positions enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update limited" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "settings readable" on public.platform_settings for select using (true);
create policy "settings admin writes" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "markets readable" on public.markets for select using (not is_archived or public.is_admin());
create policy "markets admin writes" on public.markets for all using (public.is_admin()) with check (public.is_admin());

create policy "accounts owner read" on public.accounts for select using (user_id = auth.uid() or public.is_admin());
create policy "accounts admin writes" on public.accounts for all using (public.is_admin()) with check (public.is_admin());

create policy "positions owner read" on public.positions for select using (user_id = auth.uid() or public.is_admin());
create policy "positions admin writes" on public.positions for all using (public.is_admin()) with check (public.is_admin());

create policy "orders owner read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders owner create" on public.orders for insert with check (user_id = auth.uid());
create policy "orders owner cancel" on public.orders for update using (user_id = auth.uid() and status in ('pending', 'open')) with check (user_id = auth.uid());
create policy "orders admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin());

create policy "trades owner read" on public.trades for select using (user_id = auth.uid() or public.is_admin());
create policy "transactions owner read" on public.transactions for select using (user_id = auth.uid() or public.is_admin());

create policy "watchlists owner all" on public.watchlists for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "watchlist items owner all" on public.watchlist_items for all using (
  exists (select 1 from public.watchlists where watchlists.id = watchlist_id and (watchlists.user_id = auth.uid() or public.is_admin()))
) with check (
  exists (select 1 from public.watchlists where watchlists.id = watchlist_id and (watchlists.user_id = auth.uid() or public.is_admin()))
);

create policy "notifications owner all" on public.notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "announcements readable" on public.announcements for select using (published_at is not null or public.is_admin());
create policy "announcements admin writes" on public.announcements for all using (public.is_admin()) with check (public.is_admin());
create policy "audit admin read" on public.admin_audit_logs for select using (public.is_admin());
create policy "audit admin append" on public.admin_audit_logs for insert with check (public.is_admin());

create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit logs are append-only';
end;
$$;

create trigger admin_audit_logs_no_update
before update or delete on public.admin_audit_logs
for each row execute function public.prevent_audit_mutation();
