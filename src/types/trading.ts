export type AssetCategory = 'Stocks' | 'Crypto' | 'Forex' | 'Indices' | 'Commodities'
export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected'
export type Role = 'user' | 'admin'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatar?: string
  role: Role
  status: 'active' | 'suspended'
  createdAt: string
  startingVirtualBalance: number
}

export interface Market {
  id: string
  symbol: string
  name: string
  category: AssetCategory
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  dayLow: number
  dayHigh: number
  yearLow: number
  yearHigh: number
  isTradable: boolean
  dataMode: 'LIVE MARKET DATA' | 'SIMULATED DATA'
}

export interface PricePoint {
  time: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Position {
  marketId: string
  quantity: number
  averagePrice: number
  realizedPnl: number
}

export interface Account {
  userId: string
  cash: number
  startingBalance: number
}

export interface Order {
  id: string
  userId: string
  marketId: string
  side: OrderSide
  orderType: OrderType
  quantity: number
  limitPrice?: number
  status: OrderStatus
  createdAt: string
  filledAt?: string
  averageFillPrice?: number
  rejectionReason?: string
}

export interface Trade {
  id: string
  orderId: string
  userId: string
  marketId: string
  side: OrderSide
  quantity: number
  executionPrice: number
  totalValue: number
  realizedPnl: number
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  actor: string
  target: string
  previousValue?: string
  newValue?: string
  createdAt: string
}

export interface PlatformSettings {
  platformName: string
  defaultStartingBalance: number
  minimumOrderValue: number
  maximumOrderValue: number
  maximumPositionValue: number
  tradingFeeRate: number
  slippageRate: number
  registrationEnabled: boolean
  maintenanceMode: boolean
}
