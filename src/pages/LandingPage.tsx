import { Button } from '../components/ui/Button'
import { ScoreGauge } from '../components/ui/ScoreGauge'

interface LandingPageProps {
  onComecar: () => void
}

const pilares = [
  {
    icone: '📄',
    titulo: 'Análise de currículo',
    descricao: 'Leitura do seu histórico profissional para identificar forças e lacunas reais.',
  },
  {
    icone: '📊',
    titulo: 'Score de empregabilidade',
    descricao: 'Uma nota clara de 0 a 100, com o motivo de cada ponto ganho ou perdido.',
  },
  {
    icone: '💼',
    titulo: 'Vagas para agir agora',
    descricao: 'Separamos o que candidatar já e o que só monitorar, com compatibilidade calculada.',
  },
  {
    icone: '🚀',
    titulo: 'Plano de desenvolvimento',
    descricao: 'Tarefas priorizadas por semana para evoluir sua candidatura de forma concreta.',
  },
]

export function LandingPage({ onComecar }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M2 15 C 2 15, 6 4, 11 4 C 16 4, 20 15, 20 15"
              stroke="var(--color-primary)"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="font-display text-lg font-semibold">CareerScore</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-16 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(20,184,166,0.4)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              🤖 Análise de carreira com Inteligência Artificial
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-[var(--color-ink)] to-[var(--color-primary)] bg-clip-text text-transparent">
                Analise seu perfil profissional com Inteligência Artificial.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-[var(--color-ink-soft)]">
              CareerScore avalia sua experiência, competências e currículo para calcular sua
              empregabilidade, indicar vagas compatíveis e montar um plano de evolução real —
              não apenas uma lista de vagas.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button onClick={onComecar} className="px-6 py-3 text-base">
                Começar análise
              </Button>
              <span className="text-xs text-[var(--color-muted)]">Leva cerca de 5 minutos · sem cadastro</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
              <ScoreGauge score={82} />
              <div className="mt-2 flex justify-center gap-2">
                <span className="rounded-full bg-[var(--color-score-high-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-score-high)]">
                  Perfil competitivo
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-[var(--color-line-soft)] py-16 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((pilar) => (
            <div key={pilar.titulo} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-5">
              <span className="text-xl">{pilar.icone}</span>
              <h2 className="mt-3 font-display text-base font-semibold text-[var(--color-ink)]">
                {pilar.titulo}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {pilar.descricao}
              </p>
            </div>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 border-t border-[var(--color-line-soft)] py-16 text-center">
          <h2 className="font-display text-2xl font-semibold">Pronto para ver seu score?</h2>
          <Button onClick={onComecar} className="px-6 py-3 text-base">
            Começar análise
          </Button>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line-soft)] py-8 text-center text-xs text-[var(--color-muted)]">
        CareerScore — protótipo de análise de carreira. Nenhum dado é enviado a servidores externos nesta versão.
      </footer>
    </div>
  )
}
