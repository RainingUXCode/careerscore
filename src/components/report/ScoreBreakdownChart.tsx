import type { PontuacaoDetalhes } from '../../types/models'
import { categoriasPontuacao } from '../../services/benchmarkService'

export function ScoreBreakdownChart({ detalhes }: { detalhes: PontuacaoDetalhes }) {
  return (
    <div className="flex flex-col gap-3">
      {categoriasPontuacao.map((categoria) => {
        const valor = detalhes[categoria.chave]
        const percentual = Math.min(100, Math.round((valor / categoria.maximo) * 100))

        return (
          <div key={categoria.chave}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[var(--color-ink-soft)]">{categoria.label}</span>
              <span className="font-mono text-[var(--color-muted)]">
                {valor}/{categoria.maximo}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-line-soft)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
