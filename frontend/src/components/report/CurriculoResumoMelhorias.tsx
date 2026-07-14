import type { AtsAnalysisResult } from '../../types/engine'
import { compararNotasAts } from '../../services/curriculoComparadorService'
import { Badge } from '../ui/Badge'

interface Props {
  atsOriginal?: AtsAnalysisResult
  atsOtimizado: AtsAnalysisResult | null
  calculando: boolean
}

export function CurriculoResumoMelhorias({ atsOriginal, atsOtimizado, calculando }: Props) {
  if (!atsOriginal || !atsOtimizado) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {calculando ? 'Calculando nota estimada...' : 'Nota de ATS anterior não disponível para comparação.'}
      </p>
    )
  }

  const comparacao = compararNotasAts(atsOriginal, atsOtimizado)
  const melhorou = comparacao.diferenca > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Nota anterior</p>
          <p className="font-mono text-3xl font-semibold text-[var(--color-ink-soft)]">{comparacao.notaAnterior}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Nota otimizada{calculando ? '...' : ''}</p>
          <p className="font-mono text-3xl font-semibold text-[var(--color-primary)]">{comparacao.notaOtimizada}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Diferença</p>
          <p
            className={`font-mono text-3xl font-semibold ${
              melhorou
                ? 'text-[var(--color-score-high)]'
                : comparacao.diferenca < 0
                  ? 'text-[var(--color-score-low)]'
                  : 'text-[var(--color-ink-soft)]'
            }`}
          >
            {comparacao.diferenca > 0 ? '+' : ''}
            {comparacao.diferenca}
          </p>
        </div>
      </div>

      {comparacao.categoriasMelhoradas.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-score-high)]">
            Principais melhorias
          </p>
          <div className="flex flex-wrap gap-1.5">
            {comparacao.categoriasMelhoradas.map(({ categoria, delta }) => (
              <Badge key={categoria.chave} tone="high">
                {categoria.nome} +{delta}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {comparacao.categoriasPendentes.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-score-mid)]">
            Ainda precisa da sua ação
          </p>
          <ul className="flex flex-col gap-1.5">
            {comparacao.categoriasPendentes.map((categoria) => (
              <li key={categoria.chave} className="text-sm text-[var(--color-ink-soft)]">
                <span className="font-medium text-[var(--color-ink)]">{categoria.nome}:</span>{' '}
                {categoria.recomendacoes[0] ?? categoria.justificativa}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
