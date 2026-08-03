import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { money, percent } from '../utils/format'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  )
}

export function Metric({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {delta !== undefined && (
        <small className={delta >= 0 ? 'positive' : 'negative'}>
          {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {percent(delta)}
        </small>
      )}
    </div>
  )
}

export function Change({ value, percentValue }: { value: number; percentValue: number }) {
  return (
    <span className={value >= 0 ? 'positive change' : 'negative change'}>
      {value >= 0 ? '+' : ''}{money(value)} ({percent(percentValue)})
    </span>
  )
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'red' | 'amber' }) {
  return <span className={`status ${tone}`}>{children}</span>
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  )
}
