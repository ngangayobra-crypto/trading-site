import { Navigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Metric, Panel, SectionHeader, StatusPill } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { compact, dateTime, money } from '../utils/format'

const activity = [
  { day: 'Mon', users: 24, volume: 420 },
  { day: 'Tue', users: 31, volume: 510 },
  { day: 'Wed', users: 38, volume: 735 },
  { day: 'Thu', users: 45, volume: 690 },
  { day: 'Fri', users: 52, volume: 840 },
]

export function AdminPage() {
  const { auditLogs, markets, orders, positions, session, settings, trades } = useTrading()

  if (session?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="page">
      <section className="metric-grid">
        <Metric label="Total users" value="2 demo" />
        <Metric label="Total virtual money" value={money(settings.defaultStartingBalance * 2)} />
        <Metric label="Total trades" value={String(trades.length)} />
        <Metric label="Open positions" value={String(positions.length)} />
        <Metric label="Orders" value={String(orders.length)} />
        <Metric label="System status" value={settings.maintenanceMode ? 'Maintenance' : 'Operational'} />
      </section>
      <section className="workspace-grid">
        <Panel className="wide">
          <SectionHeader title="Platform Activity" />
          <div className="chart compact tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <XAxis dataKey="day" stroke="#7d8594" />
                <YAxis stroke="#7d8594" />
                <Tooltip contentStyle={{ background: '#12151c', border: '1px solid #303642' }} />
                <Bar dataKey="users" fill="#6ba4ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="volume" fill="#3ddc97" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHeader title="Economy Controls" />
          <dl className="info-grid">
            <div><dt>Default balance</dt><dd>{money(settings.defaultStartingBalance)}</dd></div>
            <div><dt>Max order</dt><dd>{money(settings.maximumOrderValue)}</dd></div>
            <div><dt>Max position</dt><dd>{money(settings.maximumPositionValue)}</dd></div>
            <div><dt>Fee</dt><dd>{(settings.tradingFeeRate * 100).toFixed(3)}%</dd></div>
          </dl>
        </Panel>
        <Panel>
          <SectionHeader title="Market Management" />
          <div className="activity-list">
            {markets.map((market) => <span key={market.id}>{market.symbol} <StatusPill tone={market.isTradable ? 'green' : 'amber'}>{market.isTradable ? 'enabled' : 'view only'}</StatusPill> {compact(market.volume)}</span>)}
          </div>
        </Panel>
        <Panel className="wide">
          <SectionHeader title="Audit Log" />
          <table>
            <thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Target</th></tr></thead>
            <tbody>{auditLogs.map((log) => <tr key={log.id}><td>{dateTime(log.createdAt)}</td><td>{log.action}</td><td>{log.actor}</td><td>{log.target}</td></tr>)}</tbody>
          </table>
        </Panel>
      </section>
    </div>
  )
}
