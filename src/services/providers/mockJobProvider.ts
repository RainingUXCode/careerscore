import type { JobProvider, FiltroBuscaVagas, ResultadoProviderVagas } from '../../types/jobProvider'
import { Modalidade } from '../../types/enums'
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

    // Vaga remota nunca é excluída pela cidade/estado do candidato — só
    // presencial e híbrida precisam respeitar localização. Sem isso, o
    // fallback de demonstração podia devolver zero vagas só porque o
    // candidato mora numa cidade sem nenhuma vaga presencial no mock.
    if (filtros.cidade || filtros.estado) {
      vagas = vagas.filter((vaga) => {
        if (vaga.modalidade === Modalidade.REMOTO) return true
        const cidadeCompativel = !filtros.cidade || vaga.localizacao.cidade === filtros.cidade
        const estadoCompativel = !filtros.estado || vaga.localizacao.estado === filtros.estado
        return cidadeCompativel && estadoCompativel
      })
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
