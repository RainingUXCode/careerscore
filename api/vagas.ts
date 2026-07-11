import { normalizarVagaJSearch } from '../src/services/normalizers/jSearchJobNormalizer'
import type { JSearchRawJob, JSearchSearchResponse } from '../src/services/providers/jsearch/types'
import type { VagaNormalizada } from '../src/types/vaga'
import { obterAreaPorId } from '../src/data/areasProfissionais'

/**
 * GET /api/vagas
 *
 * Proxy fino para a JSearch (API oficial da OpenWeb Ninja). O front-end nunca chama a JSearch
 * diretamente nem vê a chave — só este arquivo, que roda no servidor, tem
 * acesso a `JSEARCH_API_KEY`.
 *
 * Parâmetros aceitos (todos opcionais, todos validados/limitados):
 *   termo, area, cargo, cidade, estado, pais, modalidade, pagina
 *
 * Resposta 200: { vagas: VagaNormalizada[], pagina: number, fonte: {...} }
 * Resposta de erro: { erro: string, mensagem: string } com status apropriado
 */

export const config = { runtime: 'edge' }

const JSEARCH_ENDPOINT = 'https://api.openwebninja.com/jsearch/search-v2'
const TIMEOUT_MS = 8000
const LIMITE_MAXIMO_RESULTADOS = 10

function respostaErro(erro: string, mensagem: string, status: number): Response {
  return new Response(JSON.stringify({ erro, mensagem }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Corta e sanitiza um parâmetro de texto vindo da query string, com limite de tamanho. */
function sanitizarTexto(valor: string | null, tamanhoMaximo = 80): string | undefined {
  if (!valor) return undefined
  const limpo = valor.trim().slice(0, tamanhoMaximo)
  return limpo.length > 0 ? limpo : undefined
}

function extrairVagasBrutas(corpo: JSearchSearchResponse): JSearchRawJob[] | null {
  if (corpo.status !== 'OK') return null
  if (Array.isArray(corpo.data)) return corpo.data
  if (corpo.data && typeof corpo.data === 'object' && Array.isArray(corpo.data.jobs)) return corpo.data.jobs
  return null
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return respostaErro('metodo_nao_permitido', 'Use GET.', 405)
  }

  const apiKey = process.env.JSEARCH_API_KEY
  if (!apiKey) {
    return respostaErro('chave_ausente', 'A fonte real de vagas não está configurada neste ambiente.', 503)
  }

  const url = new URL(request.url)
  const termo = sanitizarTexto(url.searchParams.get('termo'))
  const areaId = sanitizarTexto(url.searchParams.get('area'), 60)
  const cargo = sanitizarTexto(url.searchParams.get('cargo'))
  const cidade = sanitizarTexto(url.searchParams.get('cidade'), 60)
  const estado = sanitizarTexto(url.searchParams.get('estado'), 60)
  const pais = sanitizarTexto(url.searchParams.get('pais'), 60) ?? 'Brasil'
  const paginaBruta = Number(url.searchParams.get('pagina') ?? '1')
  const pagina = Number.isFinite(paginaBruta) && paginaBruta > 0 ? Math.min(Math.floor(paginaBruta), 5) : 1

  const areaNome = areaId ? obterAreaPorId(areaId)?.nome : undefined
  const termosBusca = [cargo, termo, areaNome].filter(Boolean).join(' ') || 'vaga'
  const query = cidade ? `${termosBusca} em ${cidade}` : termosBusca

  const params = new URLSearchParams({
    query,
    page: String(pagina),
    num_pages: '1',
    country: pais.toLowerCase().startsWith('bras') ? 'br' : pais.slice(0, 2).toLowerCase(),
  })
  if (url.searchParams.get('modalidade') === 'Remoto') {
    params.set('work_from_home', 'true')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let respostaBruta: Response
  try {
    respostaBruta = await fetch(`${JSEARCH_ENDPOINT}?${params.toString()}`, {
      headers: {
        'X-API-Key': apiKey,
      },
      signal: controller.signal,
    })
  } catch (erro) {
    clearTimeout(timeoutId)
    if (erro instanceof Error && erro.name === 'AbortError') {
      return respostaErro('timeout', 'A fonte real de vagas demorou demais para responder.', 504)
    }
    return respostaErro('falha_conexao', 'Não foi possível conectar à fonte real de vagas.', 502)
  }
  clearTimeout(timeoutId)

  if (respostaBruta.status === 429) {
    return respostaErro('cota_excedida', 'A cota gratuita da fonte real de vagas foi atingida.', 429)
  }
  if (!respostaBruta.ok) {
    return respostaErro('erro_fonte_externa', 'A fonte real de vagas retornou um erro.', 502)
  }

  let corpo: JSearchSearchResponse
  try {
    corpo = await respostaBruta.json()
  } catch {
    return respostaErro('resposta_invalida', 'A fonte real de vagas retornou uma resposta inválida.', 502)
  }

  const vagasBrutas = extrairVagasBrutas(corpo)
  if (!vagasBrutas) {
    return respostaErro('resposta_invalida', 'A fonte real de vagas não retornou resultados utilizáveis.', 502)
  }

  let vagas: VagaNormalizada[] = []
  try {
    vagas = vagasBrutas.slice(0, LIMITE_MAXIMO_RESULTADOS).map(normalizarVagaJSearch)
    if (estado) {
      vagas = vagas.filter(
        (vaga) => !vaga.localizacao.estado || vaga.localizacao.estado.toLowerCase().includes(estado.toLowerCase()),
      )
    }
  } catch {
    return respostaErro('falha_normalizacao', 'Não foi possível interpretar os dados retornados pela fonte real.', 502)
  }

  return new Response(
    JSON.stringify({
      vagas,
      pagina,
      fonte: { id: 'jsearch', nome: 'JSearch (LinkedIn, Indeed, Glassdoor e outros)', tipo: 'real' },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    },
  )
}
