import type { ResultadoProcessamento } from '../types/models'

const CHAVE_HISTORICO = 'careerscore:historico-score'
const LIMITE_HISTORICO = 12

export interface HistoricoScoreItem {
  idAnalise: string
  nomeCandidato: string
  area: string
  score: number
  dataAnalise: string
  versaoScore?: 'v1' | 'v2'
}

function lerHistorico(): HistoricoScoreItem[] {
  if (typeof window === 'undefined') return []

  try {
    const bruto = window.localStorage.getItem(CHAVE_HISTORICO)
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    return dados.filter((item): item is HistoricoScoreItem =>
      typeof item?.idAnalise === 'string' &&
      typeof item?.score === 'number' &&
      Number.isFinite(item.score) &&
      typeof item?.dataAnalise === 'string',
    )
  } catch {
    return []
  }
}

function gravarHistorico(historico: HistoricoScoreItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico))
}

export const historyService = {
  listar(): HistoricoScoreItem[] {
    return lerHistorico().sort(
      (a, b) => new Date(a.dataAnalise).getTime() - new Date(b.dataAnalise).getTime(),
    )
  },

  salvarResultado(resultado: ResultadoProcessamento): HistoricoScoreItem[] {
    const item: HistoricoScoreItem = {
      idAnalise: resultado.analise.idAnalise,
      nomeCandidato: resultado.candidato.nome,
      area: resultado.candidato.areaInteresse.nome,
      score: resultado.analise.scoreEmpregabilidade,
      dataAnalise: resultado.analise.dataAnalise,
      versaoScore: resultado.analise.versaoScore ?? 'v2',
    }

    const historico = lerHistorico().filter((existente) => existente.idAnalise !== item.idAnalise)
    const atualizado = [...historico, item]
      .sort((a, b) => new Date(a.dataAnalise).getTime() - new Date(b.dataAnalise).getTime())
      .slice(-LIMITE_HISTORICO)

    gravarHistorico(atualizado)
    return atualizado
  },
}
