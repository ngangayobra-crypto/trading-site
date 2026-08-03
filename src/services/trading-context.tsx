import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { adminUser, demoUser, initialPositions, markets, seedAuditLogs, seedNotifications, seedOrders, seedTrades, settings } from './demo-data'
import { cancelOrder, portfolioMetrics, submitOrder, type OrderRequest, type TradingState } from './trading-engine'
import type { AuditLog, Notification, UserProfile } from '../types/trading'

interface TradingContextValue extends TradingState {
  session: UserProfile | null
  notifications: Notification[]
  auditLogs: AuditLog[]
  metrics: ReturnType<typeof portfolioMetrics>
  login: (email: string) => void
  signup: (email: string, displayName: string) => void
  logout: () => void
  submitVirtualOrder: (request: Omit<OrderRequest, 'userId'>) => string
  cancelVirtualOrder: (orderId: string) => void
  markAllNotificationsRead: () => void
  toggleRole: () => void
}

const TradingContext = createContext<TradingContextValue | null>(null)

const initialState: TradingState = {
  user: demoUser,
  account: { userId: demoUser.id, cash: 83_250.44, startingBalance: settings.defaultStartingBalance },
  markets,
  positions: initialPositions,
  orders: seedOrders,
  trades: seedTrades,
  settings,
}

export function DemoTradingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TradingState>(initialState)
  const [session, setSession] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState(seedNotifications)
  const [auditLogs, setAuditLogs] = useState(seedAuditLogs)

  const value = useMemo<TradingContextValue>(() => ({
    ...state,
    session,
    notifications,
    auditLogs,
    metrics: portfolioMetrics(state),
    login(email) {
      const nextUser = email.toLowerCase().includes('admin') ? adminUser : demoUser
      setSession(nextUser)
      setState((current) => ({ ...current, user: nextUser, account: { ...current.account, userId: nextUser.id } }))
      setAuditLogs((logs) => [{ id: crypto.randomUUID(), action: 'LOGIN', actor: email, target: nextUser.id, createdAt: new Date().toISOString() }, ...logs])
    },
    signup(email, displayName) {
      const nextUser = { ...demoUser, id: crypto.randomUUID(), email, displayName, createdAt: new Date().toISOString() }
      setSession(nextUser)
      setState((current) => ({
        ...current,
        user: nextUser,
        account: { userId: nextUser.id, cash: current.settings.defaultStartingBalance, startingBalance: current.settings.defaultStartingBalance },
        positions: [],
        orders: [],
        trades: [],
      }))
    },
    logout() {
      setAuditLogs((logs) => session ? [{ id: crypto.randomUUID(), action: 'LOGOUT', actor: session.email, target: session.id, createdAt: new Date().toISOString() }, ...logs] : logs)
      setSession(null)
    },
    submitVirtualOrder(request) {
      const activeUser = session ?? state.user
      const result = submitOrder(state, { ...request, userId: activeUser.id })
      setState(result.state)
      setNotifications((items) => [{
        id: crypto.randomUUID(),
        title: result.order.status === 'filled' ? 'Order filled' : 'Order update',
        body: result.message,
        read: false,
        createdAt: new Date().toISOString(),
      }, ...items])
      setAuditLogs((logs) => [{ id: crypto.randomUUID(), action: result.order.status === 'filled' ? 'TRADE_EXECUTED' : 'ORDER_CREATED', actor: activeUser.email, target: result.order.id, createdAt: new Date().toISOString() }, ...logs])
      return result.message
    },
    cancelVirtualOrder(orderId) {
      const activeUser = session ?? state.user
      setState(cancelOrder(state, orderId, activeUser))
      setNotifications((items) => [{ id: crypto.randomUUID(), title: 'Order cancelled', body: 'Eligible virtual order cancelled.', read: false, createdAt: new Date().toISOString() }, ...items])
      setAuditLogs((logs) => [{ id: crypto.randomUUID(), action: 'ORDER_CANCELLED', actor: activeUser.email, target: orderId, createdAt: new Date().toISOString() }, ...logs])
    },
    markAllNotificationsRead() {
      setNotifications((items) => items.map((item) => ({ ...item, read: true })))
    },
    toggleRole() {
      const nextUser = state.user.role === 'admin' ? demoUser : adminUser
      setSession(nextUser)
      setState((current) => ({ ...current, user: nextUser, account: { ...current.account, userId: nextUser.id } }))
    },
  }), [auditLogs, notifications, session, state])

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) throw new Error('useTrading must be used inside DemoTradingProvider')
  return context
}
