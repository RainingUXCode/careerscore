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
  modalidadePreferida?: Modalidade
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
export type TipoFormacao =
  | 'ensino_fundamental'
  | 'ensino_medio'
  | 'ensino_tecnico'
  | 'tecnologo'
  | 'bacharelado'
  | 'licenciatura'
  | 'pos_graduacao'
  | 'mba'
  | 'mestrado'
  | 'doutorado'

export interface Escolaridade {
  idEscolaridade: string
  tipoFormacao?: TipoFormacao
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

export type PreferenciaVagasPcd = 'sim' | 'nao' | 'prefiro_nao_informar'
export type DisponibilidadeMudanca = 'sim' | 'nao' | 'depende' | 'prefiro_nao_informar'

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
  modalidadePreferida?: Modalidade
  disponibilidadeMudanca?: DisponibilidadeMudanca
  preferenciaVagasPcd?: PreferenciaVagasPcd
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

export type ChavePontuacaoDetalhes =
  | 'competenciasRelevantes'
  | 'experienciaEvidencias'
  | 'projetosEntregas'
  | 'consistenciaPerfil'
  | 'curriculoApresentacao'

export interface CategoriaPontuacaoDetalhe {
  chave: ChavePontuacaoDetalhes
  titulo: string
  pontos: number
  maximo: number
  justificativa: string
  evidencias: string[]
  comoMelhorar: string[]
}

export interface PontuacaoDetalhes {
  competenciasRelevantes: CategoriaPontuacaoDetalhe
  experienciaEvidencias: CategoriaPontuacaoDetalhe
  projetosEntregas: CategoriaPontuacaoDetalhe
  consistenciaPerfil: CategoriaPontuacaoDetalhe
  curriculoApresentacao: CategoriaPontuacaoDetalhe
}

export type StatusChecklistPerfil = 'atendido' | 'pendente' | 'opcional' | 'nao_aplicavel'
export type ImportanciaChecklistPerfil = 'obrigatorio' | 'recomendado' | 'opcional' | 'nao_aplicavel'

export interface ItemChecklistPerfil {
  id: string
  titulo: string
  importancia: ImportanciaChecklistPerfil
  status: StatusChecklistPerfil
  explicacao: string
  impacto?: string
}

/** Classe AnalisePerfil */
export interface AnalisePerfil {
  idAnalise: string
  versaoScore?: 'v1' | 'v2'
  scoreEmpregabilidade: number
  pontuacaoDetalhes: PontuacaoDetalhes
  checklistPerfil?: ItemChecklistPerfil[]
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
  totalVagasRetornadas?: number
  totalVagasEncontradas: number
  totalVagasRecentes: number
  totalVagasElegiveis?: number
  distribuicaoFaixas?: {
    alta80: number
    media60a79: number
    entrada40a59: number
    preparacaoAbaixo40: number
  }
  statusFonteReal: 'com_vagas' | 'vazia' | 'falhou' | 'sem_provider_real'
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
