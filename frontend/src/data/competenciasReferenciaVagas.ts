import type { CompetenciaReferencia } from '../types/competenciaReferenciaVaga'

let contador = 0
function id(): string {
  contador += 1
  return `comp-ref-${contador}`
}

function tecnica(nome: string, areas: string[], sinonimos: string[] = []): CompetenciaReferencia {
  return { id: id(), nome, tipo: 'tecnica', sinonimos, areasRelacionadas: areas }
}
function comportamental(nome: string, areas: string[], sinonimos: string[] = []): CompetenciaReferencia {
  return { id: id(), nome, tipo: 'comportamental', sinonimos, areasRelacionadas: areas }
}

/**
 * Catálogo de referência do motor de vagas. Independente do catálogo usado
 * pelo módulo de currículo (data/competenciasReferencia.ts), que permanece
 * intocado. Cada área pode ter várias competências técnicas e comportamentais.
 */
export const competenciasReferenciaVagas: CompetenciaReferencia[] = [
  // Tecnologia
  tecnica('JavaScript', ['tecnologia']),
  tecnica('TypeScript', ['tecnologia']),
  tecnica('React', ['tecnologia']),
  tecnica('SQL', ['tecnologia']),
  tecnica('Git', ['tecnologia']),
  tecnica('APIs REST', ['tecnologia'], ['api rest']),
  comportamental('Resolução de problemas', ['tecnologia', 'atendimento', 'administracao']),

  // Marketing / Comunicação
  tecnica('Planejamento de conteúdo', ['marketing', 'comunicacao']),
  tecnica('Redes sociais', ['marketing', 'comunicacao'], ['social media']),
  tecnica('Copywriting', ['marketing', 'comunicacao']),
  tecnica('Análise de métricas', ['marketing'], ['analise de metricas', 'analytics']),
  tecnica('Google Analytics', ['marketing']),
  comportamental('Comunicação', ['marketing', 'comunicacao', 'atendimento', 'educacao', 'gestao-de-pessoas', 'saude']),
  comportamental('Criatividade', ['marketing', 'design', 'comunicacao']),

  // Fisioterapia / Saúde
  tecnica('Avaliação funcional', ['fisioterapia', 'saude'], ['avaliacao funcional']),
  tecnica('Prontuário', ['fisioterapia', 'saude'], ['prontuario', 'prontuário eletrônico']),
  tecnica('Reabilitação', ['fisioterapia', 'saude'], ['reabilitacao']),
  tecnica('Anatomia', ['fisioterapia', 'saude']),
  comportamental('Atendimento ao paciente', ['fisioterapia', 'saude']),
  comportamental('Trabalho multidisciplinar', ['fisioterapia', 'saude'], ['trabalho em equipe multidisciplinar']),
  comportamental('Empatia', ['fisioterapia', 'saude', 'educacao', 'atendimento']),

  // Administração
  tecnica('Excel', ['administracao', 'financas', 'contabilidade', 'logistica']),
  tecnica('Organização documental', ['administracao'], ['organizacao documental']),
  tecnica('Controle de agenda', ['administracao']),
  tecnica('Emissão de relatórios', ['administracao', 'financas'], ['emissao de relatorios']),
  comportamental('Planejamento', ['administracao', 'gestao-de-pessoas', 'financas']),
  comportamental('Organização', ['administracao', 'logistica', 'atendimento']),

  // Comercial e Vendas
  tecnica('CRM', ['comercial-vendas', 'atendimento', 'marketing']),
  tecnica('Técnicas de negociação', ['comercial-vendas'], ['tecnicas de negociacao', 'negociação']),
  tecnica('Prospecção de clientes', ['comercial-vendas'], ['prospeccao de clientes', 'prospecção']),
  comportamental('Negociação', ['comercial-vendas', 'gestao-de-pessoas', 'atendimento']),
  comportamental('Resiliência', ['comercial-vendas'], ['resiliencia']),

  // Contabilidade / Finanças
  tecnica('Rotinas fiscais', ['contabilidade'], ['rotinas fiscais', 'fiscal']),
  tecnica('Conciliação bancária', ['contabilidade', 'financas'], ['conciliacao bancaria']),
  tecnica('Análise de balanços', ['contabilidade', 'financas'], ['analise de balancos']),
  tecnica('Fluxo de caixa', ['financas'], ['fluxo de caixa']),
  tecnica('Planejamento financeiro', ['financas']),

  // Direito
  tecnica('Elaboração de petições', ['direito'], ['elaboracao de peticoes', 'peticionamento']),
  tecnica('Pesquisa jurisprudencial', ['direito'], ['pesquisa jurisprudencial']),
  comportamental('Argumentação', ['direito'], ['argumentacao']),

  // Educação
  tecnica('Planejamento pedagógico', ['educacao'], ['planejamento pedagogico']),
  tecnica('Avaliação de aprendizagem', ['educacao'], ['avaliacao de aprendizagem']),
  comportamental('Didática', ['educacao'], ['didatica']),
  comportamental('Paciência', ['educacao', 'saude'], ['paciencia']),

  // Design
  tecnica('Figma', ['design', 'tecnologia']),
  tecnica('Adobe Photoshop', ['design']),
  tecnica('Prototipação', ['design'], ['prototipacao']),
  comportamental('Atenção aos detalhes', ['design', 'contabilidade', 'engenharia'], ['atencao aos detalhes']),

  // Engenharia
  tecnica('AutoCAD', ['engenharia']),
  tecnica('Gestão de obras', ['engenharia'], ['gestao de obras']),
  tecnica('Normas técnicas', ['engenharia'], ['normas tecnicas']),

  // Logística
  tecnica('Gestão de estoque', ['logistica'], ['gestao de estoque']),
  tecnica('Roteirização', ['logistica'], ['roteirizacao']),
  tecnica('Supply chain', ['logistica']),

  // Gestão de Pessoas / RH
  tecnica('Recrutamento e seleção', ['gestao-de-pessoas', 'recursos-humanos'], ['recrutamento e selecao']),
  tecnica('Folha de pagamento', ['recursos-humanos'], ['folha de pagamento', 'departamento pessoal']),
  comportamental('Gestão de conflitos', ['gestao-de-pessoas', 'atendimento'], ['gestao de conflitos']),

  // Atendimento
  tecnica('Atendimento multicanal', ['atendimento'], ['atendimento multicanal']),
  comportamental('Escuta ativa', ['atendimento', 'saude', 'educacao'], ['escuta ativa']),

  // Genéricas (qualquer área)
  comportamental('Trabalho em equipe', []),
  comportamental('Proatividade', []),
  comportamental('Adaptabilidade', []),
]

export function competenciasDaArea(areaId: string): CompetenciaReferencia[] {
  return competenciasReferenciaVagas.filter(
    (competencia) => !competencia.areasRelacionadas?.length || competencia.areasRelacionadas.includes(areaId),
  )
}
