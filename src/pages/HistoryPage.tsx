import { useState } from 'react'
import { EmptyState, Panel, SectionHeader } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { dateTime, money, number } from '../utils/format'

export function HistoryPage() {
  const { markets, trades } = useTrading()
  const [side, setSide] = useState('all')
  const visible = side === 'all' ? trades : trades.filter((trade) => trade.side === side)

  return (
    <div className="page">
      <Panel>
        <SectionHeader title="Trade History" action={<select value={side} onChange={(event) => setSide(event.target.value)}><option value="all">All sides</option><option value="buy">Buy</option><option value="sell">Sell</option></select>} />
        {visible.length === 0 ? <EmptyState title="No trades" body="Executed virtual trades will appear here." /> : (
          <table>
            <thead><tr><th>Timestamp</th><th>Symbol</th><th>Side</th><th>Quantity</th><th>Execution</th><th>Total value</th><th>Realized P&L</th></tr></thead>
            <tbody>{visible.map((trade) => <tr key={trade.id}><td>{dateTime(trade.createdAt)}</td><td>{markets.find((item) => item.id === trade.marketId)?.symbol}</td><td>{trade.side}</td><td>{number(trade.quantity, 6)}</td><td>{money(trade.executionPrice)}</td><td>{money(trade.totalValue)}</td><td className={trade.realizedPnl >= 0 ? 'positive' : 'negative'}>{money(trade.realizedPnl)}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
