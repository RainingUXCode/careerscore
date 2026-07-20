import type { Escolaridade, TipoFormacao } from '../../types/models'
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
const opcoesTipoFormacao: Array<{ value: TipoFormacao; label: string }> = [
  { value: 'ensino_fundamental', label: 'Ensino Fundamental' },
  { value: 'ensino_medio', label: 'Ensino Médio' },
  { value: 'ensino_tecnico', label: 'Ensino Técnico' },
  { value: 'tecnologo', label: 'Tecnólogo' },
  { value: 'bacharelado', label: 'Bacharelado' },
  { value: 'licenciatura', label: 'Licenciatura' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
  { value: 'mba', label: 'MBA' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
]

function mostraCurso(tipo?: TipoFormacao): boolean {
  return Boolean(tipo && tipo !== 'ensino_fundamental' && tipo !== 'ensino_medio')
}

function mostraInicio(tipo?: TipoFormacao): boolean {
  return Boolean(tipo && tipo !== 'ensino_fundamental' && tipo !== 'ensino_medio')
}

function rotuloCurso(tipo?: TipoFormacao): string {
  if (tipo === 'ensino_tecnico') return 'Nome do curso técnico'
  if (tipo === 'mestrado' || tipo === 'doutorado') return 'Nome do programa'
  return 'Nome do curso'
}

export function EscolaridadeSection({ escolaridades, adicionar, atualizar, remover }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {escolaridades.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Nenhuma formação adicionada ainda. Inclua ensino médio, técnico, graduação ou pós-graduação quando fizer sentido para seu perfil.
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
            <Select
              label="Tipo de formação"
              placeholder="Selecione"
              options={opcoesTipoFormacao}
              value={esc.tipoFormacao ?? ''}
              onChange={(e) =>
                atualizar(esc.idEscolaridade, {
                  tipoFormacao: e.target.value as TipoFormacao,
                  nivel: e.target.value,
                  curso: mostraCurso(e.target.value as TipoFormacao) ? esc.curso : '',
                  dataInicio: mostraInicio(e.target.value as TipoFormacao) ? esc.dataInicio : '',
                })
              }
            />
            <Input
              label="Instituição/escola"
              value={esc.instituicao}
              onChange={(e) => atualizar(esc.idEscolaridade, { instituicao: e.target.value })}
            />
            {mostraCurso(esc.tipoFormacao) && (
              <Input
                label={rotuloCurso(esc.tipoFormacao)}
                value={esc.curso}
                onChange={(e) => atualizar(esc.idEscolaridade, { curso: e.target.value })}
              />
            )}
            <Select
              label="Status"
              options={opcoesStatus}
              value={esc.status}
              onChange={(e) => atualizar(esc.idEscolaridade, { status: e.target.value as StatusCurso })}
            />
            {mostraInicio(esc.tipoFormacao) && (
              <DateInput
                label="Início"
                value={esc.dataInicio}
                onChange={(valor) => atualizar(esc.idEscolaridade, { dataInicio: valor })}
              />
            )}
            <DateInput
              label={mostraInicio(esc.tipoFormacao) ? 'Fim (ou previsão)' : 'Ano de conclusão ou previsão'}
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
