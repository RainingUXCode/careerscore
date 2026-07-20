import type { AnalisePerfil } from '../../types/models'
import { benchmarkService } from '../../services/benchmarkService'
import { Badge } from '../ui/Badge'

interface BenchmarkCardProps {
  analise: AnalisePerfil
  area: string
}

export function BenchmarkCard({ analise, area }: BenchmarkCardProps) {
  const benchmark = benchmarkService.calcular(analise, area)
  const diferenca = analise.scoreEmpregabilidade - benchmark.mediaArea
  const acima = diferenca >= 0

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={acima ? 'high' : 'mid'}>
          {acima ? '+' : ''}
          {diferenca} pts vs referência
        </Badge>
        <Badge tone="primary">percentil {benchmark.percentil}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
        Em uma referência heurística local para {area}, seu score está acima de {benchmark.percentil}% dos perfis
        simulados da área. A categoria mais forte contra essa referência é {benchmark.categoriaMaisForte.label}.
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{benchmark.observacao}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Você</p>
          <p className="font-mono text-2xl font-semibold text-[var(--color-ink)]">{analise.scoreEmpregabilidade}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Referência da área</p>
          <p className="font-mono text-2xl font-semibold text-[var(--color-ink)]">{benchmark.mediaArea}</p>
        </div>
      </div>
    </div>
  )
}
