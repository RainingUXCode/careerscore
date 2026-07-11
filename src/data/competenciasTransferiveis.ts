export interface CompetenciaTransferivelOrigem {
  competencia: string
  justificativa: string
}

/**
 * Para cada área de origem (de onde a experiência do candidato vem), lista
 * competências que se transferem para outras áreas, com a frase que explica
 * o porquê — usada pelo motor de compatibilidade quando a área de interesse
 * do candidato não bate diretamente com a área da vaga.
 */
export const competenciasTransferiveisPorOrigem: Record<string, CompetenciaTransferivelOrigem[]> = {
  atendimento: [
    { competencia: 'Comunicação', justificativa: 'atendimento direto ao público desenvolve comunicação clara sob pressão' },
    { competencia: 'Resolução de problemas', justificativa: 'lidar com reclamações e solicitações exige resolver problemas rapidamente' },
    { competencia: 'Empatia', justificativa: 'entender a necessidade de quem está do outro lado é a base do atendimento' },
    { competencia: 'Negociação', justificativa: 'contornar situações difíceis com clientes envolve negociação constante' },
    { competencia: 'Gestão de conflitos', justificativa: 'atendimento lida rotineiramente com conflitos e reclamações' },
    { competencia: 'Organização', justificativa: 'gerenciar múltiplos chamados/clientes exige organização' },
  ],
  fisioterapia: [
    { competencia: 'Comunicação', justificativa: 'orientar pacientes exige explicar processos de forma clara' },
    { competencia: 'Trabalho multidisciplinar', justificativa: 'fisioterapia envolve rotina de trabalho com outros profissionais de saúde' },
    { competencia: 'Responsabilidade', justificativa: 'cuidado com a recuperação de pacientes exige alto senso de responsabilidade' },
    { competencia: 'Organização', justificativa: 'acompanhar múltiplos pacientes e prontuários exige organização' },
    { competencia: 'Escuta ativa', justificativa: 'entender a evolução do paciente depende de escuta ativa' },
  ],
  design: [
    { competencia: 'Atenção aos detalhes', justificativa: 'produção visual exige cuidado com consistência e detalhes' },
    { competencia: 'Comunicação visual', justificativa: 'traduzir ideias em imagens é comunicação aplicada' },
    { competencia: 'Pesquisa', justificativa: 'processos de design partem de pesquisa com usuários/mercado' },
    { competencia: 'Criatividade', justificativa: 'geração de soluções visuais/produto exige criatividade constante' },
    { competencia: 'Compreensão do usuário', justificativa: 'design centrado no usuário desenvolve empatia com quem vai usar o produto' },
  ],
  academica: [
    { competencia: 'Pesquisa', justificativa: 'trabalhos acadêmicos exigem levantamento e análise de fontes' },
    { competencia: 'Apresentação', justificativa: 'seminários e defesas de trabalho desenvolvem comunicação em público' },
    { competencia: 'Escrita', justificativa: 'produção de trabalhos acadêmicos exige escrita estruturada' },
    { competencia: 'Organização', justificativa: 'conciliar disciplinas e prazos exige organização' },
    { competencia: 'Trabalho em equipe', justificativa: 'trabalhos em grupo são comuns na vida acadêmica' },
    { competencia: 'Cumprimento de prazos', justificativa: 'entregas acadêmicas têm prazos fixos e recorrentes' },
  ],
}
