import { useState } from 'react'
import { EmptyState, Panel, SectionHeader, StatusPill } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import type { OrderStatus } from '../types/trading'
import { dateTime, money, number } from '../utils/format'

const filters: Array<'all' | OrderStatus> = ['all', 'open', 'filled', 'cancelled', 'rejected']

export function OrdersPage() {
  const { cancelVirtualOrder, markets, orders } = useTrading()
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  return (
    <div className="page">
      <Panel>
        <SectionHeader title="Orders" action={<div className="range-tabs">{filters.map((item) => <button className={item === filter ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>} />
        {visible.length === 0 ? <EmptyState title="No orders" body="Orders that match this filter will appear here." /> : (
          <table>
            <thead><tr><th>Date</th><th>Symbol</th><th>Side</th><th>Type</th><th>Quantity</th><th>Price</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {visible.map((order) => {
                const market = markets.find((item) => item.id === order.marketId)
                return <tr key={order.id}><td>{dateTime(order.createdAt)}</td><td>{market?.symbol}</td><td>{order.side}</td><td>{order.orderType}</td><td>{number(order.quantity, 6)}</td><td>{order.averageFillPrice ? money(order.averageFillPrice) : order.limitPrice ? money(order.limitPrice) : 'Market'}</td><td><StatusPill tone={order.status === 'filled' ? 'green' : order.status === 'rejected' ? 'red' : order.status === 'open' ? 'amber' : 'neutral'}>{order.status}</StatusPill></td><td>{['open', 'pending'].includes(order.status) && <button className="text-button" onClick={() => cancelVirtualOrder(order.id)}>Cancel</button>}</td></tr>
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
