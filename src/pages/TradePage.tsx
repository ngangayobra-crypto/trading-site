import { useState } from 'react'
import { MarketChart } from '../components/MarketChart'
import { OrderTicket } from '../components/OrderTicket'
import { Change, Panel, SectionHeader } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { money } from '../utils/format'

export function TradePage() {
  const { markets } = useTrading()
  const [marketId, setMarketId] = useState(markets[0].id)
  const market = markets.find((item) => item.id === marketId) ?? markets[0]

  return (
    <div className="page">
      <section className="workspace-grid">
        <Panel className="wide">
          <SectionHeader title="Trade" action={<select value={marketId} onChange={(event) => setMarketId(event.target.value)}>{markets.filter((item) => item.isTradable).map((item) => <option key={item.id} value={item.id}>{item.symbol} - {item.name}</option>)}</select>} />
          <div className="trade-heading"><strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong><Change value={market.change} percentValue={market.changePercent} /></div>
          <MarketChart market={market} />
        </Panel>
        <Panel>
          <SectionHeader title="Order Ticket" />
          <OrderTicket market={market} />
        </Panel>
      </section>
    </div>
  )
}
