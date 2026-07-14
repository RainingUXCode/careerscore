import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-lg border bg-[var(--color-canvas-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)]
          placeholder:text-[var(--color-muted)] outline-none transition-colors
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]
          ${error ? 'border-[var(--color-score-low)]' : 'border-[var(--color-line)]'} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error ? (
        <span className="text-xs text-[var(--color-score-low)]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </div>
  )
}
