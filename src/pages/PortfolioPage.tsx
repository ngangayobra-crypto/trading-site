import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Metric, Panel, SectionHeader } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { money, number, percent } from '../utils/format'

const colors = ['#3ddc97', '#6ba4ff', '#f0b84a', '#ff6961', '#9da6b5']

export function PortfolioPage() {
  const { account, markets, metrics, positions } = useTrading()
  const allocation = positions
    .map((position) => {
      const market = markets.find((item) => item.id === position.marketId)
      if (!market) return null
      return { name: market.symbol, value: Number((market.price * position.quantity).toFixed(2)) }
    })
    .filter((entry): entry is { name: string; value: number } => entry !== null)

  return (
    <div className="page">
      <section className="metric-grid">
        <Metric label="Portfolio value" value={money(metrics.totalEquity)} delta={metrics.returnPercent} />
        <Metric label="Cash" value={money(account.cash)} />
        <Metric label="Invested" value={money(metrics.investedValue)} />
        <Metric label="Total return" value={money(metrics.totalPnl)} delta={metrics.returnPercent} />
      </section>
      <section className="workspace-grid">
        <Panel className="wide">
          <SectionHeader title="Holdings" />
          <table>
            <thead><tr><th>Asset</th><th>Quantity</th><th>Avg. Price</th><th>Current Price</th><th>Market Value</th><th>P&L</th><th>P&L %</th></tr></thead>
            <tbody>
              {positions.map((position) => {
                const market = markets.find((item) => item.id === position.marketId)
if (!market) return null
                const value = market.price * position.quantity
                const pnl = (market.price - position.averagePrice) * position.quantity
                return <tr key={position.marketId}><td>{market.symbol} <small>{market.name}</small></td><td>{number(position.quantity, 6)}</td><td>{money(position.averagePrice)}</td><td>{money(market.price)}</td><td>{money(value)}</td><td className={pnl >= 0 ? 'positive' : 'negative'}>{money(pnl)}</td><td className={pnl >= 0 ? 'positive' : 'negative'}>{percent(pnl / (position.averagePrice * position.quantity) * 100)}</td></tr>
              })}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <SectionHeader title="Asset Allocation" />
          <div className="pie">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
                  {allocation.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => money(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>
    </div>
  )
}
