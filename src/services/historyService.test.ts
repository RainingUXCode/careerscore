import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarCandidatoBase } from '../test/fixtures'
import { analysisService } from './analysisService'
import { historyService } from './historyService'

function localStorageMemoria() {
  const dados = new Map<string, string>()
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      dados.set(chave, valor)
    },
    removeItem: (chave: string) => {
      dados.delete(chave)
    },
  }
}

describe('historyService score v2', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: localStorageMemoria() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserva histórico antigo sem versaoScore e grava novos itens como v2', () => {
    window.localStorage.setItem(
      'careerscore:historico-score',
      JSON.stringify([{ idAnalise: 'old-1', nomeCandidato: 'Antigo', area: 'Outra', score: 55, dataAnalise: '2025-01-01T00:00:00.000Z' }]),
    )
    const candidato = criarCandidatoBase()
    const analise = analysisService.gerarAnalise(candidato)
    const historico = historyService.salvarResultado({ candidato, analise, recomendacoes: [] })

    expect(historico.find((item) => item.idAnalise === 'old-1')?.versaoScore).toBeUndefined()
    expect(historico.find((item) => item.idAnalise === analise.idAnalise)?.versaoScore).toBe('v2')
  })
})
