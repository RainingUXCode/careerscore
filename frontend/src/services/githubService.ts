import type { Candidato } from '../types/models'
import type { GithubAnalise, RepositorioGithub } from '../types/externo'

export type { GithubAnalise, RepositorioGithub }

interface RepoGithub {
  name: string
  description: string | null
  html_url: string
  language: string | null
  pushed_at: string
  stargazers_count: number
  size: number
  fork: boolean
}

const DIAS_MAXIMOS_ATIVIDADE_PROJETO = 365 * 3 // ~3 anos: repositório muito antigo/parado não é um bom "projeto atual"

/**
 * Um repositório só é seguro o suficiente para virar um "projeto" no currículo
 * quando há dados reais suficientes para descrevê-lo sem inventar: descrição
 * preenchida, linguagem identificável e conteúdo não-trivial (size > 0).
 *
 * Não buscamos o README de cada repositório aqui (custaria uma requisição a
 * mais por repositório à API do GitHub, multiplicando o risco de esbarrar no
 * limite de 60 req/hora sem autenticação) — por isso description + linguagem
 * + tamanho servem como um proxy honesto e barato de "tem conteúdo real".
 */
function repoQualificaComoProjeto(repo: RepoGithub): repo is RepoGithub & { description: string } {
  const temDescricao = Boolean(repo.description?.trim())
  const temLinguagem = Boolean(repo.language)
  const temConteudo = repo.size > 0
  const diasDesdeAtividade = Math.round((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24))
  const ativoRecentemente = Number.isFinite(diasDesdeAtividade) && diasDesdeAtividade <= DIAS_MAXIMOS_ATIVIDADE_PROJETO

  return temDescricao && temLinguagem && temConteudo && ativoRecentemente
}

function extrairUsuarioGithub(url: string): string | null {
  try {
    const semProtocolo = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
    if (!semProtocolo.toLowerCase().startsWith('github.com/')) return null
    const partes = semProtocolo.split('/').filter(Boolean)
    // partes[0] === "github.com", partes[1] === usuario
    const usuario = partes[1]
    if (!usuario) return null
    return usuario.replace(/[?#].*$/, '')
  } catch {
    return null
  }
}

async function buscarJson<T>(url: string): Promise<{ ok: boolean; status: number; dados?: T }> {
  const resposta = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!resposta.ok) return { ok: false, status: resposta.status }
  const dados = (await resposta.json()) as T
  return { ok: true, status: resposta.status, dados }
}

export const githubService = {
  extrairUsuario: extrairUsuarioGithub,

  /**
   * Analisa o perfil público do GitHub via API REST oficial (sem autenticação).
   * Sujeito ao limite de 60 requisições/hora por IP da API pública do GitHub.
   */
  async analisar(url: string): Promise<GithubAnalise> {
    const usuario = extrairUsuarioGithub(url)
    if (!usuario) {
      return {
        usuario: '',
        encontrado: false,
        totalRepositoriosPublicos: 0,
        linguagens: [],
        temReadmePerfil: false,
        diasDesdeUltimaAtividade: null,
        estrelasTotais: 0,
        repositoriosDestaque: [],
        erro: 'URL não parece ser um perfil do GitHub.',
      }
    }

    try {
      const [perfil, repos, readmePerfil] = await Promise.all([
        buscarJson<{ public_repos: number }>(`https://api.github.com/users/${usuario}`),
        buscarJson<RepoGithub[]>(`https://api.github.com/users/${usuario}/repos?per_page=100&sort=pushed`),
        buscarJson<unknown>(`https://api.github.com/repos/${usuario}/${usuario}`),
      ])

      if (!perfil.ok) {
        return {
          usuario,
          encontrado: false,
          totalRepositoriosPublicos: 0,
          linguagens: [],
          temReadmePerfil: false,
          diasDesdeUltimaAtividade: null,
          estrelasTotais: 0,
          repositoriosDestaque: [],
          erro: perfil.status === 404 ? 'Usuário do GitHub não encontrado.' : 'Não foi possível consultar o GitHub agora (limite de requisições ou instabilidade).',
        }
      }

      const listaRepos = (repos.dados ?? []).filter((repo) => !repo.fork)

      const contagemLinguagens = new Map<string, number>()
      let estrelasTotais = 0
      let ultimaAtividade: number | null = null

      listaRepos.forEach((repo) => {
        if (repo.language) {
          contagemLinguagens.set(repo.language, (contagemLinguagens.get(repo.language) ?? 0) + 1)
        }
        estrelasTotais += repo.stargazers_count ?? 0
        const pushedEm = new Date(repo.pushed_at).getTime()
        if (!Number.isNaN(pushedEm) && (ultimaAtividade === null || pushedEm > ultimaAtividade)) {
          ultimaAtividade = pushedEm
        }
      })

      const linguagens = Array.from(contagemLinguagens.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([linguagem]) => linguagem)

      const repositoriosDestaque: RepositorioGithub[] = listaRepos
        .filter(repoQualificaComoProjeto)
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 5)
        .map((repo) => ({
          nome: repo.name,
          descricao: repo.description,
          url: repo.html_url,
          linguagem: repo.language,
        }))

      const diasDesdeUltimaAtividade =
        ultimaAtividade !== null ? Math.round((Date.now() - ultimaAtividade) / (1000 * 60 * 60 * 24)) : null

      return {
        usuario,
        encontrado: true,
        totalRepositoriosPublicos: perfil.dados?.public_repos ?? listaRepos.length,
        linguagens,
        temReadmePerfil: readmePerfil.ok,
        diasDesdeUltimaAtividade,
        estrelasTotais,
        repositoriosDestaque,
      }
    } catch {
      return {
        usuario,
        encontrado: false,
        totalRepositoriosPublicos: 0,
        linguagens: [],
        temReadmePerfil: false,
        diasDesdeUltimaAtividade: null,
        estrelasTotais: 0,
        repositoriosDestaque: [],
        erro: 'Não foi possível conectar ao GitHub agora.',
      }
    }
  },

  /** Encontra o primeiro link de GitHub informado pelo candidato, se houver. */
  obterUrlGithub(candidato: Candidato): string | null {
    const link = candidato.links.find(
      (l) => l.url.trim() && (l.tipo.toLowerCase().includes('github') || l.url.toLowerCase().includes('github.com')),
    )
    return link?.url ?? null
  },
}
