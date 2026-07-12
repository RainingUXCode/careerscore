import type { VagaNormalizada } from './vaga'

export interface EvidenciaCompatibilidade {
  descricao: string
  /** De onde veio a evidência (ex: 'experiencia', 'certificado', 'formacao'). */
  origem: string
}

export interface DimensaoCompatibilidade {
  chave: string
  nome: string

  /** Ausente quando avaliada=false. */
  nota?: number
  pesoOriginal: number
  pesoAplicado: number

  avaliada: boolean
  /** 0-1: quão confiável é o dado usado nesta dimensão. */
  confianca: number

  justificativa: string
  evidencias: EvidenciaCompatibilidade[]

  requisitosAtendidos: string[]
  requisitosParciais: string[]
  requisitosAusentes: string[]

  acoesRecomendadas: string[]
}

export interface ConfiabilidadeCompatibilidade {
  percentual: number
  dimensoesAvaliadas: number
  totalDimensoes: number
  dimensoesSemDados: string[]
  resumo: string
}

export type RecomendacaoCandidatura = 'recomendada' | 'recomendada_com_ressalvas' | 'avaliar_com_cuidado' | 'nao_recomendada'

export interface CompetenciaTransferivel {
  nome: string
  origemExperiencia: string
  justificativa: string
  evidencia?: string
  confianca?: number
}

export interface ImpeditivoCompatibilidade {
  descricao: string
  motivo: string
}

export type TipoRelacaoExperiencia = 'direta' | 'relacionada' | 'transferivel' | 'sem_evidencia'

export interface ExperienciaAnteriorAvaliada {
  experienciaId: string
  cargo: string
  empresa: string
  tipoRelacao: TipoRelacaoExperiencia
  areaDetectada?: string
  competenciasTransferiveis: CompetenciaTransferivel[]
  confianca: number
  justificativa: string
}

/**
 * Preparado para uso futuro — o formulário ainda não coleta pretensão
 * salarial. Quando existir, este tipo já está pronto para o motor usar.
 */
export interface PreferenciaSalarial {
  minimo?: number
  ideal?: number
  moeda: string
  periodicidade?: 'hora' | 'dia' | 'mes' | 'ano'
  obrigatoria?: boolean
}

export interface ResultadoCompatibilidade {
  vagaId: string
  compatibilidadeGeral: number
  dimensoes: DimensaoCompatibilidade[]
  confiabilidade: ConfiabilidadeCompatibilidade
  competenciasTransferiveis: CompetenciaTransferivel[]
  experienciasAnteriores: ExperienciaAnteriorAvaliada[]
  impeditivos: ImpeditivoCompatibilidade[]
  recomendacaoCandidatura: RecomendacaoCandidatura
  motivosRecomendacao: string[]
}

/** Uma vaga já normalizada, junto do resultado de compatibilidade calculado para um candidato específico. */
export interface VagaRecomendada {
  vaga: VagaNormalizada
  compatibilidade: ResultadoCompatibilidade
  objetivoOrigem?: string
  buscaAmpla?: boolean
}
