import { Panel, SectionHeader, StatusPill } from '../components/Primitives'
import { useTrading } from '../services/trading-context'
import { money } from '../utils/format'

export function SettingsPage() {
  const { session, settings, toggleRole } = useTrading()

  return (
    <div className="page">
      <section className="workspace-grid">
        <Panel>
          <SectionHeader title="Profile" />
          <dl className="info-grid">
            <div><dt>Email</dt><dd>{session?.email}</dd></div>
            <div><dt>Display name</dt><dd>{session?.displayName}</dd></div>
            <div><dt>Role</dt><dd><StatusPill tone={session?.role === 'admin' ? 'amber' : 'neutral'}>{session?.role}</StatusPill></dd></div>
            <div><dt>Status</dt><dd>{session?.status}</dd></div>
          </dl>
          <button className="secondary" onClick={toggleRole}>Toggle demo admin role</button>
        </Panel>
        <Panel>
          <SectionHeader title="Security" />
          <div className="settings-list">
            <label><span>Password</span><button className="text-button">Change password</button></label>
            <label><span>Email verification</span><StatusPill tone="green">Enabled in Supabase</StatusPill></label>
            <label><span>Session persistence</span><StatusPill tone="green">Enabled</StatusPill></label>
          </div>
        </Panel>
        <Panel>
          <SectionHeader title="Trading Limits" />
          <dl className="info-grid">
            <div><dt>Default virtual balance</dt><dd>{money(settings.defaultStartingBalance)}</dd></div>
            <div><dt>Minimum order</dt><dd>{money(settings.minimumOrderValue)}</dd></div>
            <div><dt>Maximum order</dt><dd>{money(settings.maximumOrderValue)}</dd></div>
            <div><dt>Fee</dt><dd>{(settings.tradingFeeRate * 100).toFixed(3)}%</dd></div>
          </dl>
        </Panel>
      </section>
    </div>
  )
}
