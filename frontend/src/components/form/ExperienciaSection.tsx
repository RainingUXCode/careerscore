import type { ExperienciaProfissional } from '../../types/models'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DateInput } from './DateInput'

interface Props {
  experiencias: ExperienciaProfissional[]
  adicionar: () => void
  atualizar: (id: string, patch: Partial<ExperienciaProfissional>) => void
  remover: (id: string) => void
}

export function ExperienciaSection({ experiencias, adicionar, atualizar, remover }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {experiencias.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Nenhuma experiência adicionada. Inclua estágios, freelas ou empregos formais.
        </p>
      )}
      {experiencias.map((exp, i) => (
        <Card key={exp.idExperiencia}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Experiência {i + 1}</span>
            <button
              onClick={() => remover(exp.idExperiencia)}
              className="text-xs font-medium text-[var(--color-score-low)] hover:underline"
            >
              Remover
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Empresa"
              value={exp.empresa}
              onChange={(e) => atualizar(exp.idExperiencia, { empresa: e.target.value })}
            />
            <Input
              label="Cargo"
              value={exp.cargo}
              onChange={(e) => atualizar(exp.idExperiencia, { cargo: e.target.value })}
            />
            <TextArea
              label="Descrição das atividades"
              value={exp.descricao}
              onChange={(e) => atualizar(exp.idExperiencia, { descricao: e.target.value })}
              className="sm:col-span-2"
            />
            <DateInput
              label="Início"
              value={exp.dataInicio}
              onChange={(valor) => atualizar(exp.idExperiencia, { dataInicio: valor })}
            />
            <DateInput
              label="Fim"
              value={exp.dataFim ?? ''}
              disabled={exp.empregoAtual}
              onChange={(valor) => atualizar(exp.idExperiencia, { dataFim: valor })}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)] sm:col-span-2">
              <input
                type="checkbox"
                checked={exp.empregoAtual}
                onChange={(e) =>
                  atualizar(exp.idExperiencia, { empregoAtual: e.target.checked, dataFim: e.target.checked ? '' : exp.dataFim })
                }
              />
              Emprego atual
            </label>
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={adicionar} className="self-start">
        + Adicionar experiência
      </Button>
    </div>
  )
}
