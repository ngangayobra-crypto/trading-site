insert into public.platform_settings (key, value)
values
  ('platform', '{"platformName":"Northstar Paper","supportEmail":"support@example.com","maintenanceMode":false}'),
  ('trading', '{"defaultStartingBalance":100000,"minimumOrderValue":10,"maximumOrderValue":50000,"maximumPositionValue":75000,"tradingFeeRate":0.0005,"slippageRate":0.0008}')
on conflict (key) do update set value = excluded.value;

insert into public.markets (symbol, name, category, current_price, previous_close, volume, day_low, day_high, year_low, year_high, is_tradable, data_mode)
values
  ('AAPL', 'Apple Inc.', 'Stocks', 218.42, 215.31, 51320000, 214.88, 219.11, 164.08, 237.49, true, 'SIMULATED DATA'),
  ('MSFT', 'Microsoft Corp.', 'Stocks', 511.23, 518.90, 22010000, 508.60, 519.70, 344.79, 555.45, true, 'SIMULATED DATA'),
  ('NVDA', 'NVIDIA Corp.', 'Stocks', 174.36, 170.02, 185450000, 169.92, 175.80, 86.62, 181.12, true, 'SIMULATED DATA'),
  ('BTC-USD', 'Bitcoin', 'Crypto', 118240.12, 116980.40, 36890000000, 115921.40, 119010.22, 52789.11, 123012.85, true, 'SIMULATED DATA'),
  ('ETH-USD', 'Ethereum', 'Crypto', 3874.55, 3945.21, 15860000000, 3831.70, 3998.40, 1881.20, 4212.80, true, 'SIMULATED DATA')
on conflict (symbol) do update set current_price = excluded.current_price;
