import type { VagaNormalizada } from '../types/vaga'
import type { FiltroBuscaVagas } from '../types/jobProvider'

export interface EntradaCacheVagas {
  vagas: VagaNormalizada[]
  consultadoEm: string
}

const PREFIXO = 'careerscore:cache-vagas:'
const TTL_MS = 24 * 60 * 60 * 1000 // 24h — cota gratuita é pequena, cache conservador

function construirChave(filtros: FiltroBuscaVagas): string {
  return [filtros.areaId, filtros.cargo, filtros.palavraChave, filtros.cidade, filtros.estado, filtros.pais, filtros.modalidade]
    .map((valor) => (valor ?? '').toString().trim().toLowerCase())
    .join('|')
}

export const vagasCacheService = {
  /** Devolve o cache salvo para esses filtros, se existir e ainda estiver dentro do TTL. */
  obter(filtros: FiltroBuscaVagas): EntradaCacheVagas | null {
    if (typeof window === 'undefined') return null
    try {
      const bruto = window.localStorage.getItem(PREFIXO + construirChave(filtros))
      if (!bruto) return null
      const entrada = JSON.parse(bruto) as EntradaCacheVagas
      const idade = Date.now() - new Date(entrada.consultadoEm).getTime()
      if (idade > TTL_MS) return null
      return entrada
    } catch {
      return null
    }
  },

  salvar(filtros: FiltroBuscaVagas, vagas: VagaNormalizada[]): void {
    if (typeof window === 'undefined') return
    try {
      const entrada: EntradaCacheVagas = { vagas, consultadoEm: new Date().toISOString() }
      window.localStorage.setItem(PREFIXO + construirChave(filtros), JSON.stringify(entrada))
    } catch {
      // localStorage indisponível (modo privado, cota cheia) — falha silenciosa, só não cacheia
    }
  },

  limpar(filtros: FiltroBuscaVagas): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(PREFIXO + construirChave(filtros))
    } catch {
      // ignora
    }
  },
}
