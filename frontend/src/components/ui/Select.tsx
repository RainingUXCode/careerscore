import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, id, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-lg border bg-[var(--color-canvas-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)]
          outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2
          focus:ring-[var(--color-primary-soft)]
          ${error ? 'border-[var(--color-score-low)]' : 'border-[var(--color-line)]'} ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[var(--color-score-low)]">{error}</span>}
    </div>
  )
}
