import type { Candidato } from '../../types/models'
import { NomeArea } from '../../types/enums'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import type { ErrosValidacao } from '../../services/validationService'

interface Props {
  candidato: Candidato
  atualizarAreaInteresse: (nome: NomeArea, nomePersonalizado?: string) => void
  erros: ErrosValidacao
}

const opcoes = Object.values(NomeArea).map((v) => ({ value: v, label: v }))

export function AreaInteresseSection({ candidato, atualizarAreaInteresse, erros }: Props) {
  const isOutro = candidato.areaInteresse.nome === NomeArea.OUTRO
  return (
    <div className="grid gap-5">
      <Select
        id="areaInteresse"
        label="Área de interesse"
        options={opcoes}
        value={candidato.areaInteresse.nome}
        onChange={(e) => atualizarAreaInteresse(e.target.value as NomeArea, candidato.areaInteresse.nomePersonalizado)}
        error={erros.areaInteresse}
      />
      {isOutro && (
        <Input
          id="areaPersonalizada"
          label="Descreva sua área"
          placeholder="Ex: Educação, Direito..."
          value={candidato.areaInteresse.nomePersonalizado ?? ''}
          onChange={(e) => atualizarAreaInteresse(NomeArea.OUTRO, e.target.value)}
          error={erros.areaInteressePersonalizada}
        />
      )}
    </div>
  )
}
