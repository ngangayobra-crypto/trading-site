import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Change, Panel, SectionHeader } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { money } from '../utils/format'

export function WatchlistPage() {
  const { markets } = useTrading()

  return (
    <div className="page">
      <Panel>
        <SectionHeader title="Watchlist" />
        <div className="watch-grid">
          {markets.slice(0, 6).map((market) => (
            <Link className="watch-row" to={`/app/markets/${market.symbol}`} key={market.id}>
              <Star size={16} />
              <span><strong>{market.symbol}</strong><small>{market.name}</small></span>
              <span><strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong><Change value={market.change} percentValue={market.changePercent} /></span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}
