import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'primary' | 'high' | 'mid' | 'low'
}

const tons: Record<string, string> = {
  neutral: 'bg-[var(--color-line-soft)] text-[var(--color-ink-soft)]',
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-bright)]',
  high: 'bg-[var(--color-score-high-soft)] text-[var(--color-score-high)]',
  mid: 'bg-[var(--color-score-mid-soft)] text-[var(--color-score-mid)]',
  low: 'bg-[var(--color-score-low-soft)] text-[var(--color-score-low)]',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tons[tone]}`}>
      {children}
    </span>
  )
}
