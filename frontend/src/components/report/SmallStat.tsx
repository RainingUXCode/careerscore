import type { ReactNode } from 'react'

interface SmallStatProps {
  label: string
  value: ReactNode
}

/** Bloco pequeno de estatística (label + valor) usado dentro de ReportCard. */
export function SmallStat({ label, value }: SmallStatProps) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-well)] p-3">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}
