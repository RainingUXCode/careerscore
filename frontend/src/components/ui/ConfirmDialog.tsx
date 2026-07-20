import { useEffect } from 'react'
import { Button } from './Button'

interface AcaoDialogo {
  rotulo: string
  onClick: () => void
}

interface ConfirmDialogProps {
  aberto: boolean
  titulo: string
  mensagem: string
  /** Ação em destaque (ex: "Exportar mesmo assim"). */
  acaoPrimaria: AcaoDialogo
  /** Ação alternativa, mais segura (ex: "Revisar pendências"). */
  acaoSecundaria: AcaoDialogo
  /** Fechar sem escolher nenhuma ação (clique fora ou Esc). */
  onFechar: () => void
}

/**
 * Diálogo de confirmação genérico com dois rótulos customizados — diferente
 * de window.confirm(), que só oferece "OK/Cancelar" fixos pelo navegador.
 */
export function ConfirmDialog({ aberto, titulo, mensagem, acaoPrimaria, acaoSecundaria, onFechar }: ConfirmDialogProps) {
  useEffect(() => {
    if (!aberto) return
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        className="w-full max-w-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-titulo" className="mb-2 font-display text-base font-semibold text-[var(--color-ink)]">
          {titulo}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-[var(--color-ink-soft)]">{mensagem}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={acaoSecundaria.onClick}>
            {acaoSecundaria.rotulo}
          </Button>
          <Button variant="primary" onClick={acaoPrimaria.onClick}>
            {acaoPrimaria.rotulo}
          </Button>
        </div>
      </div>
    </div>
  )
}
