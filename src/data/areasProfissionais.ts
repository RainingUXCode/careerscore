import type { AreaProfissional } from '../types/area'

/**
 * Catálogo inicial de áreas profissionais. Orientado a dados — para adicionar
 * uma nova área, basta incluir um novo objeto aqui, sem alterar nenhum tipo
 * ou enum central. Cada área pode opcionalmente ter subáreas (categoriaPaiId
 * apontando para o id da área ampla).
 */
export const areasProfissionais: AreaProfissional[] = [
  { id: 'administracao', nome: 'Administração', slug: 'administracao', sinonimos: ['administrativo', 'gestão administrativa'], palavrasRelacionadas: ['organização', 'processos', 'rotinas administrativas'] },
  { id: 'atendimento', nome: 'Atendimento', slug: 'atendimento', sinonimos: ['atendimento ao cliente', 'suporte ao cliente', 'sac'], palavrasRelacionadas: ['relacionamento com cliente'] },
  { id: 'comercial-vendas', nome: 'Comercial e Vendas', slug: 'comercial-vendas', sinonimos: ['vendas', 'comercial', 'representante comercial'], palavrasRelacionadas: ['negociação', 'prospecção'] },
  { id: 'comunicacao', nome: 'Comunicação', slug: 'comunicacao', sinonimos: ['jornalismo', 'relações públicas', 'assessoria de imprensa'] },
  { id: 'contabilidade', nome: 'Contabilidade', slug: 'contabilidade', sinonimos: ['contábil', 'contabil'], palavrasRelacionadas: ['fiscal', 'tributário'] },
  { id: 'design', nome: 'Design', slug: 'design', sinonimos: ['design gráfico', 'ux/ui', 'design de produto'] },
  { id: 'direito', nome: 'Direito', slug: 'direito', sinonimos: ['jurídico', 'advocacia', 'juridico'] },
  { id: 'educacao', nome: 'Educação', slug: 'educacao', sinonimos: ['ensino', 'docência', 'pedagogia', 'docencia'] },
  { id: 'engenharia', nome: 'Engenharia', slug: 'engenharia', sinonimos: ['engenharia civil', 'engenharia de produção'] },
  { id: 'financas', nome: 'Finanças', slug: 'financas', sinonimos: ['financeiro', 'financas'], palavrasRelacionadas: ['planejamento financeiro', 'controladoria'] },
  { id: 'fisioterapia', nome: 'Fisioterapia', slug: 'fisioterapia', categoriaPaiId: 'saude', sinonimos: ['fisioterapeuta'] },
  { id: 'gestao-de-pessoas', nome: 'Gestão de Pessoas', slug: 'gestao-de-pessoas', sinonimos: ['recursos humanos', 'rh', 'recrutamento e seleção', 'recrutamento e selecao'] },
  { id: 'logistica', nome: 'Logística', slug: 'logistica', sinonimos: ['logistica', 'supply chain', 'operações logísticas'] },
  { id: 'marketing', nome: 'Marketing', slug: 'marketing', categoriaPaiId: 'comunicacao', sinonimos: ['marketing digital', 'growth'] },
  { id: 'recursos-humanos', nome: 'Recursos Humanos', slug: 'recursos-humanos', categoriaPaiId: 'gestao-de-pessoas', sinonimos: ['rh', 'departamento pessoal', 'dp'] },
  { id: 'saude', nome: 'Saúde', slug: 'saude', sinonimos: ['saude', 'área da saúde'] },
  { id: 'tecnologia', nome: 'Tecnologia', slug: 'tecnologia', sinonimos: ['tecnologia e dados', 'ti', 'desenvolvimento de software'] },
]

const porId = new Map(areasProfissionais.map((area) => [area.id, area]))
const porSlug = new Map(areasProfissionais.map((area) => [area.slug, area]))

export function obterAreaPorId(id: string): AreaProfissional | undefined {
  return porId.get(id)
}

export function obterAreaPorSlug(slug: string): AreaProfissional | undefined {
  return porSlug.get(slug)
}
