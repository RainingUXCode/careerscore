import type { Candidato } from '../../types/models'
import { Select } from '../ui/Select'

interface Props {
  candidato: Candidato
  atualizarCampo: <K extends keyof Candidato>(campo: K, valor: Candidato[K]) => void
}

export function PreferenciasCandidaturaSection({ candidato, atualizarCampo }: Props) {
  return (
    <div className="grid gap-3">
      <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">Preferências de candidatura</h2>
      <Select
        id="preferenciaVagasPcd"
        label="Deseja receber vagas exclusivas para pessoas com deficiência (PcD)?"
        value={candidato.preferenciaVagasPcd ?? 'prefiro_nao_informar'}
        onChange={(e) => atualizarCampo('preferenciaVagasPcd', e.target.value as Candidato['preferenciaVagasPcd'])}
        options={[
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' },
          { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
        ]}
      />
      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        Esta opção é usada somente para filtrar elegibilidade de vagas exclusivas PcD. Não pedimos diagnóstico, CID, laudo ou qualquer dado médico.
      </p>
    </div>
  )
}
