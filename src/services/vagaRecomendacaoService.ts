import type { Candidato } from '../types/models'
import { Modalidade } from '../types/enums'
import type { FiltroBuscaVagas } from '../types/jobProvider'
import type { VagaNormalizada } from '../types/vaga'
import type { VagaRecomendada } from '../types/compatibilidade'
import { jobAggregatorService, type OpcoesBuscaVagas } from './jobAggregatorService'
import { calcularCompatibilidade } from './compatibilidadeService'
import { resolverAreaDoCandidato } from './areaBridgeService'

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

function textoOuUndefined(valor: string | undefined): string | undefined {
  const limpo = valor?.trim()
  return limpo ? limpo : undefined
}

function obterCargoBusca(candidato: Candidato): string | undefined {
  const experienciaAtual = candidato.experiencias.find((experiencia) => experiencia.empregoAtual && experiencia.cargo.trim())
  const experienciaComCargo = experienciaAtual ?? candidato.experiencias.find((experiencia) => experiencia.cargo.trim())
  return textoOuUndefined(experienciaComCargo?.cargo)
}

export function construirFiltrosBusca(candidato: Candidato): FiltroBuscaVagas {
  const area = resolverAreaDoCandidato(candidato)
  const modalidadeUnica =
    candidato.modalidadesPreferidas.length === 1 && candidato.modalidadesPreferidas[0] === Modalidade.REMOTO
      ? Modalidade.REMOTO
      : undefined

  return {
    areaId: area?.id,
    cargo: obterCargoBusca(candidato),
    palavraChave: textoOuUndefined(
      candidato.areaInteresse.nomePersonalizado || (area ? undefined : candidato.areaInteresse.nome),
    ),
    cidade: textoOuUndefined(candidato.cidade),
    estado: textoOuUndefined(candidato.estado),
    pais: 'Brasil',
    modalidade: modalidadeUnica,
  }
}

export const vagaRecomendacaoService = {
  async gerarRecomendacoes(candidato: Candidato, opcoes: OpcoesBuscaVagas = {}): Promise<ResultadoRecomendacoes> {
    const filtros = construirFiltrosBusca(candidato)
    const { vagas, fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm } = await jobAggregatorService.buscar(
      filtros,
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
