/**
 * Taxonomia de áreas profissionais para o módulo de vagas/compatibilidade.
 *
 * Este tipo é independente de `NomeArea` (types/enums.ts), que continua sendo
 * usado pelo módulo de currículo/formulário sem nenhuma alteração. A ponte
 * entre os dois mundos fica em services/areaBridgeService.ts.
 */
export interface AreaProfissional {
  id: string
  nome: string
  slug: string
  /** id da área ampla, quando esta é uma subárea (ex: Fisioterapia -> Saúde). */
  categoriaPaiId?: string
  sinonimos: string[]
  palavrasRelacionadas?: string[]
}

/** Um cargo/ocupação específico, opcionalmente associado a uma subárea. */
export interface CargoProfissional {
  id: string
  nome: string
  slug: string
  areaId: string
  sinonimos: string[]
}
