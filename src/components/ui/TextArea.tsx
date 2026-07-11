import type { TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function TextArea({ label, error, id, className = '', ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={3}
        className={`rounded-lg border bg-[var(--color-canvas-raised)] px-3.5 py-2.5 text-sm text-[var(--color-ink)]
          placeholder:text-[var(--color-muted)] outline-none transition-colors resize-none
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]
          ${error ? 'border-[var(--color-score-low)]' : 'border-[var(--color-line)]'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--color-score-low)]">{error}</span>}
    </div>
  )
}
