import { describe, it, expect, vi, afterEach } from 'vitest'
import { JSearchJobProvider } from './jsearchJobProvider'
import { Modalidade } from '../../types/enums'

describe('JSearchJobProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna sucesso com as vagas normalizadas quando a resposta é OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ vagas: [{ id: 'jsearch-1' }], pagina: 1 }),
      }),
    )
    const provider = new JSearchJobProvider()
    const resultado = await provider.buscar({})
    expect(resultado.sucesso).toBe(true)
    expect(resultado.vagas).toHaveLength(1)
  })

  it('resposta vazia (sem vagas) ainda é sucesso, com lista vazia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ vagas: [], pagina: 1 }),
      }),
    )
    const provider = new JSearchJobProvider()
    const resultado = await provider.buscar({})
    expect(resultado.sucesso).toBe(true)
    expect(resultado.vagas).toEqual([])
  })

  it('trata erro HTTP (ex: chave ausente) retornando sucesso=false com o código de erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ erro: 'chave_ausente', mensagem: 'não configurada' }),
      }),
    )
    const provider = new JSearchJobProvider()
    const resultado = await provider.buscar({})
    expect(resultado.sucesso).toBe(false)
    expect(resultado.erro).toBe('chave_ausente')
  })

  it('trata cota excedida (429) sem lançar exceção', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ erro: 'cota_excedida', mensagem: 'limite atingido' }),
      }),
    )
    const provider = new JSearchJobProvider()
    const resultado = await provider.buscar({})
    expect(resultado.sucesso).toBe(false)
    expect(resultado.erro).toBe('cota_excedida')
  })

  it('trata falha de rede/timeout sem lançar exceção', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network fail')))
    const provider = new JSearchJobProvider()
    const resultado = await provider.buscar({})
    expect(resultado.sucesso).toBe(false)
    expect(resultado.vagas).toEqual([])
  })
  it('envia os filtros recebidos para a rota /api/vagas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vagas: [], pagina: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new JSearchJobProvider()
    await provider.buscar({
      areaId: 'tecnologia',
      cargo: 'Desenvolvedor Front-end',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil',
      modalidade: Modalidade.REMOTO,
    })

    const url = new URL(fetchMock.mock.calls[0][0], 'https://careerscore.test')
    expect(url.pathname).toBe('/api/vagas')
    expect(url.searchParams.get('area')).toBe('tecnologia')
    expect(url.searchParams.get('cargo')).toBe('Desenvolvedor Front-end')
    expect(url.searchParams.get('cidade')).toBe('São Paulo')
    expect(url.searchParams.get('estado')).toBe('SP')
    expect(url.searchParams.get('pais')).toBe('Brasil')
    expect(url.searchParams.get('modalidade')).toBe('Remoto')
  })

  it('sem forcarAtualizacao, não adiciona parâmetro de cache-busting', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vagas: [], pagina: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new JSearchJobProvider()
    await provider.buscar({ cargo: 'Analista' })

    const url = new URL(fetchMock.mock.calls[0][0], 'https://careerscore.test')
    expect(url.searchParams.has('atualizar')).toBe(false)
  })

  it('com forcarAtualizacao, adiciona um parâmetro de cache-busting que muda a URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vagas: [], pagina: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new JSearchJobProvider()
    await provider.buscar({ cargo: 'Analista' }, { forcarAtualizacao: true })

    const url = new URL(fetchMock.mock.calls[0][0], 'https://careerscore.test')
    expect(url.searchParams.has('atualizar')).toBe(true)
    expect(url.searchParams.get('atualizar')).toBeTruthy()
  })

  it('duas chamadas seguidas com forcarAtualizacao geram URLs diferentes (garantindo miss de CDN)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vagas: [], pagina: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new JSearchJobProvider()
    await provider.buscar({ cargo: 'Analista' }, { forcarAtualizacao: true })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await provider.buscar({ cargo: 'Analista' }, { forcarAtualizacao: true })

    const primeiraUrl = fetchMock.mock.calls[0][0]
    const segundaUrl = fetchMock.mock.calls[1][0]
    expect(primeiraUrl).not.toBe(segundaUrl)
  })
})
