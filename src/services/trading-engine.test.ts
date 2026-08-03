import { describe, expect, it } from 'vitest'
import { markets, settings } from './demo-data'
import { cancelOrder, portfolioMetrics, requireAdmin, submitOrder, type TradingState } from './trading-engine'
import type { UserProfile } from '../types/trading'

const user: UserProfile = {
  id: 'u-1',
  email: 'user@example.com',
  displayName: 'User',
  role: 'user',
  status: 'active',
  createdAt: '2026-07-30T00:00:00.000Z',
  startingVirtualBalance: 100_000,
}

const admin: UserProfile = { ...user, id: 'admin-1', email: 'admin@example.com', role: 'admin' }

function state(overrides: Partial<TradingState> = {}): TradingState {
  return {
    user,
    account: { userId: user.id, cash: 100_000, startingBalance: 100_000 },
    markets,
    positions: [],
    orders: [],
    trades: [],
    settings,
    ...overrides,
  }
}

describe('trading engine', () => {
  it('fills a market buy and updates cash and position average', () => {
    const result = submitOrder(state(), { userId: user.id, marketId: 'm-aapl', side: 'buy', orderType: 'market', quantity: 10 })

    expect(result.order.status).toBe('filled')
    expect(result.trade?.side).toBe('buy')
    expect(result.state.positions[0].quantity).toBe(10)
    expect(result.state.account.cash).toBeLessThan(100_000)
  })

  it('rejects buys with insufficient funds', () => {
    const result = submitOrder(state({ account: { userId: user.id, cash: 100, startingBalance: 100_000 } }), {
      userId: user.id,
      marketId: 'm-aapl',
      side: 'buy',
      orderType: 'market',
      quantity: 1,
    })

    expect(result.order.status).toBe('rejected')
    expect(result.message).toBe('Insufficient buying power')
  })

  it('fills a sell and calculates realized P&L', () => {
    const result = submitOrder(state({ positions: [{ marketId: 'm-aapl', quantity: 10, averagePrice: 200, realizedPnl: 0 }] }), {
      userId: user.id,
      marketId: 'm-aapl',
      side: 'sell',
      orderType: 'market',
      quantity: 4,
    })

    expect(result.order.status).toBe('filled')
    expect(result.trade?.realizedPnl).toBeGreaterThan(0)
    expect(result.state.positions[0].quantity).toBe(6)
  })

  it('rejects sells without sufficient position', () => {
    const result = submitOrder(state(), { userId: user.id, marketId: 'm-aapl', side: 'sell', orderType: 'market', quantity: 1 })

    expect(result.order.status).toBe('rejected')
    expect(result.message).toBe('Insufficient position')
  })

  it('opens a limit order that has not reached price', () => {
    const result = submitOrder(state(), { userId: user.id, marketId: 'm-aapl', side: 'buy', orderType: 'limit', quantity: 2, limitPrice: 100 })

    expect(result.order.status).toBe('open')
    expect(result.trade).toBeUndefined()
  })

  it('fills a limit order when price condition is reached', () => {
    const result = submitOrder(state(), { userId: user.id, marketId: 'm-aapl', side: 'buy', orderType: 'limit', quantity: 2, limitPrice: 300 })

    expect(result.order.status).toBe('filled')
    expect(result.state.positions[0].quantity).toBe(2)
  })

  it('cancels open orders for the owner', () => {
    const open = submitOrder(state(), { userId: user.id, marketId: 'm-aapl', side: 'buy', orderType: 'limit', quantity: 2, limitPrice: 100 })
    const next = cancelOrder(open.state, open.order.id, user)

    expect(next.orders[0].status).toBe('cancelled')
  })

  it('prevents cross-user account manipulation', () => {
    expect(() => submitOrder(state(), { userId: 'u-2', marketId: 'm-aapl', side: 'buy', orderType: 'market', quantity: 1 })).toThrow('Unauthorized account access')
  })

  it('requires admin authorization for privileged actions', () => {
    expect(() => requireAdmin(user)).toThrow('Admin authorization required')
    expect(requireAdmin(admin)).toBeUndefined()
  })

  it('calculates unrealized P&L and equity', () => {
    const metrics = portfolioMetrics(state({ positions: [{ marketId: 'm-aapl', quantity: 10, averagePrice: 200, realizedPnl: 50 }] }))

    expect(metrics.unrealizedPnl).toBeGreaterThan(0)
    expect(metrics.realizedPnl).toBe(50)
    expect(metrics.totalEquity).toBeGreaterThan(100_000)
  })
})
