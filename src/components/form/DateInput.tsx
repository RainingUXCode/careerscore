import { useState } from 'react'

interface DateInputProps {
  label: string
  value: string // "YYYY-MM" ou "YYYY"
  onChange: (valor: string) => void
  disabled?: boolean
}

const anoAtual = new Date().getFullYear()
const anos = Array.from({ length: 60 }, (_, i) => anoAtual - i)

export function DateInput({ label, value, onChange, disabled }: DateInputProps) {
  const [somenteAno, setSomenteAno] = useState(() => /^\d{4}$/.test(value))

  function alternarSomenteAno(checked: boolean) {
    setSomenteAno(checked)
    if (checked && value.includes('-')) {
      onChange(value.split('-')[0])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-ink)]">{label}</label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={somenteAno}
            disabled={disabled}
            onChange={(e) => alternarSomenteAno(e.target.checked)}
          />
          Não lembro o mês
        </label>
      </div>

      {somenteAno ? (
        <select
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-3.5 py-2.5
            text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]
            focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:opacity-50"
        >
          <option value="" disabled hidden>
            Selecione o ano
          </option>
          {anos.map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="month"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-3.5 py-2.5
            text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]
            focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:opacity-50"
        />
      )}
    </div>
  )
}
