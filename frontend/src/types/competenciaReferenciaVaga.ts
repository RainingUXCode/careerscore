export type TipoCompetenciaReferencia = 'tecnica' | 'comportamental' | 'transferivel'

/**
 * Competência de referência usada pelo motor de vagas/compatibilidade — não
 * confundir com data/competenciasReferencia.ts, que é usado pelo módulo de
 * currículo/ATS e permanece intocado.
 */
export interface CompetenciaReferencia {
  id: string
  nome: string
  tipo: TipoCompetenciaReferencia
  sinonimos: string[]
  /** slugs de AreaProfissional onde esta competência é relevante. */
  areasRelacionadas?: string[]
}
