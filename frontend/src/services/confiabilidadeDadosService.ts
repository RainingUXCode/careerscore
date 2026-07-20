import type { VagaNormalizada, ConfiabilidadeDadosVaga } from '../types/vaga'

interface ChecklistItem {
  label: string
  presente: boolean
}

/** Avalia a confiabilidade dos dados de uma vaga já normalizada, com o motivo explícito. */
export function calcularConfiabilidadeDados(vaga: Omit<VagaNormalizada, 'confiabilidadeDados'>): ConfiabilidadeDadosVaga {
  const checklist: ChecklistItem[] = [
    { label: 'descrição', presente: vaga.descricao.trim().length > 0 },
    { label: 'localização', presente: Boolean(vaga.localizacao.cidade || vaga.localizacao.estado) },
    { label: 'modalidade', presente: vaga.modalidadeInformada },
    { label: 'senioridade', presente: vaga.senioridadeInformada },
    { label: 'requisitos estruturados', presente: vaga.requisitosObrigatorios.length + vaga.requisitosDesejaveis.length > 0 },
    { label: 'data de publicação', presente: Boolean(vaga.dataPublicacao) },
    { label: 'data de expiração', presente: Boolean(vaga.dataExpiracao) },
    { label: 'salário', presente: Boolean(vaga.salario) },
    { label: 'URL de candidatura', presente: Boolean(vaga.urlOriginal) },
  ]

  const presentes = checklist.filter((item) => item.presente).length
  const ausentes = checklist.filter((item) => !item.presente).map((item) => item.label)
  const proporcao = presentes / checklist.length

  const nivel: ConfiabilidadeDadosVaga['nivel'] = proporcao >= 0.75 ? 'alta' : proporcao >= 0.5 ? 'media' : 'baixa'

  const motivo =
    ausentes.length === 0
      ? 'Todos os principais campos foram informados pela fonte.'
      : `Campos não informados pela fonte: ${ausentes.join(', ')}.`

  return { nivel, motivo }
}
