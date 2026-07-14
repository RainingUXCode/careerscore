import { useEffect, useState } from 'react'

interface ProcessingPageProps {
  onFinalizado: () => void
}

const etapasProcessamento = [
  'Lendo dados do perfil...',
  'Lendo o conteúdo do currículo para a checagem de ATS...',
  'Consultando seu GitHub e lendo certificados...',
  'Calculando score de empregabilidade...',
  'Comparando com vagas monitoradas...',
  'Montando plano de ação...',
]

export function ProcessingPage({ onFinalizado }: ProcessingPageProps) {
  const [etapaAtual, setEtapaAtual] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setEtapaAtual((atual) => Math.min(atual + 1, etapasProcessamento.length - 1))
    }, 550)
    const timeout = setTimeout(() => onFinalizado(), 550 * etapasProcessamento.length + 400)
    return () => {
      clearInterval(intervalo)
      clearTimeout(timeout)
    }
  }, [onFinalizado])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--color-canvas)] px-6">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-primary)]" />
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
          Analisando seu perfil
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{etapasProcessamento[etapaAtual]}</p>
      </div>
      <div className="flex gap-2">
        {etapasProcessamento.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= etapaAtual ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line-soft)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
