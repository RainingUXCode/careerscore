import type { Candidato } from '../../types/models'
import { NivelExperiencia } from '../../types/enums'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { ErrosValidacao } from '../../services/validationService'
import { formatarTelefone } from '../../utils/formatters'

interface Props {
  candidato: Candidato
  atualizarCampo: <K extends keyof Candidato>(campo: K, valor: Candidato[K]) => void
  erros: ErrosValidacao
}

const opcoesNivel = Object.values(NivelExperiencia).map((v) => ({ value: v, label: v }))

export function DadosPessoaisSection({ candidato, atualizarCampo, erros }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input
        id="nome"
        label="Nome completo"
        placeholder="Seu nome"
        value={candidato.nome}
        onChange={(e) => atualizarCampo('nome', e.target.value)}
        error={erros.nome}
        className="sm:col-span-2"
      />
      <Input
        id="email"
        label="E-mail"
        type="email"
        placeholder="voce@email.com"
        value={candidato.email}
        onChange={(e) => atualizarCampo('email', e.target.value)}
        error={erros.email}
      />
      <Input
        id="telefone"
        label="Telefone"
        type="tel"
        placeholder="(83) 90000-0000"
        value={candidato.telefone}
        onChange={(e) => atualizarCampo('telefone', formatarTelefone(e.target.value))}
        maxLength={15}
        inputMode="numeric"
        error={erros.telefone}
      />
      <Input
        id="cidade"
        label="Cidade"
        placeholder="João Pessoa"
        value={candidato.cidade}
        onChange={(e) => atualizarCampo('cidade', e.target.value)}
        error={erros.cidade}
      />
      <Input
        id="estado"
        label="Estado"
        placeholder="PB"
        value={candidato.estado}
        onChange={(e) => atualizarCampo('estado', e.target.value)}
        error={erros.estado}
      />
      <Select
        id="nivelExperiencia"
        label="Nível de experiência"
        options={opcoesNivel}
        value={candidato.nivelExperiencia}
        onChange={(e) => atualizarCampo('nivelExperiencia', e.target.value as NivelExperiencia)}
        error={erros.nivelExperiencia}
        className="sm:col-span-2"
      />
    </div>
  )
}
