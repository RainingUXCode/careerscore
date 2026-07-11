import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface ReportCardProps {
  title: string
  children: ReactNode
  className?: string
}

/** Card padrão usado em todas as seções do relatório (Perfil/Vagas/Plano). */
export function ReportCard({ title, children, className = '' }: ReportCardProps) {
  return (
    <Card className={`rounded-xl p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] ${className}`}>
      <h2 className="mb-4 font-display text-base font-semibold text-[var(--color-ink)]">{title}</h2>
      {children}
    </Card>
  )
}
