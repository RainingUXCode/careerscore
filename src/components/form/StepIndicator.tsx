interface Props {
  etapas: string[]
  etapaAtual: number
}

export function StepIndicator({ etapas, etapaAtual }: Props) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-xs font-medium text-[var(--color-muted)]">
        <span>
          Etapa {etapaAtual + 1} de {etapas.length}
        </span>
        <span className="text-[var(--color-ink)]">{etapas[etapaAtual]}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line-soft)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
          style={{ width: `${((etapaAtual + 1) / etapas.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
