import { useRef } from 'react'
import type { Curriculo } from '../../types/models'

interface Props {
  curriculo?: Curriculo
  definirCurriculo: (arquivo: File) => void
  removerCurriculo: () => void
  erro?: string | null
}

export function CurriculoSection({ curriculo, definirCurriculo, removerCurriculo, erro }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function tratarArquivo(arquivo: File | undefined) {
    if (arquivo) definirCurriculo(arquivo)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          tratarArquivo(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
          px-6 py-12 text-center transition-colors hover:border-[var(--color-primary)]
          ${erro ? 'border-[var(--color-score-low)]' : 'border-[var(--color-line)]'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => tratarArquivo(e.target.files?.[0])}
        />
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Arraste seu currículo aqui ou clique para selecionar
        </span>
        <span className="text-xs text-[var(--color-muted)]">Formatos aceitos: PDF, DOCX (até 10MB)</span>
      </div>

      {curriculo && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-4 py-3">
          <span className="text-sm text-[var(--color-ink)]">📄 {curriculo.nomeArquivo}</span>
          <button
            onClick={removerCurriculo}
            className="text-xs font-medium text-[var(--color-score-low)] hover:underline"
          >
            Remover
          </button>
        </div>
      )}
      {erro && <span className="text-xs text-[var(--color-score-low)]">{erro}</span>}
    </div>
  )
}
