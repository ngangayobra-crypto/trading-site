import type { Account, Market, Order, OrderSide, OrderType, PlatformSettings, Position, Trade, UserProfile } from '../types/trading'

export interface TradingState {
  account: Account
  markets: Market[]
  positions: Position[]
  orders: Order[]
  trades: Trade[]
  user: UserProfile
  settings: PlatformSettings
}

export interface OrderRequest {
  userId: string
  marketId: string
  side: OrderSide
  orderType: OrderType
  quantity: number
  limitPrice?: number
}

export interface OrderResult {
  state: TradingState
  order: Order
  trade?: Trade
  message: string
}

const roundMoney = (value: number) => Math.round(value * 100) / 100
const roundQty = (value: number) => Math.round(value * 1_000_000) / 1_000_000

function requireOwner(state: TradingState, userId: string) {
  if (state.user.id !== userId || state.account.userId !== userId) {
    throw new Error('Unauthorized account access')
  }
}

function getMarket(state: TradingState, marketId: string) {
  const market = state.markets.find((item) => item.id === marketId)
  if (!market) throw new Error('Market unavailable')
  if (!market.isTradable) throw new Error('Market unavailable')
  return market
}

function getPosition(state: TradingState, marketId: string) {
  return state.positions.find((position) => position.marketId === marketId)
}

export function portfolioMetrics(state: TradingState) {
  const investedValue = state.positions.reduce((total, position) => {
    const market = state.markets.find((item) => item.id === position.marketId)
    return total + (market ? position.quantity * market.price : 0)
  }, 0)
  const unrealizedPnl = state.positions.reduce((total, position) => {
    const market = state.markets.find((item) => item.id === position.marketId)
    return total + (market ? (market.price - position.averagePrice) * position.quantity : 0)
  }, 0)
  const realizedPnl = state.positions.reduce((total, position) => total + position.realizedPnl, 0)
  const totalEquity = state.account.cash + investedValue
  const totalPnl = totalEquity - state.account.startingBalance

  return {
    investedValue: roundMoney(investedValue),
    unrealizedPnl: roundMoney(unrealizedPnl),
    realizedPnl: roundMoney(realizedPnl),
    totalEquity: roundMoney(totalEquity),
    totalPnl: roundMoney(totalPnl),
    returnPercent: state.account.startingBalance === 0 ? 0 : (totalPnl / state.account.startingBalance) * 100,
    buyingPower: roundMoney(state.account.cash),
  }
}

function createRejectedOrder(state: TradingState, request: OrderRequest, reason: string): OrderResult {
  const order: Order = {
    id: crypto.randomUUID(),
    userId: request.userId,
    marketId: request.marketId,
    side: request.side,
    orderType: request.orderType,
    quantity: request.quantity,
    limitPrice: request.limitPrice,
    status: 'rejected',
    rejectionReason: reason,
    createdAt: new Date().toISOString(),
  }
  return {
    state: { ...state, orders: [order, ...state.orders] },
    order,
    message: reason,
  }
}

export function submitOrder(state: TradingState, request: OrderRequest): OrderResult {
  requireOwner(state, request.userId)

  if (!Number.isFinite(request.quantity) || request.quantity <= 0) {
    return createRejectedOrder(state, request, 'Invalid quantity')
  }

  const market = getMarket(state, request.marketId)
  const feeRate = state.settings.tradingFeeRate
  const slippage = request.side === 'buy' ? 1 + state.settings.slippageRate : 1 - state.settings.slippageRate
  const executionPrice = roundMoney(market.price * slippage)
  const orderValue = roundMoney(executionPrice * request.quantity)
  const fee = roundMoney(orderValue * feeRate)

  if (orderValue < state.settings.minimumOrderValue) {
    return createRejectedOrder(state, request, 'Order rejected: below minimum order value')
  }
  if (orderValue > state.settings.maximumOrderValue) {
    return createRejectedOrder(state, request, 'Order rejected: above maximum order value')
  }
  if (request.orderType === 'limit' && (!request.limitPrice || request.limitPrice <= 0)) {
    return createRejectedOrder(state, request, 'Invalid limit price')
  }

  const shouldFillLimit =
    request.orderType === 'limit' &&
    ((request.side === 'buy' && market.price <= request.limitPrice!) || (request.side === 'sell' && market.price >= request.limitPrice!))

  if (request.orderType === 'limit' && !shouldFillLimit) {
    const order: Order = {
      id: crypto.randomUUID(),
      userId: request.userId,
      marketId: request.marketId,
      side: request.side,
      orderType: request.orderType,
      quantity: request.quantity,
      limitPrice: request.limitPrice,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    return { state: { ...state, orders: [order, ...state.orders] }, order, message: 'Limit order opened' }
  }

  const existingPosition = getPosition(state, market.id)
  if (request.side === 'buy') {
    const totalCost = roundMoney(orderValue + fee)
    if (state.account.cash < totalCost) return createRejectedOrder(state, request, 'Insufficient buying power')

    const currentValue = existingPosition ? existingPosition.quantity * market.price : 0
    if (currentValue + orderValue > state.settings.maximumPositionValue) {
      return createRejectedOrder(state, request, 'Position limit exceeded')
    }

    const nextPosition: Position = existingPosition
      ? {
          ...existingPosition,
          quantity: roundQty(existingPosition.quantity + request.quantity),
          averagePrice: roundMoney(((existingPosition.quantity * existingPosition.averagePrice) + orderValue) / (existingPosition.quantity + request.quantity)),
        }
      : { marketId: market.id, quantity: request.quantity, averagePrice: executionPrice, realizedPnl: 0 }

    return fillOrder(state, request, executionPrice, 0, {
      cash: roundMoney(state.account.cash - totalCost),
      position: nextPosition,
    })
  }

  if (!existingPosition || existingPosition.quantity < request.quantity) {
    return createRejectedOrder(state, request, 'Insufficient position')
  }

  const realizedPnl = roundMoney((executionPrice - existingPosition.averagePrice) * request.quantity - fee)
  const remainingQuantity = roundQty(existingPosition.quantity - request.quantity)
  const nextPosition = remainingQuantity > 0
    ? { ...existingPosition, quantity: remainingQuantity, realizedPnl: roundMoney(existingPosition.realizedPnl + realizedPnl) }
    : { ...existingPosition, quantity: 0, realizedPnl: roundMoney(existingPosition.realizedPnl + realizedPnl) }

  return fillOrder(state, request, executionPrice, realizedPnl, {
    cash: roundMoney(state.account.cash + orderValue - fee),
    position: nextPosition,
  })
}

function fillOrder(
  state: TradingState,
  request: OrderRequest,
  executionPrice: number,
  realizedPnl: number,
  patch: { cash: number; position: Position },
): OrderResult {
  const now = new Date().toISOString()
  const order: Order = {
    id: crypto.randomUUID(),
    userId: request.userId,
    marketId: request.marketId,
    side: request.side,
    orderType: request.orderType,
    quantity: request.quantity,
    limitPrice: request.limitPrice,
    status: 'filled',
    createdAt: now,
    filledAt: now,
    averageFillPrice: executionPrice,
  }
  const trade: Trade = {
    id: crypto.randomUUID(),
    orderId: order.id,
    userId: request.userId,
    marketId: request.marketId,
    side: request.side,
    quantity: request.quantity,
    executionPrice,
    totalValue: roundMoney(executionPrice * request.quantity),
    realizedPnl,
    createdAt: now,
  }
  const nextPositions = state.positions
    .filter((position) => position.marketId !== request.marketId)
    .concat(patch.position.quantity > 0 || patch.position.realizedPnl !== 0 ? [patch.position] : [])

  return {
    state: {
      ...state,
      account: { ...state.account, cash: patch.cash },
      positions: nextPositions,
      orders: [order, ...state.orders],
      trades: [trade, ...state.trades],
    },
    order,
    trade,
    message: 'Order filled with virtual funds',
  }
}

export function cancelOrder(state: TradingState, orderId: string, actor: UserProfile) {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) throw new Error('Order not found')
  if (actor.role !== 'admin' && order.userId !== actor.id) throw new Error('Unauthorized order access')
  if (!['open', 'pending'].includes(order.status)) throw new Error('Only open orders can be cancelled')

  return {
    ...state,
    orders: state.orders.map((item) => (item.id === orderId ? { ...item, status: 'cancelled' as const } : item)),
  }
}

export function requireAdmin(profile: UserProfile) {
  if (profile.role !== 'admin') throw new Error('Admin authorization required')
}
