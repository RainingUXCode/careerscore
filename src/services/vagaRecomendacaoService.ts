import type { Candidato } from '../types/models'
import type { VagaNormalizada } from '../types/vaga'
import type { VagaRecomendada } from '../types/compatibilidade'
import { jobAggregatorService, type OpcoesBuscaVagas } from './jobAggregatorService'
import { calcularCompatibilidade } from './compatibilidadeService'

const COMPATIBILIDADE_MINIMA = 70
const DIAS_MAXIMOS_VAGA_RECENTE = 45

export interface ResultadoRecomendacoes {
  recomendacoes: VagaRecomendada[]
  fontesComFalha: string[]
  codigosErro: string[]
  usouFallback: boolean
  deCache: boolean
  consultadoEm: string
}

function vagaRecente(vaga: VagaNormalizada): boolean {
  if (!vaga.dataPublicacao) return true // sem data informada: não penaliza, mantém no pool
  const publicadaEm = new Date(`${vaga.dataPublicacao}T00:00:00`)
  if (Number.isNaN(publicadaEm.getTime())) return true

  const dias = (Date.now() - publicadaEm.getTime()) / (1000 * 60 * 60 * 24)
  return dias >= 0 && dias <= DIAS_MAXIMOS_VAGA_RECENTE
}

export const vagaRecomendacaoService = {
  async gerarRecomendacoes(candidato: Candidato, opcoes: OpcoesBuscaVagas = {}): Promise<ResultadoRecomendacoes> {
    const { vagas, fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm } = await jobAggregatorService.buscar(
      {},
      opcoes,
    )

    const recomendacoes = vagas
      .filter(vagaRecente)
      .map((vaga) => ({ vaga, compatibilidade: calcularCompatibilidade(candidato, vaga) }))
      .filter((item) => item.compatibilidade.compatibilidadeGeral >= COMPATIBILIDADE_MINIMA)
      .sort((a, b) => b.compatibilidade.compatibilidadeGeral - a.compatibilidade.compatibilidadeGeral)

    return { recomendacoes, fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm }
  },
}
