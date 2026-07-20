import type { CurriculoOtimizadoResult } from '../types/engine'

function chave(idAnalise: string): string {
  return `careerscore:curriculo-editado:${idAnalise}`
}

export const curriculoEdicaoService = {
  /** Carrega a versão editada salva localmente, se houver. */
  carregar(idAnalise: string): CurriculoOtimizadoResult | null {
    if (typeof window === 'undefined') return null
    try {
      const bruto = window.localStorage.getItem(chave(idAnalise))
      return bruto ? (JSON.parse(bruto) as CurriculoOtimizadoResult) : null
    } catch {
      return null
    }
  },

  /** Salva a versão editada, sobrescrevendo a anterior — sobrevive a troca de aba e a atualização da página. */
  salvar(idAnalise: string, curriculo: CurriculoOtimizadoResult): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(chave(idAnalise), JSON.stringify(curriculo))
    } catch {
      // localStorage indisponível (modo privado, etc.) — falha silenciosa
    }
  },

  /** Remove a versão editada (usado ao restaurar a versão gerada originalmente). */
  limpar(idAnalise: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(chave(idAnalise))
    } catch {
      // ignora
    }
  },
}
