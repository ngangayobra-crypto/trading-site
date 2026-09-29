import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTrading } from '../services/trading-context'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { login, signup } = useTrading()
  const navigate = useNavigate()
  const [email, setEmail] = useState(mode === 'login' ? 'demo@northstar.paper' : '')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'signup') signup(email)
    else login(email)
    navigate('/app')
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="brand"><span className="brand-mark">N</span><strong>Northstar Paper</strong></Link>
        <div>
          <span>PAPER TRADING - VIRTUAL FUNDS ONLY</span>
          <h1>{mode === 'login' ? 'Log in to your simulator' : 'Create a paper account'}</h1>
          <p>Enter an email address to continue. This local demo does not use passwords or send verification emails.</p>
        </div>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <button className="primary" type="submit">{mode === 'login' ? 'Log In' : 'Start Trading'}</button>
        <Link to={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Create account' : 'Already have an account?'}</Link>
      </form>
    </main>
  )
}
