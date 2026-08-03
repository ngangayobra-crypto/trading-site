import { ArrowRight, BarChart3, CheckCircle2, LineChart, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MarketChart } from '../components/MarketChart'
import { Change } from '../components/Primitives'
import { markets } from '../services/demo-data'
import { money } from '../utils/format'

export function LandingPage() {
  const heroMarket = markets[0]

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand"><span className="brand-mark">N</span><strong>Northstar Paper</strong></Link>
        <nav>
          <a href="#markets">Markets</a>
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div>
          <Link to="/login">Log In</Link>
          <Link className="primary-link" to="/signup">Start Trading</Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span>PAPER TRADING - VIRTUAL FUNDS ONLY</span>
            <h1>Practice trading with real market workflows using virtual money.</h1>
            <p>Build discipline, test orders, manage a portfolio, and learn execution mechanics without deposits, withdrawals, or real brokerage claims.</p>
            <div className="hero-actions">
              <Link className="primary-link" to="/signup">Start Trading <ArrowRight size={17} /></Link>
              <Link to="/login">Open Demo</Link>
            </div>
          </div>
          <div className="terminal-preview" aria-label="Trading interface preview">
            <div className="preview-header">
              <div><strong>{heroMarket.symbol}</strong><span>{heroMarket.name}</span></div>
              <div><strong>{money(heroMarket.price)}</strong><Change value={heroMarket.change} percentValue={heroMarket.changePercent} /></div>
            </div>
            <MarketChart market={heroMarket} />
            <div className="preview-grid">
              {markets.slice(1, 5).map((market) => (
                <div key={market.id}>
                  <span>{market.symbol}</span>
                  <strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong>
                  <Change value={market.change} percentValue={market.changePercent} />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how" className="content-band three">
          <article><CheckCircle2 /><h2>Open a demo account</h2><p>Receive a configurable virtual balance and a clean simulated account ledger.</p></article>
          <article><LineChart /><h2>Trade live-shaped markets</h2><p>Market and limit orders run through a server-side-ready trading engine.</p></article>
          <article><BarChart3 /><h2>Track performance</h2><p>Monitor equity, cash, allocation, realized P&L, and unrealized P&L.</p></article>
        </section>
        <section id="markets" className="market-strip">
          {markets.map((market) => <span key={market.id}>{market.symbol} <strong>{money(market.price, market.price < 5 ? 4 : 2)}</strong></span>)}
        </section>
        <section id="features" className="content-band two">
          <article><ShieldCheck /><h2>Security first</h2><p>Supabase Auth, PostgreSQL RLS, audit logs, server-side authorization, and no browser service keys.</p></article>
          <article><LockKeyhole /><h2>Simulation guardrails</h2><p>No real deposits or withdrawals. Every authenticated screen states that funds are virtual.</p></article>
        </section>
        <section id="faq" className="faq">
          <h2>Frequently asked questions</h2>
          <details open><summary>Is this a real brokerage?</summary><p>No. It is a paper-trading simulator for virtual funds only.</p></details>
          <details><summary>Can prices be connected to a real provider?</summary><p>Yes. The code isolates market data so a server-side provider can replace the demo provider.</p></details>
          <details><summary>Can normal users edit balances or roles?</summary><p>No. The included schema and engine keep privileged changes behind database and server authorization.</p></details>
        </section>
      </main>
    </div>
  )
}
