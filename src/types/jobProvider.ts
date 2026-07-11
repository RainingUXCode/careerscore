import type { Modalidade } from './enums'
import type { VagaNormalizada } from './vaga'

export interface FiltroBuscaVagas {
  areaId?: string
  cargo?: string
  palavraChave?: string
  cidade?: string
  estado?: string
  pais?: string
  modalidade?: Modalidade
  limite?: number
}

export interface ResultadoProviderVagas {
  vagas: VagaNormalizada[]
  /** false se o provider falhou/está indisponível (o agregador decide o fallback). */
  sucesso: boolean
  erro?: string
}

/**
 * Contrato único que qualquer fonte de vagas deve implementar — hoje só
 * MockJobProvider; no futuro AdzunaProvider, JSearchProvider, etc. Nenhum
 * componente ou serviço consumidor deve depender de uma implementação
 * concreta, apenas deste contrato (mesmo espírito do CareerAnalyzer).
 */
export interface JobProvider {
  readonly id: string
  readonly nome: string
  readonly tipo: 'real' | 'demonstracao'
  buscar(filtros: FiltroBuscaVagas): Promise<ResultadoProviderVagas>
}
