import type { Candidato, ExperienciaProfissional } from '../types/models'
import type { CompetenciaTransferivel, ExperienciaAnteriorAvaliada } from '../types/compatibilidade'
import { obterAreaPorId } from '../data/areasProfissionais'
import { encontrarAreaPorTexto } from './areaMatchService'
import { normalizarTexto } from '../utils/texto'

interface RegraCompetenciaTransferivel {
  nome: string
  termos: string[]
  justificativa: string
}

export interface OrigemTransferivel {
  origemId: string
  origemDescricao: string
  itens: Array<{
    competencia: string
    justificativa: string
    evidencia?: string
    confianca?: number
  }>
}

const TAMANHO_MINIMO_DESCRICAO = 24

const regrasCompetencias: RegraCompetenciaTransferivel[] = [
  {
    nome: 'Comunicação',
    termos: ['comunicacao', 'comunicar', 'orientar', 'apresentar', 'explicar', 'alinhamento', 'cliente', 'paciente'],
    justificativa: 'a descrição menciona interação e comunicação com pessoas',
  },
  {
    nome: 'Empatia',
    termos: ['empatia', 'escuta', 'acolhimento', 'cliente', 'paciente', 'necessidade do cliente', 'necessidades dos pacientes'],
    justificativa: 'a experiência descreve escuta ou cuidado com necessidades de outras pessoas',
  },
  {
    nome: 'Resolução de problemas',
    termos: ['resolver', 'resolucao', 'problema', 'solucao', 'suporte', 'chamado', 'reclamacao', 'incidente'],
    justificativa: 'a descrição traz atuação em problemas, solicitações ou reclamações',
  },
  {
    nome: 'Negociação',
    termos: ['negociacao', 'negociar', 'venda', 'vendas', 'proposta', 'contrato', 'metas comerciais'],
    justificativa: 'a descrição evidencia negociação, vendas ou propostas',
  },
  {
    nome: 'Gestão de conflitos',
    termos: ['conflito', 'conflitos', 'reclamacao', 'situacao dificil', 'mediacao'],
    justificativa: 'a descrição menciona conflitos, reclamações ou mediação',
  },
  {
    nome: 'Organização',
    termos: ['organizacao', 'organizar', 'agenda', 'controle', 'processos', 'tarefas', 'prazos', 'prontuario', 'documentacao'],
    justificativa: 'a experiência envolve controle de rotinas, prazos, registros ou processos',
  },
  {
    nome: 'Liderança',
    termos: ['lideranca', 'liderar', 'supervisao', 'coordenacao', 'coordenei', 'treinamento de equipe', 'equipe'],
    justificativa: 'a descrição aponta liderança, coordenação ou orientação de equipe',
  },
  {
    nome: 'Análise',
    termos: ['analise', 'analisar', 'indicadores', 'relatorio', 'diagnostico', 'evolucao', 'dados'],
    justificativa: 'a experiência descreve análise, indicadores, diagnóstico ou evolução',
  },
  {
    nome: 'Planejamento',
    termos: ['planejamento', 'planejar', 'cronograma', 'plano', 'estrategia', 'priorizacao'],
    justificativa: 'a descrição evidencia planejamento, cronogramas ou priorização',
  },
  {
    nome: 'Trabalho em equipe',
    termos: ['equipe', 'colaboracao', 'multidisciplinar', 'time', 'parceria'],
    justificativa: 'a experiência registra colaboração com equipe ou atuação multidisciplinar',
  },
  {
    nome: 'Atendimento',
    termos: ['atendimento', 'atender', 'suporte', 'cliente', 'paciente', 'publico'],
    justificativa: 'a descrição evidencia atendimento direto a clientes, pacientes ou público',
  },
  {
    nome: 'Documentação',
    termos: ['documentacao', 'documentar', 'registro', 'relatorio', 'prontuario'],
    justificativa: 'a experiência inclui registro, relatórios ou documentação',
  },
  {
    nome: 'Orientação e treinamento',
    termos: ['treinamento', 'treinar', 'orientar', 'capacitacao', 'onboarding'],
    justificativa: 'a descrição mostra orientação, capacitação ou treinamento',
  },
  {
    nome: 'Gestão de metas',
    termos: ['meta', 'metas', 'indicadores', 'kpi', 'resultado', 'performance'],
    justificativa: 'a experiência menciona metas, indicadores ou resultados',
  },
  {
    nome: 'Projetos',
    termos: ['projeto', 'projetos', 'implantacao', 'implementacao', 'melhoria'],
    justificativa: 'a descrição traz participação em projetos, implantação ou melhoria',
  },
  {
    nome: 'Pesquisa',
    termos: ['pesquisa', 'levantamento', 'benchmark', 'entrevista com usuarios', 'estudo'],
    justificativa: 'a descrição evidencia pesquisa ou levantamento de informações',
  },
  {
    nome: 'Atenção aos detalhes',
    termos: ['detalhe', 'detalhes', 'revisao', 'qualidade', 'conferencia', 'consistencia'],
    justificativa: 'a experiência envolve revisão, qualidade ou atenção a detalhes',
  },
  {
    nome: 'Visão de produto',
    termos: ['produto', 'usuario', 'usuarios', 'ux', 'jornada', 'experiencia do usuario'],
    justificativa: 'a descrição conecta decisões ao usuário, jornada ou produto',
  },
  {
    nome: 'Comunicação visual',
    termos: ['design', 'visual', 'layout', 'peca grafica', 'identidade visual', 'comunicacao visual'],
    justificativa: 'a experiência descreve criação ou organização de comunicação visual',
  },
]

function descricaoSuficiente(experiencia: ExperienciaProfissional): boolean {
  return normalizarTexto(experiencia.descricao).length >= TAMANHO_MINIMO_DESCRICAO
}

function encontrarEvidencia(textoNormalizado: string, termos: string[]): string | undefined {
  return termos.find((termo) => textoNormalizado.includes(termo))
}

function extrairCompetenciasDaDescricao(experiencia: ExperienciaProfissional): CompetenciaTransferivel[] {
  const textoNormalizado = normalizarTexto(experiencia.descricao)
  if (!descricaoSuficiente(experiencia)) return []

  return regrasCompetencias.reduce<CompetenciaTransferivel[]>((competencias, regra) => {
    const evidencia = encontrarEvidencia(textoNormalizado, regra.termos)
    if (!evidencia) return competencias
    const origemExperiencia = [experiencia.cargo, experiencia.empresa].filter(Boolean).join(' em ') || 'experiencia anterior'
    competencias.push({
      nome: regra.nome,
      origemExperiencia,
      evidencia,
      confianca: 0.75,
      justificativa: `Sua experiencia com ${origemExperiencia} contribui com ${regra.nome.toLowerCase()}: ${regra.justificativa}. Isso fortalece sua aderencia comportamental, mas nao substitui experiencia tecnica direta.`,
    })
    return competencias
  }, [])
}

function tipoRelacaoExperiencia(experiencia: ExperienciaProfissional, areaAlvoId?: string): Pick<
  ExperienciaAnteriorAvaliada,
  'tipoRelacao' | 'areaDetectada' | 'confianca' | 'justificativa'
> {
  const areaDetectada = encontrarAreaPorTexto(experiencia.cargo) ?? encontrarAreaPorTexto(experiencia.descricao)
  const areaAlvo = areaAlvoId ? obterAreaPorId(areaAlvoId) : undefined

  if (!descricaoSuficiente(experiencia)) {
    return {
      tipoRelacao: 'sem_evidencia',
      areaDetectada: areaDetectada?.nome,
      confianca: 0.2,
      justificativa: 'Descrição insuficiente para identificar responsabilidades, ferramentas ou competências com confiança.',
    }
  }

  if (areaDetectada && areaAlvo && areaDetectada.id === areaAlvo.id) {
    return {
      tipoRelacao: 'direta',
      areaDetectada: areaDetectada.nome,
      confianca: 0.85,
      justificativa: `Experiência diretamente relacionada à área da vaga (${areaAlvo.nome}).`,
    }
  }

  const relacionada =
    Boolean(areaDetectada && areaAlvo && areaDetectada.categoriaPaiId === areaAlvo.id) ||
    Boolean(areaDetectada && areaAlvo && areaAlvo.categoriaPaiId === areaDetectada.id) ||
    Boolean(areaDetectada && areaAlvo && areaDetectada.categoriaPaiId && areaDetectada.categoriaPaiId === areaAlvo.categoriaPaiId)

  if (relacionada) {
    return {
      tipoRelacao: 'relacionada',
      areaDetectada: areaDetectada?.nome,
      confianca: 0.65,
      justificativa: `Experiência em área relacionada (${areaDetectada?.nome}) pode apoiar a transição para ${areaAlvo?.nome}.`,
    }
  }

  return {
    tipoRelacao: 'transferivel',
    areaDetectada: areaDetectada?.nome,
    confianca: 0.5,
    justificativa: 'Experiência em área diferente; aproveitamento depende das competências transferíveis evidenciadas na descrição.',
  }
}

export function analisarExperienciasAnteriores(candidato: Candidato, areaAlvoId?: string): ExperienciaAnteriorAvaliada[] {
  return candidato.experiencias.map((experiencia) => {
    const relacao = tipoRelacaoExperiencia(experiencia, areaAlvoId)
    const competenciasTransferiveis = relacao.tipoRelacao === 'transferivel' ? extrairCompetenciasDaDescricao(experiencia) : []

    return {
      experienciaId: experiencia.idExperiencia,
      cargo: experiencia.cargo,
      empresa: experiencia.empresa,
      ...relacao,
      competenciasTransferiveis,
    }
  })
}

/**
 * Compatibilidade legada consumida pelo motor: retorna apenas competências
 * transferíveis evidenciadas na descrição, agrupadas por experiência.
 */
export function detectarOrigensTransferiveis(candidato: Candidato, areaAlvoId?: string): OrigemTransferivel[] {
  return analisarExperienciasAnteriores(candidato, areaAlvoId)
    .filter((experiencia) => experiencia.tipoRelacao === 'transferivel' && experiencia.competenciasTransferiveis.length > 0)
    .map((experiencia) => ({
      origemId: experiencia.experienciaId,
      origemDescricao: `experiência como ${experiencia.cargo}`,
      itens: experiencia.competenciasTransferiveis.map((competencia) => ({
        competencia: competencia.nome,
        justificativa: competencia.justificativa,
        evidencia: competencia.evidencia,
        confianca: competencia.confianca,
      })),
    }))
}
