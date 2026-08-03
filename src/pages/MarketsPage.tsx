import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Change, Panel, SectionHeader, StatusPill } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import type { AssetCategory } from '../types/trading'
import { compact, money } from '../utils/format'

const categories: Array<AssetCategory | 'All'> = ['All', 'Stocks', 'Crypto', 'Forex', 'Indices', 'Commodities']

export function MarketsPage() {
  const { markets } = useTrading()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<AssetCategory | 'All'>('All')
  const filtered = useMemo(() => markets.filter((market) =>
    (category === 'All' || market.category === category) &&
    `${market.symbol} ${market.name}`.toLowerCase().includes(query.toLowerCase()),
  ), [category, markets, query])

  return (
    <div className="page">
      <Panel>
        <SectionHeader title="Markets" action={<input className="search-input" placeholder="Search markets" value={query} onChange={(event) => setQuery(event.target.value)} />} />
        <div className="range-tabs left">{categories.map((item) => <button className={item === category ? 'active' : ''} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div>
        <table>
          <thead><tr><th>Symbol</th><th>Name</th><th>Category</th><th>Price</th><th>24h</th><th>Volume</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((market) => (
              <tr key={market.id}>
                <td><Link to={`/app/markets/${market.symbol}`}>{market.symbol}</Link></td>
                <td>{market.name}</td>
                <td>{market.category}</td>
                <td>{money(market.price, market.price < 5 ? 4 : 2)}</td>
                <td><Change value={market.change} percentValue={market.changePercent} /></td>
                <td>{market.volume ? compact(market.volume) : 'N/A'}</td>
                <td><StatusPill tone={market.isTradable ? 'green' : 'amber'}>{market.isTradable ? 'Tradable' : 'View only'}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
