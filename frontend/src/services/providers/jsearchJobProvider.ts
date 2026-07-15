import type { JobProvider, FiltroBuscaVagas, OpcoesBuscaProvider, ResultadoProviderVagas } from '../../types/jobProvider'
import type { VagaNormalizada } from '../../types/vaga'

interface RespostaApiVagas {
  vagas: VagaNormalizada[]
  pagina: number
}

interface RespostaErroApiVagas {
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown>
  }
  erro: string
  mensagem: string
}

function isRespostaErroApiVagas(valor: unknown): valor is RespostaErroApiVagas {
  return Boolean(valor)
    && typeof valor === 'object'
    && typeof (valor as RespostaErroApiVagas).erro === 'string'
    && typeof (valor as RespostaErroApiVagas).mensagem === 'string'
}

function isRespostaApiVagas(valor: unknown): valor is RespostaApiVagas {
  return Boolean(valor)
    && typeof valor === 'object'
    && Array.isArray((valor as RespostaApiVagas).vagas)
    && typeof (valor as RespostaApiVagas).pagina === 'number'
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

  async buscar(filtros: FiltroBuscaVagas, opcoes?: OpcoesBuscaProvider): Promise<ResultadoProviderVagas> {
    const params = new URLSearchParams()
    if (filtros.palavraChave) params.set('termo', filtros.palavraChave)
    if (filtros.areaId) params.set('area', filtros.areaId)
    if (filtros.cargo) params.set('cargo', filtros.cargo)
    if (filtros.cidade) params.set('cidade', filtros.cidade)
    if (filtros.estado) params.set('estado', filtros.estado)
    if (filtros.pais) params.set('pais', filtros.pais)
    if (filtros.modalidade) params.set('modalidade', filtros.modalidade)
      params.set('pagina', '1')

    // Cache-buster: garante uma URL diferente da última consulta idêntica,
    // para não bater no cache de CDN de "/api/vagas" (que serve por até 24h
    // quando a busca anterior teve vagas reais) — sem isso, "Atualizar vagas"
    // podia devolver a mesma resposta em cache em vez de consultar de novo.
    if (opcoes?.forcarAtualizacao) {
      params.set('atualizar', Date.now().toString(36))
    }

    try {
      const resposta = await fetch(`/api/v1/jobs/search?${params.toString()}`)

      if (!resposta.ok) {
        const corpoErro: unknown = await resposta.json().catch(() => null)
        return {
          vagas: [],
          sucesso: false,
          erro: isRespostaErroApiVagas(corpoErro)
            ? corpoErro.error?.code ?? corpoErro.erro
            : `status_${resposta.status}`,
        }
      }

      const corpo: unknown = await resposta.json()
      if (!isRespostaApiVagas(corpo)) {
        return { vagas: [], sucesso: false, erro: 'resposta_invalida' }
      }
      return { vagas: corpo.vagas, sucesso: true }
    } catch {
      return { vagas: [], sucesso: false, erro: 'falha_conexao' }
    }
  }
}
