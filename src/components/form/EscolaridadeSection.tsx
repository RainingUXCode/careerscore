import type { Escolaridade } from '../../types/models'
import { StatusCurso } from '../../types/enums'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DateInput } from './DateInput'

interface Props {
  escolaridades: Escolaridade[]
  adicionar: () => void
  atualizar: (id: string, patch: Partial<Escolaridade>) => void
  remover: (id: string) => void
}

const opcoesStatus = Object.values(StatusCurso).map((v) => ({ value: v, label: v }))

export function EscolaridadeSection({ escolaridades, adicionar, atualizar, remover }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {escolaridades.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Nenhuma formação adicionada ainda. Inclua cursos técnicos, graduação ou pós-graduação.
        </p>
      )}
      {escolaridades.map((esc, i) => (
        <Card key={esc.idEscolaridade} className="relative">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Formação {i + 1}</span>
            <button
              onClick={() => remover(esc.idEscolaridade)}
              className="text-xs font-medium text-[var(--color-score-low)] hover:underline"
            >
              Remover
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Instituição"
              value={esc.instituicao}
              onChange={(e) => atualizar(esc.idEscolaridade, { instituicao: e.target.value })}
            />
            <Input
              label="Curso"
              value={esc.curso}
              onChange={(e) => atualizar(esc.idEscolaridade, { curso: e.target.value })}
            />
            <Input
              label="Nível"
              placeholder="Técnico, Graduação, Pós..."
              value={esc.nivel}
              onChange={(e) => atualizar(esc.idEscolaridade, { nivel: e.target.value })}
            />
            <Select
              label="Status"
              options={opcoesStatus}
              value={esc.status}
              onChange={(e) => atualizar(esc.idEscolaridade, { status: e.target.value as StatusCurso })}
            />
            <DateInput
              label="Início"
              value={esc.dataInicio}
              onChange={(valor) => atualizar(esc.idEscolaridade, { dataInicio: valor })}
            />
            <DateInput
              label="Fim (ou previsão)"
              value={esc.dataFim ?? ''}
              onChange={(valor) => atualizar(esc.idEscolaridade, { dataFim: valor })}
            />
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={adicionar} className="self-start">
        + Adicionar formação
      </Button>
    </div>
  )
}
