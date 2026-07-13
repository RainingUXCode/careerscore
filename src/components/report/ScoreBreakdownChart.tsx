import type { PontuacaoDetalhes } from '../../types/models'
import { categoriasPontuacao } from '../../services/benchmarkService'

export function ScoreBreakdownChart({ detalhes }: { detalhes: PontuacaoDetalhes }) {
  return (
    <div className="flex flex-col gap-3">
      {categoriasPontuacao.map((categoria) => {
        const detalhe = detalhes[categoria.chave]
        const valor = detalhe?.pontos ?? 0
        const maximo = detalhe?.maximo ?? categoria.maximo
        const percentual = Math.min(100, Math.round((valor / maximo) * 100))

        return (
          <div key={categoria.chave} className="rounded-lg bg-[var(--color-well)] p-3">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[var(--color-ink-soft)]">{detalhe?.titulo ?? categoria.label}</span>
              <span className="font-mono text-[var(--color-muted)]">
                {valor}/{maximo}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-line-soft)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${percentual}%` }}
              />
            </div>
            {detalhe && (
              <div className="mt-2 grid gap-2 text-xs leading-relaxed text-[var(--color-muted)]">
                <p>{detalhe.justificativa}</p>
                {detalhe.evidencias.length > 0 && (
                  <p>
                    <strong className="text-[var(--color-ink-soft)]">Evidências:</strong>{' '}
                    {detalhe.evidencias.join(' ')}
                  </p>
                )}
                {detalhe.comoMelhorar.length > 0 && (
                  <p>
                    <strong className="text-[var(--color-ink-soft)]">Como melhorar:</strong>{' '}
                    {detalhe.comoMelhorar.join(' ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
