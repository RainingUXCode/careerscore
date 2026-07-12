import type {
  NomeArea,
  TipoLink,
  StatusCurso,
  TipoCompetencia,
  NivelProficiencia,
  Modalidade,
  NivelExperiencia,
  FormatoCurriculo,
} from './enums'
import type { NivelSenioridadeVaga, TipoContratoVaga } from './vaga'

/** Classe AreaInteresse */
export interface AreaInteresse {
  idArea: string
  nome: NomeArea
  nomePersonalizado?: string // usado quando nome === OUTRO
}

export type NivelSenioridadeAlvo = NivelSenioridadeVaga | 'Trainee' | 'Indiferente'
export type TipoContratoAceito = TipoContratoVaga | 'Trainee' | 'Cooperado' | 'Indiferente'
export type ModoObjetivoProfissional = 'definido' | 'exploracao'

export interface OpcaoObjetivoProfissional {
  id: string
  cargoOuArea: string
  nivelAlvo?: NivelSenioridadeAlvo
  tiposContratoAceitos: TipoContratoAceito[]
  modalidadesAceitas: Modalidade[]
}

export interface PreferenciasExploracao {
  interesses: string[]
}

export interface SugestaoCarreira {
  id: string
  area: string
  cargosEntrada: string[]
  afinidadeEstimada: number
  confianca: number
  evidencias: string[]
  competenciasAtuaisRelacionadas: string[]
  competenciasTransferiveis: string[]
  lacunas: string[]
  pontosFavoraveis: string[]
  pontosAtencao: string[]
  acaoPraticaInicial: string
  mensagemCautelosa: string
}

export interface ObjetivoProfissional {
  modo: ModoObjetivoProfissional
  opcoes: OpcaoObjetivoProfissional[]
  preferenciasExploracao: PreferenciasExploracao
}

/** Classe LinkProfissional */
export interface LinkProfissional {
  idLink: string
  tipo: TipoLink
  url: string
}

/** Classe Escolaridade */
export interface Escolaridade {
  idEscolaridade: string
  instituicao: string
  curso: string
  nivel: string
  status: StatusCurso
  dataInicio: string
  dataFim?: string
}

/** Classe ExperienciaProfissional */
export interface ExperienciaProfissional {
  idExperiencia: string
  empresa: string
  cargo: string
  descricao: string
  dataInicio: string
  dataFim?: string
  empregoAtual: boolean
}

/** Classe Competencia */
export interface Competencia {
  idCompetencia: string
  nome: string
  tipo: TipoCompetencia
}

/** Classe Idioma */
export interface Idioma {
  idIdioma: string
  nome: string
  nivelProficiencia: NivelProficiencia
}

/** Classe Certificado */
export interface Certificado {
  idCertificado: string
  titulo: string
  instituicao: string
  cargaHoraria?: string
  dataEmissao?: string
  nomeArquivo?: string
  tipoArquivo?: string
  arquivo?: File
}

/** Classe Curriculo */
export interface Curriculo {
  idCurriculo: string
  nomeArquivo: string
  formato: FormatoCurriculo
  dataUpload: string
  arquivo?: File
}

/** Classe Candidato */
export interface Candidato {
  idCandidato: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  areaInteresse: AreaInteresse
  objetivoProfissional: ObjetivoProfissional
  modalidadesPreferidas: Modalidade[]
  nivelExperiencia?: NivelExperiencia
  escolaridades: Escolaridade[]
  experiencias: ExperienciaProfissional[]
  competencias: Competencia[]
  certificados: Certificado[]
  idiomas: Idioma[]
  links: LinkProfissional[]
  curriculo?: Curriculo
}

/** Classe PlanoAcao */
export interface PlanoAcao {
  idPlano: string
  titulo: string
  descricao: string
  prioridade: 'Alta' | 'Média' | 'Baixa'
  prazo: string
}

export interface PontuacaoDetalhes {
  experiencia: number
  competencias: number
  escolaridade: number
  idiomas: number
  presencaDigital: number
  certificados: number
  curriculo: number
}

/** Classe AnalisePerfil */
export interface AnalisePerfil {
  idAnalise: string
  scoreEmpregabilidade: number
  pontuacaoDetalhes: PontuacaoDetalhes
  resumoProfissional: string
  pontosFortes: string[]
  pontosMelhorar: string[]
  competenciasFaltantes: string[]
  sugestoesCurriculo: string[]
  dataAnalise: string
  planoAcao: PlanoAcao[]
}

/** Resultado completo do processamento, usado na tela de Relatório */
import type { ContextoExterno } from './externo'
import type { AtsAnalysisResult, CurriculoOtimizadoResult } from './engine'
import type { VagaRecomendada } from './compatibilidade'
import type { ItemPadraoMercado } from './vaga'

export interface MetaVagas {
  fontesComFalha: string[]
  codigosErro: string[]
  usouFallback: boolean
  deCache: boolean
  consultadoEm: string
  totalVagasEncontradas: number
  totalVagasRecentes: number
}

export interface ResultadoProcessamento {
  candidato: Candidato
  analise: AnalisePerfil
  recomendacoes: VagaRecomendada[]
  /** Resultado de análises externas reais (GitHub, texto de certificados). */
  contextoExterno?: ContextoExterno
  /** Resultado da análise de ATS (Career Analysis Engine — estratégia heurística hoje, IA no futuro). */
  atsAnalise?: AtsAnalysisResult
  /** Currículo ATS otimizado gerado (Career Analysis Engine — mesma estratégia, IA no futuro). */
  curriculoOtimizado?: CurriculoOtimizadoResult
  /** Padrão de mercado (requisitos mais frequentes nas vagas da área do candidato). */
  padraoMercado?: ItemPadraoMercado[]
  /** Status da busca de vagas: fonte usada, cache, falhas. */
  metaVagas?: MetaVagas
  /** Sugestões cautelosas para usuários em exploração, baseadas apenas em evidências declaradas. */
  sugestoesCarreira?: SugestaoCarreira[]
}
