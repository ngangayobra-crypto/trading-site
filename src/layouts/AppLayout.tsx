import type { ReactNode } from 'react'
import { Bell, BriefcaseBusiness, CandlestickChart, Clock3, LayoutDashboard, ListOrdered, LogOut, Search, Settings, Shield, Star, UserRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTrading } from '../services/trading-context'
import { dateTime } from '../utils/format'

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/markets', label: 'Markets', icon: Search },
  { to: '/app/trade', label: 'Trade', icon: CandlestickChart },
  { to: '/app/portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
  { to: '/app/orders', label: 'Orders', icon: ListOrdered },
  { to: '/app/history', label: 'History', icon: Clock3 },
  { to: '/app/watchlist', label: 'Watchlist', icon: Star },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { session, logout, notifications, markAllNotificationsRead } = useTrading()
  const navigate = useNavigate()
  const unread = notifications.filter((item) => !item.read).length

  return (
    <div className="terminal-shell">
      <aside className="sidebar">
        <NavLink to="/app" className="brand">
          <span className="brand-mark">N</span>
          <span><strong>Northstar</strong><small>Paper Trading</small></span>
        </NavLink>
        <div className="paper-banner">PAPER TRADING - VIRTUAL FUNDS</div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/app'}><Icon size={17} />{label}</NavLink>
          ))}
          {session?.role === 'admin' && <NavLink to="/app/admin"><Shield size={17} />Admin</NavLink>}
        </nav>
        <div className="sidebar-bottom">
          <button type="button" onClick={markAllNotificationsRead}><Bell size={17} />Notifications <span>{unread}</span></button>
          <NavLink to="/app/settings"><Settings size={17} />Settings</NavLink>
          <button type="button"><UserRound size={17} />{session?.displayName}</button>
          <button type="button" onClick={() => { logout(); navigate('/') }}><LogOut size={17} />Logout</button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <strong>{session?.displayName}</strong>
            <span>Session active - {dateTime(new Date().toISOString())}</span>
          </div>
          <div className="topbar-actions">
            <span>SIMULATED DATA</span>
            <NavLink to="/app/trade">New order</NavLink>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
