import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './vagas'

describe('/api/vagas', () => {
  const apiKeyAnterior = process.env.JSEARCH_API_KEY

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.JSEARCH_API_KEY = apiKeyAnterior
  })

  it('aceita o envelope real do search-v2 com data.jobs', async () => {
    process.env.JSEARCH_API_KEY = 'chave-de-teste'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'OK',
          request_id: 'req-1',
          parameters: { query: 'desenvolvedor', country: 'br' },
          data: {
            jobs: [
              {
                job_id: 'job-1',
                job_title: 'Desenvolvedor Fullstack',
                employer_name: 'Empresa Teste',
                job_description: 'Vaga para pessoa desenvolvedora com React e TypeScript.',
                job_city: 'Sao Paulo',
                job_state: 'SP',
                job_country: 'BR',
                job_apply_link: 'https://example.com/vaga',
              },
            ],
            cursor: 'cursor-1',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const resposta = await handler(new Request('https://careerscore.test/api/vagas?cargo=desenvolvedor&cidade=Sao%20Paulo'))
    const corpo = await resposta.json()

    expect(resposta.status).toBe(200)
    expect(corpo.vagas).toHaveLength(1)
    expect(corpo.vagas[0].titulo).toBe('Desenvolvedor Fullstack')

    // A cidade NÃO deve entrar no texto livre da query — só o cargo.
    const urlExterna = new URL(fetchMock.mock.calls[0][0])
    expect(urlExterna.searchParams.get('query')).toBe('desenvolvedor')
    expect(urlExterna.searchParams.get('query')).not.toContain('Sao Paulo')
    expect(urlExterna.searchParams.get('country')).toBe('br')
  })

  it('envia work_from_home quando a modalidade filtrada e remota', async () => {
    process.env.JSEARCH_API_KEY = 'chave-de-teste'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'OK', data: { jobs: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await handler(new Request('https://careerscore.test/api/vagas?modalidade=Remoto'))

    const urlExterna = new URL(fetchMock.mock.calls[0][0])
    expect(urlExterna.searchParams.get('work_from_home')).toBe('true')
  })

  it('resposta vazia (sucesso, sem vagas) não recebe cache longo — Cache-Control: no-store', async () => {
    process.env.JSEARCH_API_KEY = 'chave-de-teste'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'OK', data: { jobs: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const resposta = await handler(new Request('https://careerscore.test/api/vagas?cargo=estagio'))
    const corpo = await resposta.json()

    expect(corpo.vagas).toHaveLength(0)
    expect(resposta.headers.get('Cache-Control')).toBe('no-store')
  })

  it('resposta com vagas reais recebe cache de 24h', async () => {
    process.env.JSEARCH_API_KEY = 'chave-de-teste'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'OK',
          data: { jobs: [{ job_id: 'job-1', job_title: 'Analista', employer_name: 'Empresa' }] },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const resposta = await handler(new Request('https://careerscore.test/api/vagas?cargo=analista'))

    expect(resposta.headers.get('Cache-Control')).toContain('s-maxage=86400')
  })

  it('inclui contagens de diagnóstico seguras (sem chave, sem descrição completa)', async () => {
    process.env.JSEARCH_API_KEY = 'chave-secreta-nao-deve-vazar'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'OK',
          data: {
            jobs: [
              {
                job_id: 'job-1',
                job_title: 'Analista',
                employer_name: 'Empresa',
                job_description: 'Descrição bem longa e detalhada que não deveria vazar inteira no diagnóstico.',
                job_city: 'Recife',
                job_state: 'PE',
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const resposta = await handler(new Request('https://careerscore.test/api/vagas?cargo=analista&cidade=Recife&estado=PE'))
    const corpo = await resposta.json()
    const corpoTexto = JSON.stringify(corpo)

    expect(corpo.diagnostico).toMatchObject({ brutas: 1, normalizadas: 1, aposFiltroLocalizacao: 1, finais: 1 })
    expect(corpoTexto).not.toContain('chave-secreta-nao-deve-vazar')
  })

  it('vaga real com job_is_remote=false permanece com confiança reduzida (normalizador não distingue presencial de híbrido)', async () => {
    process.env.JSEARCH_API_KEY = 'chave-de-teste'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'OK',
          data: {
            jobs: [
              {
                job_id: 'job-1',
                job_title: 'Assistente Administrativo',
                employer_name: 'Empresa',
                job_city: 'Campina Grande',
                job_state: 'PB',
                job_is_remote: false,
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const resposta = await handler(
      new Request('https://careerscore.test/api/vagas?cargo=assistente&cidade=Jo%C3%A3o%20Pessoa&estado=PB'),
    )
    const corpo = await resposta.json()

    // LIMITAÇÃO CONHECIDA E DOCUMENTADA: job_is_remote=false não é evidência
    // suficiente para classificar como presencial OU híbrido (poderia ser
    // qualquer um dos dois) — o normalizador honestamente marca como
    // modalidade não informada, e avaliarLocalizacaoVaga mantém a vaga com
    // confiança reduzida em vez de excluir ou assumir. Isso significa que,
    // hoje, o filtro estrito de cidade/estado para presencial/híbrido só é
    // realmente exercitado pelas vagas mock (que já vêm com modalidade
    // explícita) — não pelas vagas reais da JSearch. Ver relatório desta etapa.
    expect(corpo.vagas).toHaveLength(1)
    expect(corpo.diagnostico).toMatchObject({ brutas: 1, normalizadas: 1, aposFiltroLocalizacao: 1, finais: 1 })
  })
})
