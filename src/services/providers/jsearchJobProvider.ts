import type { JobProvider, FiltroBuscaVagas, ResultadoProviderVagas } from '../../types/jobProvider'
import type { VagaNormalizada } from '../../types/vaga'

interface RespostaApiVagas {
  vagas: VagaNormalizada[]
  pagina: number
}

interface RespostaErroApiVagas {
  erro: string
  mensagem: string
}

/**
 * Implementação real do JobProvider usando a JSearch como fonte — mas o
 * front-end nunca fala com a JSearch/OpenWeb Ninja diretamente. Este provider só
 * conhece nossa própria rota `/api/vagas`, que protege a chave no servidor.
 */
export class JSearchJobProvider implements JobProvider {
  readonly id = 'jsearch'
  readonly nome = 'JSearch (LinkedIn, Indeed, Glassdoor e outros)'
  readonly tipo = 'real' as const

  async buscar(filtros: FiltroBuscaVagas): Promise<ResultadoProviderVagas> {
    const params = new URLSearchParams()
    if (filtros.palavraChave) params.set('termo', filtros.palavraChave)
    if (filtros.areaId) params.set('area', filtros.areaId)
    if (filtros.cargo) params.set('cargo', filtros.cargo)
    if (filtros.cidade) params.set('cidade', filtros.cidade)
    if (filtros.estado) params.set('estado', filtros.estado)
    if (filtros.pais) params.set('pais', filtros.pais)
    if (filtros.modalidade) params.set('modalidade', filtros.modalidade)
    params.set('pagina', '1')

    try {
      const resposta = await fetch(`/api/vagas?${params.toString()}`)

      if (!resposta.ok) {
        const corpoErro: RespostaErroApiVagas | null = await resposta.json().catch(() => null)
        return { vagas: [], sucesso: false, erro: corpoErro?.erro ?? `status_${resposta.status}` }
      }

      const corpo: RespostaApiVagas = await resposta.json()
      return { vagas: corpo.vagas ?? [], sucesso: true }
    } catch {
      return { vagas: [], sucesso: false, erro: 'falha_conexao' }
    }
  }
}
