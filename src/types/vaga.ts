import type { Modalidade } from './enums'

/**
 * Escala de senioridade para VAGAS — mais granular que NivelExperiencia (que
 * é do candidato/currículo e permanece intocado). Inclui níveis de gestão que
 * fazem sentido para vagas mas não para "meu nível de experiência" no formulário.
 */
export type NivelSenioridadeVaga =
  | 'Estágio'
  | 'Aprendiz'
  | 'Assistente'
  | 'Auxiliar'
  | 'Júnior'
  | 'Pleno'
  | 'Sênior'
  | 'Especialista'
  | 'Coordenação'
  | 'Gerência'
  | 'Diretoria'

export type TipoContratoVaga = 'CLT' | 'PJ' | 'Estágio' | 'Freelance' | 'Temporário' | 'Aprendiz'

export interface ItemPadraoMercado {
  competencia: string
  frequenciaPercentual: number
  candidatoPossui: boolean
}

export interface FonteVaga {
  id: string
  nome: string
  tipo: 'real' | 'demonstracao'
}

export type TipoRequisitoVaga =
  | 'competencia_tecnica'
  | 'competencia_comportamental'
  | 'formacao'
  | 'experiencia'
  | 'idioma'
  | 'certificado'
  | 'licenca'
  | 'ferramenta'
  | 'outro'

export interface RequisitoVaga {
  id: string
  nome: string
  tipo: TipoRequisitoVaga
  obrigatorio: boolean
  sinonimos?: string[]
  /** true quando extraído por heurística de texto livre, não informado estruturadamente pela fonte. */
  inferido?: boolean
}

export interface RequisitoIdioma {
  idioma: string
  nivelMinimo?: string
  obrigatorio: boolean
}

export interface LocalizacaoVaga {
  cidade?: string
  estado?: string
  pais: string
  /** Regiões/países explicitamente aceitos para vagas remotas, quando a fonte informar. */
  aceitaCandidatosDe?: string[]
}

export interface SalarioVaga {
  minimo?: number
  maximo?: number
  moeda: string
  periodicidade?: 'hora' | 'dia' | 'mes' | 'ano'
  /** true quando a fonte marca o valor como estimado, não confirmado pela empresa. */
  estimado?: boolean
}

/** Alta/média/baixa, com o motivo — não precisa ser uma nota "científica". */
export interface ConfiabilidadeDadosVaga {
  nivel: 'alta' | 'media' | 'baixa'
  motivo: string
}

export type StatusVaga = 'aberta' | 'encerrada' | 'indisponivel' | 'demonstracao'

export interface VagaNormalizada {
  id: string
  idExterno?: string
  fonte: FonteVaga

  titulo: string
  empresa: string
  descricao: string

  areaId: string
  subareaId?: string
  cargoNormalizado?: string

  senioridade?: NivelSenioridadeVaga
  senioridadeInformada: boolean

  tipoContrato?: TipoContratoVaga

  localizacao: LocalizacaoVaga
  modalidade?: Modalidade
  modalidadeInformada: boolean

  salario?: SalarioVaga
  beneficios: string[]

  requisitosObrigatorios: RequisitoVaga[]
  requisitosDesejaveis: RequisitoVaga[]

  formacaoRequerida?: string[]
  experienciaMinimaMeses?: number
  idiomasExigidos: RequisitoIdioma[]

  dataPublicacao?: string
  dataExpiracao?: string
  consultadaEm: string

  urlOriginal?: string
  status: StatusVaga
  confiabilidadeDados: ConfiabilidadeDadosVaga
}
