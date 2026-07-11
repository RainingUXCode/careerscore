import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const estilos: Record<string, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-canvas)] hover:bg-[var(--color-primary-dark)] hover:text-white disabled:opacity-40',
  secondary:
    'bg-[var(--color-canvas-raised)] text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-primary)] disabled:opacity-40',
  ghost:
    'bg-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-40',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium
        transition-colors duration-150 focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]
        disabled:cursor-not-allowed ${estilos[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
