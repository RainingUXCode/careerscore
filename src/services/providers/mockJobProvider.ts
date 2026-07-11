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
    if (filtros.cidade) {
      vagas = vagas.filter((vaga) => vaga.localizacao.cidade === filtros.cidade)
    }
    if (filtros.estado) {
      vagas = vagas.filter((vaga) => vaga.localizacao.estado === filtros.estado)
    }
    if (filtros.modalidade) {
      vagas = vagas.filter((vaga) => vaga.modalidade === filtros.modalidade)
    }
    if (filtros.limite) {
      vagas = vagas.slice(0, filtros.limite)
    }

    return { vagas, sucesso: true }
  }
}
