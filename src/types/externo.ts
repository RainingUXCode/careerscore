export interface RepositorioGithub {
  nome: string
  /** Sempre presente — repositórios sem descrição real não qualificam como projeto (ver githubService). */
  descricao: string
  url: string
  linguagem: string | null
}

export interface GithubAnalise {
  usuario: string
  encontrado: boolean
  totalRepositoriosPublicos: number
  linguagens: string[]
  temReadmePerfil: boolean
  diasDesdeUltimaAtividade: number | null
  estrelasTotais: number
  /** Repositórios públicos reais em destaque (mais recentes/relevantes), sem forks. */
  repositoriosDestaque: RepositorioGithub[]
  erro?: string
}

/** Resultado de análises externas (GitHub, texto de certificados) feitas antes de gerar a análise. */
export interface ContextoExterno {
  github?: GithubAnalise
  /** idCertificado -> competências detectadas no texto do arquivo */
  competenciasPorCertificado?: Record<string, string[]>
}
