import type { ItemPadraoMercado } from '../../services/marketPatternService'

export function MarketPatternChart({ itens }: { itens: ItemPadraoMercado[] }) {
  if (itens.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Sem dados suficientes de vagas para essa área ainda.</p>
  }

  const semGap = itens.every((item) => item.candidatoPossui)

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {itens.map((item) => (
          <div key={item.competencia} className="rounded-lg bg-[var(--color-well)] p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--color-ink)]">{item.competencia}</span>
              <span className={item.candidatoPossui ? 'text-[var(--color-score-high)]' : 'text-[var(--color-score-mid)]'}>
                {item.candidatoPossui ? '✅' : '📌'}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.frequenciaPercentual}%`,
                  background: item.candidatoPossui ? 'var(--color-score-high)' : 'var(--color-score-mid)',
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              presente em {item.frequenciaPercentual}% das vagas da área
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border-l-[3px] border-[var(--color-primary)] bg-[var(--color-well)] p-3">
        <p className="mb-1 text-xs font-semibold text-[var(--color-primary)]">Resumo das lacunas de competências</p>
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {semGap
            ? 'Você cobre todas as competências mais exigidas nas vagas dessa área. Seu perfil está pronto para candidaturas competitivas.'
            : `Foque primeiro em ${itens
                .filter((i) => !i.candidatoPossui)
                .slice(0, 2)
                .map((i) => i.competencia)
                .join(' e ')} — são as lacunas mais frequentes entre as vagas monitoradas.`}
        </p>
      </div>
    </div>
  )
}
