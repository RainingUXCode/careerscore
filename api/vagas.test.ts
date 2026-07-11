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
          parameters: { query: 'desenvolvedor em Sao Paulo', country: 'br' },
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

    const urlExterna = new URL(fetchMock.mock.calls[0][0])
    expect(urlExterna.searchParams.get('query')).toBe('desenvolvedor em Sao Paulo')
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
})
