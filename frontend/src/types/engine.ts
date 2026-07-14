// Contrato compartilhado do "Career Analysis Engine".
// Este arquivo não importa nada de outros módulos de tipos/serviços de propósito
// específico (Candidato, Vaga, etc.) para poder ser importado tanto por
// types/models.ts quanto pelos serviços de análise, sem criar ciclo de import.

export type FonteAnalise = 'heuristico' | 'ia'

/** Por que o texto de um documento (ex: currículo) não pôde ser lido. */
export type MotivoTextoIndisponivel =
  | 'sem_arquivo'
  | 'formato_nao_suportado'
  | 'documento_sem_texto'
  | 'falha_na_leitura'

/** Uma categoria de avaliação dentro de uma análise estruturada (ex: ATS). */
export interface CategoriaAnalise {
  /** Identificador estável (ex: 'estrutura', 'palavras-chave'), usado como key em listas. */
  chave: string
  /** Nome de exibição (ex: 'Estrutura'). */
  nome: string
  /** Nota da categoria, escala 0-10. */
  nota: number
  /** Explicação de por que a nota foi essa, em linguagem simples. */
  justificativa: string
  /** Sugestões práticas para melhorar essa categoria. Pode ser vazio. */
  recomendacoes: string[]
}

/**
 * Strategy Pattern: contrato único que qualquer motor de análise de carreira
 * deve implementar — hoje uma implementação heurística, futuramente uma
 * implementação com IA (ex: Claude API). Componentes e fluxos consomem apenas
 * o resultado (`TResult`) e nunca a implementação concreta.
 */
export interface CareerAnalyzer<TInput, TResult> {
  /** Identificador da estratégia usada para gerar o resultado (útil para depuração/telemetria). */
  readonly nome: string
  analisar(input: TInput): Promise<TResult>
}

/** Resultado estruturado de uma análise de compatibilidade com ATS. */
export interface AtsAnalysisResult {
  /** Nota geral, escala 0-100 (média das categorias, reescalada). */
  notaGeral: number
  categorias: CategoriaAnalise[]
  /** Frase única resumindo o resultado, para exibição rápida. */
  resumo: string
  /** Qual estratégia gerou este resultado (heurística hoje; IA no futuro). */
  fonte: FonteAnalise
  geradoEm: string
  /** true se a análise leu o conteúdo real do currículo; false se caiu para metadados. */
  baseadoEmTexto: boolean
  /** Motivo pelo qual o texto não pôde ser lido, quando baseadoEmTexto é false. */
  motivoTextoIndisponivel?: MotivoTextoIndisponivel
}

// ---------------------------------------------------------------------------
// Currículo ATS otimizado — gerado a partir apenas de dados reais informados
// pelo candidato (nunca inventado). Ver services/engine/curriculoGenerator.ts.
// ---------------------------------------------------------------------------

export interface ContatoOtimizado {
  nome: string
  email: string
  telefone: string
  localizacao: string
}

export interface ProjetoOtimizado {
  nome: string
  descricao: string
  url?: string
  tecnologias: string[]
}

export interface ExperienciaOtimizada {
  cargo: string
  empresa: string
  periodo: string
  pontos: string[]
}

export interface FormacaoOtimizada {
  curso: string
  instituicao: string
  nivel: string
  status: string
  periodo: string
}

export interface CertificadoOtimizado {
  titulo: string
  instituicao: string
  cargaHoraria?: string
  competenciasDetectadas: string[]
}

export interface IdiomaOtimizado {
  nome: string
  nivel: string
}

export interface LinkOtimizado {
  tipo: string
  url: string
}

/**
 * De onde veio uma informação do currículo otimizado — usado só no modo de
 * edição/revisão para dar transparência ao usuário; nunca aparece no PDF final.
 */
export type OrigemDado =
  | 'formulario'
  | 'curriculo_enviado'
  | 'github'
  | 'certificado'
  | 'gerado_pelo_sistema'
  | 'editado_manualmente'

/** Origem de cada seção do currículo otimizado (granularidade de seção, não de campo). */
export interface OrigensCurriculo {
  contato: OrigemDado
  resumoProfissional: OrigemDado
  habilidadesTecnicas: OrigemDado
  projetos: OrigemDado
  experiencias: OrigemDado
  formacao: OrigemDado
  certificados: OrigemDado
  /** As competências detectadas dentro de cada certificado têm origem própria (o arquivo, não o formulário). */
  certificadosCompetenciasDetectadas: OrigemDado
  idiomas: OrigemDado
  links: OrigemDado
}

export interface CurriculoOtimizadoResult {
  contato: ContatoOtimizado
  resumoProfissional: string
  habilidadesTecnicas: string[]
  projetos: ProjetoOtimizado[]
  experiencias: ExperienciaOtimizada[]
  formacao: FormacaoOtimizada[]
  certificados: CertificadoOtimizado[]
  idiomas: IdiomaOtimizado[]
  links: LinkOtimizado[]
  /** Qual estratégia gerou este currículo (heurística hoje; IA no futuro). */
  fonte: FonteAnalise
  geradoEm: string
  origens: OrigensCurriculo
}

// ---------------------------------------------------------------------------
// Comparador currículo original x otimizado — só descreve mudanças que podem
// ser comprovadas comparando os dois lados. Ver services/curriculoComparadorService.ts.
// ---------------------------------------------------------------------------

/**
 * Tipo de mudança comprovável em uma seção. Uma seção pode ter mais de um tipo
 * ao mesmo tempo (ex: reorganizado + destacado). 'sem_alteracao' é o padrão
 * honesto quando nada muda estruturalmente.
 */
export type TipoMudancaSecao = 'reorganizado' | 'destacado' | 'adicionado' | 'ausente' | 'sem_alteracao'

export interface ComparacaoSecao {
  chave: string
  nome: string
  tipos: TipoMudancaSecao[]
  /** Explicação objetiva do que mudou (ou não) nesta seção. */
  resumoMudanca: string
  /** Por que essa mudança (quando houver) ajuda a compatibilidade com ATS. */
  motivoAts: string
  /** Representação simples do conteúdo original, para exibir lado a lado. */
  conteudoOriginal: string[]
  /** Representação simples do conteúdo otimizado, para exibir lado a lado. */
  conteudoOtimizado: string[]
}

export interface ComparacaoCurriculo {
  secoes: ComparacaoSecao[]
  geradoEm: string
}
