import { Link, useParams } from 'react-router-dom'
import { MarketChart } from '../components/MarketChart'
import { OrderTicket } from '../components/OrderTicket'
import { Change, Panel, SectionHeader, StatusPill } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { compact, money } from '../utils/format'

export function AssetPage() {
  const { symbol } = useParams()
  const { markets } = useTrading()
  const market = markets.find((item) => item.symbol === symbol) ?? markets[0]

  return (
    <div className="page">
      <div className="asset-header">
        <div><Link to="/app/markets">Markets</Link><h1>{market.symbol} <span>{market.name}</span></h1></div>
        <div><strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong><Change value={market.change} percentValue={market.changePercent} /></div>
      </div>
      <section className="workspace-grid">
        <Panel className="wide">
          <SectionHeader title="Price Chart" action={<div className="range-tabs"><button>1m</button><button>5m</button><button>15m</button><button>1H</button><button>4H</button><button>1D</button><button>1W</button><button>1M</button></div>} />
          <MarketChart market={market} />
        </Panel>
        <Panel>
          <SectionHeader title="Order Ticket" />
          <OrderTicket market={market} />
        </Panel>
        <Panel>
          <SectionHeader title="Market Information" action={<StatusPill>{market.dataMode}</StatusPill>} />
          <dl className="info-grid">
            <div><dt>Previous close</dt><dd>{money(market.previousClose)}</dd></div>
            <div><dt>Day range</dt><dd>{money(market.dayLow)} - {money(market.dayHigh)}</dd></div>
            <div><dt>52-week range</dt><dd>{money(market.yearLow)} - {money(market.yearHigh)}</dd></div>
            <div><dt>Volume</dt><dd>{market.volume ? compact(market.volume) : 'N/A'}</dd></div>
            <div><dt>Trading</dt><dd>{market.isTradable ? 'Available' : 'View only'}</dd></div>
          </dl>
        </Panel>
      </section>
    </div>
  )
}
