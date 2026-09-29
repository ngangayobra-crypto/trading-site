import { Link } from 'react-router-dom'
import { MarketChart } from '../components/MarketChart'
import { Change, Metric, Panel, SectionHeader } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { compact, dateTime, money, number, percent } from '../utils/format'

export function OverviewPage() {
  const { account, markets, metrics, orders, positions, trades } = useTrading()
  const featured = markets[0]

  return (
    <div className="page">
      <section className="metric-grid">
        <Metric label="Total equity" value={money(metrics.totalEquity)} delta={metrics.returnPercent} />
        <Metric label="Available cash" value={money(account.cash)} />
        <Metric label="Invested value" value={money(metrics.investedValue)} />
        <Metric label="Unrealized P&L" value={money(metrics.unrealizedPnl)} delta={metrics.unrealizedPnl / account.startingBalance * 100} />
        <Metric label="Realized P&L" value={money(metrics.realizedPnl)} />
        <Metric label="Buying power" value={money(metrics.buyingPower)} />
      </section>
      <section className="workspace-grid">
        <Panel className="wide">
          <SectionHeader title="Performance" action={<div className="range-tabs"><button>1D</button><button>1W</button><button>1M</button><button>3M</button><button>6M</button><button>1Y</button><button>All</button></div>} />
          <MarketChart market={featured} />
        </Panel>
        <Panel>
          <SectionHeader title="Watchlist" action={<Link to="/app/watchlist">Manage</Link>} />
          <div className="quote-list">
            {markets.slice(0, 5).map((market) => (
              <Link to={`/app/markets/${market.symbol}`} key={market.id}>
                <span><strong>{market.symbol}</strong><small>{market.name}</small></span>
                <span><strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong><Change value={market.change} percentValue={market.changePercent} /></span>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel className="wide">
          <SectionHeader title="Portfolio" action={<Link to="/app/portfolio">View all</Link>} />
          <table>
            <thead><tr><th>Symbol</th><th>Asset</th><th>Quantity</th><th>Average</th><th>Current</th><th>Market value</th><th>P&L</th></tr></thead>
            <tbody>
              {positions.map((position) => {
               const market = markets.find((item) => item.id === position.marketId)
if (!market) return null
                const pnl = (market.price - position.averagePrice) * position.quantity
                return <tr key={position.marketId}><td>{market.symbol}</td><td>{market.name}</td><td>{number(position.quantity, 6)}</td><td>{money(position.averagePrice)}</td><td>{money(market.price)}</td><td>{money(market.price * position.quantity)}</td><td className={pnl >= 0 ? 'positive' : 'negative'}>{money(pnl)} ({percent(pnl / (position.averagePrice * position.quantity) * 100)})</td></tr>
              })}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <SectionHeader title="Recent Activity" />
          <div className="activity-list">
            {orders.slice(0, 3).map((order) => <span key={order.id}>{order.side.toUpperCase()} {number(order.quantity)} {markets.find((market) => market.id === order.marketId)?.symbol} - {order.status}</span>)}
            {trades.slice(0, 2).map((trade) => <span key={trade.id}>Trade {money(trade.totalValue)} - {dateTime(trade.createdAt)}</span>)}
            <span>Market volume sample: {compact(markets[0].volume)}</span>
          </div>
        </Panel>
      </section>
    </div>
  )
}
