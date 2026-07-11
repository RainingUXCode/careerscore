import { useEffect, useState } from 'react'

interface ScoreGaugeProps {
  score: number // 0-100
  size?: number
  label?: string
}

function corPorScore(score: number): string {
  if (score >= 70) return 'var(--color-score-high)'
  if (score >= 45) return 'var(--color-score-mid)'
  return 'var(--color-score-low)'
}

function normalizarScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, score))
}

/**
 * Elemento de assinatura visual do CareerScore: um arco de 270°
 * que se preenche de acordo com o score de empregabilidade.
 */
export function ScoreGauge({ score, size = 220, label = 'Score de empregabilidade' }: ScoreGaugeProps) {
  const scoreNormalizado = normalizarScore(score)
  const [valorAnimado, setValorAnimado] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setValorAnimado(scoreNormalizado))
    return () => cancelAnimationFrame(frame)
  }, [scoreNormalizado])

  const raio = size / 2 - 18
  const circunferencia = 2 * Math.PI * raio
  const arcoTotal = circunferencia * 0.75 // arco de 270°
  const offset = arcoTotal - (valorAnimado / 100) * arcoTotal
  const cor = corPorScore(scoreNormalizado)

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={14}
          strokeDasharray={`${arcoTotal} ${circunferencia}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={14}
          strokeDasharray={`${arcoTotal} ${circunferencia}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pt-4">
        <span
          className="font-mono text-5xl font-semibold tabular-nums"
          style={{ color: cor }}
        >
          {Math.round(valorAnimado)}
        </span>
        <span className="mt-1 text-xs text-[var(--color-muted)]">{label}</span>
      </div>
    </div>
  )
}
