import type { Idioma } from '../../types/models'
import { NivelProficiencia } from '../../types/enums'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

interface Props {
  idiomas: Idioma[]
  adicionar: () => void
  atualizar: (id: string, patch: Partial<Idioma>) => void
  remover: (id: string) => void
}

const opcoesNivel = Object.values(NivelProficiencia).map((v) => ({ value: v, label: v }))

export function IdiomasSection({ idiomas, adicionar, atualizar, remover }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {idiomas.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">Nenhum idioma adicionado além do português.</p>
      )}
      {idiomas.map((idioma) => (
        <div key={idioma.idIdioma} className="flex items-end gap-3">
          <Input
            label="Idioma"
            placeholder="Inglês, Espanhol..."
            value={idioma.nome}
            onChange={(e) => atualizar(idioma.idIdioma, { nome: e.target.value })}
            className="flex-1"
          />
          <Select
            label="Nível"
            options={opcoesNivel}
            value={idioma.nivelProficiencia}
            onChange={(e) => atualizar(idioma.idIdioma, { nivelProficiencia: e.target.value as NivelProficiencia })}
            className="w-40"
          />
          <button
            onClick={() => remover(idioma.idIdioma)}
            className="mb-2.5 text-xs font-medium text-[var(--color-score-low)] hover:underline"
          >
            Remover
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={adicionar} className="self-start">
        + Adicionar idioma
      </Button>
    </div>
  )
}
