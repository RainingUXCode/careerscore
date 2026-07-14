import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
