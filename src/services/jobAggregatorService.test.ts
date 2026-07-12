import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JobAggregatorService } from './jobAggregatorService'
import type { JobProvider } from '../types/jobProvider'
import { criarVagaBase } from '../test/fixtures'

/** Polyfill mínimo de localStorage em memória, só para os testes (ambiente node não tem window). */
function criarLocalStorageEmMemoria() {
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

function providerFalso(
  id: string,
  tipo: 'real' | 'demonstracao',
  vagas: ReturnType<typeof criarVagaBase>[],
): JobProvider & { buscarMock: ReturnType<typeof vi.fn> } {
  const buscarMock = vi.fn().mockResolvedValue({ vagas, sucesso: true })
  return { id, nome: id, tipo, buscar: buscarMock, buscarMock }
}

describe('JobAggregatorService', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: criarLocalStorageEmMemoria() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não mistura vagas de demonstração quando a fonte real teve sucesso', async () => {
    const vagaReal = criarVagaBase({ id: 'real-1', fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' } })
    const vagaMock = criarVagaBase({ id: 'mock-1', fonte: { id: 'mock', nome: 'Mock', tipo: 'demonstracao' } })

    const real = providerFalso('jsearch', 'real', [vagaReal])
    const mock = providerFalso('mock', 'demonstracao', [vagaMock])

    const agregador = new JobAggregatorService([real, mock])
    const resultado = await agregador.buscar({})

    expect(resultado.vagas.every((v) => v.fonte.tipo === 'real')).toBe(true)
    expect(resultado.usouFallback).toBe(false)
  })

  it('usa vagas de demonstração como fallback quando a fonte real falha', async () => {
    const vagaMock = criarVagaBase({ id: 'mock-1', fonte: { id: 'mock', nome: 'Mock', tipo: 'demonstracao' } })
    const real: JobProvider = {
      id: 'jsearch',
      nome: 'JSearch',
      tipo: 'real',
      buscar: vi.fn().mockResolvedValue({ vagas: [], sucesso: false, erro: 'falha_conexao' }),
    }
    const mock = providerFalso('mock', 'demonstracao', [vagaMock])

    const agregador = new JobAggregatorService([real, mock])
    const resultado = await agregador.buscar({})

    expect(resultado.vagas.every((v) => v.fonte.tipo === 'demonstracao')).toBe(true)
    expect(resultado.usouFallback).toBe(true)
    expect(resultado.fontesComFalha).toContain('JSearch')
    expect(resultado.codigosErro).toContain('falha_conexao')
  })

  it('cacheia resultado real e evita uma segunda chamada de rede com os mesmos filtros', async () => {
    const vagaReal = criarVagaBase({ id: 'real-1', fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' } })
    const real = providerFalso('jsearch', 'real', [vagaReal])
    const agregador = new JobAggregatorService([real])

    const primeira = await agregador.buscar({})
    const segunda = await agregador.buscar({})

    expect(primeira.deCache).toBe(false)
    expect(segunda.deCache).toBe(true)
    expect(real.buscarMock).toHaveBeenCalledTimes(1)
  })

  it('forcarAtualizacao ignora o cache e busca de novo', async () => {
    const vagaReal = criarVagaBase({ id: 'real-1', fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' } })
    const real = providerFalso('jsearch', 'real', [vagaReal])
    const agregador = new JobAggregatorService([real])

    await agregador.buscar({})
    await agregador.buscar({}, { forcarAtualizacao: true })

    expect(real.buscarMock).toHaveBeenCalledTimes(2)
  })

  it('propaga o código chave_ausente distintamente de cota_excedida', async () => {
    const realSemChave: JobProvider = {
      id: 'jsearch',
      nome: 'JSearch',
      tipo: 'real',
      buscar: vi.fn().mockResolvedValue({ vagas: [], sucesso: false, erro: 'chave_ausente' }),
    }
    const mock = providerFalso('mock', 'demonstracao', [criarVagaBase({ id: 'mock-1' })])
    const agregador = new JobAggregatorService([realSemChave, mock])
    const resultado = await agregador.buscar({})
    expect(resultado.codigosErro).toEqual(['chave_ausente'])
  })

  it('propaga o código cota_excedida quando a fonte real retorna 429', async () => {
    const realComCota: JobProvider = {
      id: 'jsearch',
      nome: 'JSearch',
      tipo: 'real',
      buscar: vi.fn().mockResolvedValue({ vagas: [], sucesso: false, erro: 'cota_excedida' }),
    }
    const mock = providerFalso('mock', 'demonstracao', [criarVagaBase({ id: 'mock-1' })])
    const agregador = new JobAggregatorService([realComCota, mock])
    const resultado = await agregador.buscar({})
    expect(resultado.codigosErro).toEqual(['cota_excedida'])
  })

  it('statusFonteReal é "com_vagas" quando a fonte real teve sucesso e retornou vagas', async () => {
    const real = providerFalso('jsearch', 'real', [criarVagaBase({ id: 'real-1', fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' } })])
    const agregador = new JobAggregatorService([real])
    const resultado = await agregador.buscar({})
    expect(resultado.statusFonteReal).toBe('com_vagas')
  })

  it('statusFonteReal é "vazia" quando a fonte real teve sucesso mas não retornou vagas — diferente de "falhou"', async () => {
    const realVazia: JobProvider = {
      id: 'jsearch',
      nome: 'JSearch',
      tipo: 'real',
      buscar: vi.fn().mockResolvedValue({ vagas: [], sucesso: true }),
    }
    const agregador = new JobAggregatorService([realVazia])
    const resultado = await agregador.buscar({})
    expect(resultado.statusFonteReal).toBe('vazia')
    expect(resultado.statusFonteReal).not.toBe('falhou')
    expect(resultado.codigosErro).toEqual([])
  })

  it('statusFonteReal é "falhou" quando a fonte real não teve sucesso', async () => {
    const realFalhou: JobProvider = {
      id: 'jsearch',
      nome: 'JSearch',
      tipo: 'real',
      buscar: vi.fn().mockResolvedValue({ vagas: [], sucesso: false, erro: 'timeout' }),
    }
    const agregador = new JobAggregatorService([realFalhou])
    const resultado = await agregador.buscar({})
    expect(resultado.statusFonteReal).toBe('falhou')
  })
})
