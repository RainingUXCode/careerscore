import type { HistoricoScoreItem } from '../../services/historyService'

function formatarMes(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(new Date(data))
}

function mesesEntre(inicio: string, fim: string): number {
  const a = new Date(inicio)
  const b = new Date(fim)
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth())
}

function montarResumo(historico: HistoricoScoreItem[]): string {
  if (historico.length < 2) return 'A partir da próxima análise, o gráfico mostra sua evolução.'

  const primeiro = historico[0]
  const ultimo = historico[historico.length - 1]
  const diferenca = ultimo.score - primeiro.score
  const movimento = diferenca >= 0 ? 'subiu' : 'caiu'
  const periodo = mesesEntre(primeiro.dataAnalise, ultimo.dataAnalise)
  const textoPeriodo = periodo > 0 ? `em ${periodo} ${periodo === 1 ? 'mês' : 'meses'}` : 'desde a primeira análise'

  return `Seu score ${movimento} de ${primeiro.score} para ${ultimo.score} ${textoPeriodo}.`
}

export function ScoreHistoryChart({ historico }: { historico: HistoricoScoreItem[] }) {
  const pontos = historico.slice(-6)
  const largura = 320
  const altura = 120
  const margem = 16
  const areaLargura = largura - margem * 2
  const areaAltura = altura - margem * 2
  const coordenadas = pontos.map((item, index) => {
    const x = pontos.length === 1 ? largura / 2 : margem + (index / (pontos.length - 1)) * areaLargura
    const y = margem + (1 - item.score / 100) * areaAltura
    return { ...item, x, y }
  })
  const path = coordenadas.map((ponto, index) => `${index === 0 ? 'M' : 'L'} ${ponto.x} ${ponto.y}`).join(' ')

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--color-ink-soft)]">{montarResumo(historico)}</p>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="h-32 w-full overflow-visible">
        <line x1={margem} x2={largura - margem} y1={altura - margem} y2={altura - margem} stroke="var(--color-line)" />
        <line x1={margem} x2={largura - margem} y1={margem} y2={margem} stroke="var(--color-line-soft)" />
        {path && <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />}
        {coordenadas.map((ponto) => (
          <g key={ponto.idAnalise}>
            <circle cx={ponto.x} cy={ponto.y} r="4" fill="var(--color-primary)" />
            <text x={ponto.x} y={ponto.y - 9} textAnchor="middle" className="fill-[var(--color-ink)] font-mono text-[10px]">
              {ponto.score}
            </text>
            <text x={ponto.x} y={altura + 6} textAnchor="middle" className="fill-[var(--color-muted)] text-[9px]">
              {formatarMes(ponto.dataAnalise)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
