import type { JobProvider, FiltroBuscaVagas, ResultadoProviderVagas } from '../../types/jobProvider'
import { vagasMockBrutas } from '../../data/vagasMock'
import { normalizarVagaMock } from '../normalizers/mockJobNormalizer'

export class MockJobProvider implements JobProvider {
  readonly id = 'mock'
  readonly nome = 'Vagas de demonstração'
  readonly tipo = 'demonstracao' as const

  async buscar(filtros: FiltroBuscaVagas): Promise<ResultadoProviderVagas> {
    let vagas = vagasMockBrutas.map(normalizarVagaMock)

    if (filtros.areaId) {
      vagas = vagas.filter((vaga) => vaga.areaId === filtros.areaId)
    }

    // A localização depende da disponibilidade de mudança do candidato, então
    // é avaliada no motor de compatibilidade. O provider mock só respeita os
    // filtros estruturados que não dependem de dado sensível do perfil.
    if (filtros.modalidade) {
      vagas = vagas.filter((vaga) => vaga.modalidade === filtros.modalidade)
    }
    if (filtros.limite) {
      vagas = vagas.slice(0, filtros.limite)
    }

    return { vagas, sucesso: true }
  }
}
