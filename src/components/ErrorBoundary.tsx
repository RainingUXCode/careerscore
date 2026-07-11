import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  temErro: boolean
}

/**
 * Evita tela branca total se algum componente quebrar durante o render.
 * Mostra uma tela de recuperação simples, no mesmo tema visual do app,
 * com opção de tentar novamente ou recarregar a página.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { temErro: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { temErro: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Mantém rastro no console para depuração; não há serviço de telemetria nesta versão.
    console.error('CareerScore: erro não tratado capturado pelo ErrorBoundary.', error, info)
  }

  handleTentarNovamente = () => {
    this.setState({ temErro: false })
  }

  handleRecarregar = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.temErro) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] px-6 text-center text-[var(--color-ink)]">
        <span className="text-4xl">⚠️</span>
        <h1 className="font-display text-xl font-semibold">Algo deu errado</h1>
        <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">
          A aplicação encontrou um erro inesperado. Seus dados de rascunho continuam salvos neste navegador — você
          pode tentar novamente ou recarregar a página.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={this.handleTentarNovamente}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)]"
          >
            Tentar novamente
          </button>
          <button
            onClick={this.handleRecarregar}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-canvas)] hover:bg-[var(--color-primary-dark)] hover:text-white"
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
