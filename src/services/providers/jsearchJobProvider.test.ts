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
      cidade: 'SÃ£o Paulo',
      estado: 'SP',
      pais: 'Brasil',
      modalidade: Modalidade.REMOTO,
    })

    const url = new URL(fetchMock.mock.calls[0][0], 'https://careerscore.test')
    expect(url.pathname).toBe('/api/vagas')
    expect(url.searchParams.get('area')).toBe('tecnologia')
    expect(url.searchParams.get('cargo')).toBe('Desenvolvedor Front-end')
    expect(url.searchParams.get('cidade')).toBe('SÃ£o Paulo')
    expect(url.searchParams.get('estado')).toBe('SP')
    expect(url.searchParams.get('pais')).toBe('Brasil')
    expect(url.searchParams.get('modalidade')).toBe('Remoto')
  })
})
