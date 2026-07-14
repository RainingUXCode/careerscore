import type { PlanoAcao } from '../../types/models'
import { Badge } from '../ui/Badge'
import { formatarData } from '../../utils/formatters'

const tonsPorPrioridade: Record<PlanoAcao['prioridade'], 'low' | 'mid' | 'neutral'> = {
  Alta: 'low',
  Média: 'mid',
  Baixa: 'neutral',
}

interface PlanoAcaoListProps {
  tarefas: PlanoAcao[]
  concluidas?: Record<string, boolean>
  onAlternarConclusao?: (idPlano: string) => void
}

export function PlanoAcaoList({ tarefas, concluidas = {}, onAlternarConclusao }: PlanoAcaoListProps) {
  return (
    <ol className="flex flex-col gap-3">
      {tarefas.map((tarefa, i) => {
        const concluida = Boolean(concluidas[tarefa.idPlano])

        return (
          <li
            key={tarefa.idPlano}
            className={`flex items-start gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-4 ${
              concluida ? 'opacity-70' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={concluida}
              onChange={() => onAlternarConclusao?.(tarefa.idPlano)}
              className="mt-1 h-4 w-4"
              aria-label={`Marcar ${tarefa.titulo} como concluído`}
            />
            <span className="font-mono text-sm text-[var(--color-muted)]">{String(i + 1).padStart(2, '0')}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-semibold text-[var(--color-ink)] ${concluida ? 'line-through' : ''}`}>
                  {tarefa.titulo}
                </p>
                <Badge tone={tonsPorPrioridade[tarefa.prioridade]}>{tarefa.prioridade}</Badge>
                {concluida && <Badge tone="high">Concluído</Badge>}
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{tarefa.descricao}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Prazo: {formatarData(tarefa.prazo.slice(0, 7))}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
