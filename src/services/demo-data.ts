import type { AuditLog, Market, Notification, Order, PlatformSettings, Position, PricePoint, Trade, UserProfile } from '../types/trading'

export const settings: PlatformSettings = {
  platformName: 'Northstar Paper',
  defaultStartingBalance: 100_000,
  minimumOrderValue: 10,
  maximumOrderValue: 50_000,
  maximumPositionValue: 75_000,
  tradingFeeRate: 0.0005,
  slippageRate: 0.0008,
  registrationEnabled: true,
  maintenanceMode: false,
}

export const demoUser: UserProfile = {
  id: 'user-demo',
  email: 'demo@northstar.paper',
  displayName: 'Demo Trader',
  role: 'user',
  status: 'active',
  createdAt: '2026-07-01T08:00:00.000Z',
  startingVirtualBalance: settings.defaultStartingBalance,
}

export const adminUser: UserProfile = {
  id: 'admin-demo',
  email: 'admin@northstar.paper',
  displayName: 'Platform Admin',
  role: 'admin',
  status: 'active',
  createdAt: '2026-07-01T08:00:00.000Z',
  startingVirtualBalance: settings.defaultStartingBalance,
}

export const markets: Market[] = [
  { id: 'm-aapl', symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', price: 218.42, previousClose: 215.31, change: 3.11, changePercent: 1.44, volume: 51320000, dayLow: 214.88, dayHigh: 219.11, yearLow: 164.08, yearHigh: 237.49, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-msft', symbol: 'MSFT', name: 'Microsoft Corp.', category: 'Stocks', price: 511.23, previousClose: 518.9, change: -7.67, changePercent: -1.48, volume: 22010000, dayLow: 508.6, dayHigh: 519.7, yearLow: 344.79, yearHigh: 555.45, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'Stocks', price: 174.36, previousClose: 170.02, change: 4.34, changePercent: 2.55, volume: 185450000, dayLow: 169.92, dayHigh: 175.8, yearLow: 86.62, yearHigh: 181.12, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-btc', symbol: 'BTC-USD', name: 'Bitcoin', category: 'Crypto', price: 118240.12, previousClose: 116980.4, change: 1259.72, changePercent: 1.08, volume: 36890000000, dayLow: 115921.4, dayHigh: 119010.22, yearLow: 52789.11, yearHigh: 123012.85, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-eth', symbol: 'ETH-USD', name: 'Ethereum', category: 'Crypto', price: 3874.55, previousClose: 3945.21, change: -70.66, changePercent: -1.79, volume: 15860000000, dayLow: 3831.7, dayHigh: 3998.4, yearLow: 1881.2, yearHigh: 4212.8, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-spx', symbol: 'SPX', name: 'S&P 500 Index', category: 'Indices', price: 6429.15, previousClose: 6408.04, change: 21.11, changePercent: 0.33, volume: 0, dayLow: 6388.42, dayHigh: 6438.7, yearLow: 4898.12, yearHigh: 6461.91, isTradable: false, dataMode: 'SIMULATED DATA' },
  { id: 'm-eurusd', symbol: 'EURUSD', name: 'Euro / U.S. Dollar', category: 'Forex', price: 1.1732, previousClose: 1.1711, change: 0.0021, changePercent: 0.18, volume: 0, dayLow: 1.1681, dayHigh: 1.1764, yearLow: 1.021, yearHigh: 1.185, isTradable: true, dataMode: 'SIMULATED DATA' },
  { id: 'm-gold', symbol: 'XAUUSD', name: 'Gold Spot', category: 'Commodities', price: 2418.5, previousClose: 2431.2, change: -12.7, changePercent: -0.52, volume: 0, dayLow: 2408.2, dayHigh: 2440.8, yearLow: 1898.3, yearHigh: 2491.1, isTradable: true, dataMode: 'SIMULATED DATA' },
]

export const initialPositions: Position[] = [
  { marketId: 'm-aapl', quantity: 24, averagePrice: 198.1, realizedPnl: 0 },
  { marketId: 'm-nvda', quantity: 42, averagePrice: 132.5, realizedPnl: 880.4 },
  { marketId: 'm-eth', quantity: 1.8, averagePrice: 3120, realizedPnl: 0 },
]

export const seedOrders: Order[] = [
  { id: 'ord-1001', userId: demoUser.id, marketId: 'm-aapl', side: 'buy', orderType: 'market', quantity: 24, status: 'filled', createdAt: '2026-07-21T10:15:00.000Z', filledAt: '2026-07-21T10:15:01.000Z', averageFillPrice: 198.1 },
  { id: 'ord-1002', userId: demoUser.id, marketId: 'm-msft', side: 'buy', orderType: 'limit', quantity: 8, limitPrice: 498, status: 'open', createdAt: '2026-07-29T12:20:00.000Z' },
]

export const seedTrades: Trade[] = [
  { id: 'trd-1001', orderId: 'ord-1001', userId: demoUser.id, marketId: 'm-aapl', side: 'buy', quantity: 24, executionPrice: 198.1, totalValue: 4754.4, realizedPnl: 0, createdAt: '2026-07-21T10:15:01.000Z' },
]

export const seedNotifications: Notification[] = [
  { id: 'note-1', title: 'Order filled', body: 'AAPL market buy filled with virtual funds.', read: false, createdAt: '2026-07-21T10:15:02.000Z' },
  { id: 'note-2', title: 'Data mode', body: 'Demo markets are clearly marked as simulated data.', read: false, createdAt: '2026-07-30T08:00:00.000Z' },
]

export const seedAuditLogs: AuditLog[] = [
  { id: 'audit-1', action: 'ORDER_CREATED', actor: demoUser.email, target: 'ord-1001', createdAt: '2026-07-21T10:15:00.000Z' },
  { id: 'audit-2', action: 'TRADE_EXECUTED', actor: 'trading-engine', target: 'trd-1001', createdAt: '2026-07-21T10:15:01.000Z' },
]

export function getHistory(market: Market, count = 80): PricePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const drift = Math.sin(index / 7) * market.price * 0.012
    const pulse = Math.cos(index / 3) * market.price * 0.004
    const close = market.price + drift + pulse - market.price * 0.01
    const open = close - Math.sin(index / 5) * market.price * 0.003
    const high = Math.max(open, close) + market.price * 0.004
    const low = Math.min(open, close) - market.price * 0.004
    return {
      time: `${index + 1}`,
      price: Number(close.toFixed(4)),
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: Math.round(market.volume * (0.65 + index / count)),
    }
  })
}
