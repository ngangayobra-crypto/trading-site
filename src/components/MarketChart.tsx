import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Market } from '../types/trading'
import { getHistory } from '../services/demo-data'
import { money } from '../utils/format'

export function MarketChart({ market, compact = false }: { market: Market; compact?: boolean }) {
  const data = getHistory(market, compact ? 32 : 96)

  return (
    <div className={compact ? 'chart compact' : 'chart'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${market.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={market.change >= 0 ? '#3ddc97' : '#ff6961'} stopOpacity={0.24} />
              <stop offset="95%" stopColor={market.change >= 0 ? '#3ddc97' : '#ff6961'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#242832" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: '#7d8594', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#7d8594', fontSize: 11 }} tickFormatter={(value) => money(Number(value), 0)} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} width={64} />
          <Tooltip
            contentStyle={{ background: '#12151c', border: '1px solid #303642', borderRadius: 6, color: '#edf1f7' }}
            formatter={(value) => [money(Number(value)), 'Price']}
            labelFormatter={(value) => `Point ${value}`}
          />
          <Area type="monotone" dataKey="price" stroke={market.change >= 0 ? '#3ddc97' : '#ff6961'} strokeWidth={2} fill={`url(#fill-${market.id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
