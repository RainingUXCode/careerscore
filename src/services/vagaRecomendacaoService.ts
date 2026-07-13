import type { Candidato } from '../types/models'
import type { FiltroBuscaVagas } from '../types/jobProvider'
import type { VagaNormalizada } from '../types/vaga'
import type { VagaRecomendada } from '../types/compatibilidade'
import { jobAggregatorService, type OpcoesBuscaVagas, type StatusFonteReal } from './jobAggregatorService'
import { calcularCompatibilidade } from './compatibilidadeService'
import { resolverAreaDoCandidato } from './areaBridgeService'
import { termoBuscaContratoInferido } from './objetivoContratoService'
import { candidatoElegivelParaPublicoDaVaga } from './publicoVagaService'
import { modalidadePreferidaAtiva } from './modalidadePreferenciaService'

const DIAS_MAXIMOS_VAGA_RECENTE = 45
/** Termo único de busca ampla quando não há objetivo definido nem evidência de área. */
const TERMO_EXPLORACAO_PADRAO = 'primeiro emprego assistente auxiliar estágio'

export interface ResultadoRecomendacoes {
  recomendacoes: VagaRecomendada[]
  fontesComFalha: string[]
  codigosErro: string[]
  usouFallback: boolean
  deCache: boolean
  consultadoEm: string
  totalVagasRetornadas: number
  totalVagasEncontradas: number
  totalVagasRecentes: number
  totalVagasElegiveis: number
  distribuicaoFaixas: {
    alta80: number
    media60a79: number
    entrada40a59: number
    preparacaoAbaixo40: number
  }
  statusFonteReal: StatusFonteReal
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

function modalidadeUnica(modalidades: Candidato['modalidadesPreferidas']): Candidato['modalidadesPreferidas'][number] | undefined {
  return modalidades.length === 1 ? modalidades[0] : undefined
}

function filtroBase(candidato: Candidato): Pick<FiltroBuscaVagas, 'areaId' | 'cidade' | 'estado' | 'pais'> {
  const area = resolverAreaDoCandidato(candidato)
  return {
    areaId: area?.id,
    cidade: textoOuUndefined(candidato.cidade),
    estado: textoOuUndefined(candidato.estado),
    pais: 'Brasil',
  }
}

export interface BuscaObjetivo {
  filtros: FiltroBuscaVagas
  objetivoOrigem?: string
  buscaAmpla: boolean
}

/**
 * Monta EXATAMENTE uma busca automática por análise — nunca várias em
 * paralelo, para preservar a cota gratuita da fonte real de vagas.
 *
 * `cargo` e `areaId` vão como filtros estruturados; `palavraChave` carrega só
 * um complemento que ainda não está representado em cargo/área (ex: indicador
 * de nível "estágio"/"jovem aprendiz") — nunca repete cargo, área, nem
 * adiciona a competência técnica principal (isso restringiria demais a busca
 * externa). Quem monta a query de texto final é `api/vagas.ts`, via
 * `montarQueryJSearch` — esta função só decide os filtros estruturados.
 *
 * As demais opções de objetivo (`objetivoProfissional.opcoes[1]`, `[2]`...)
 * continuam salvas no candidato para uso futuro; só não alimentam a busca
 * automática nesta etapa.
 */
export function construirBuscaObjetivo(candidato: Candidato): BuscaObjetivo {
  const base = filtroBase(candidato)
  const objetivo = candidato.objetivoProfissional

  if (objetivo?.modo === 'definido' && objetivo.opcoes.length > 0) {
    const principal = objetivo.opcoes[0]
    return {
      filtros: {
        ...base,
        cargo: textoOuUndefined(principal.cargoOuArea),
        palavraChave: termoBuscaContratoInferido(principal.nivelAlvo),
        modalidade: modalidadeUnica(principal.modalidadesAceitas),
      },
      objetivoOrigem: principal.cargoOuArea,
      buscaAmpla: false,
    }
  }

  if (objetivo?.modo === 'exploracao') {
    const area = resolverAreaDoCandidato(candidato)
    return {
      filtros: {
        ...base,
        cargo: undefined,
        palavraChave: TERMO_EXPLORACAO_PADRAO,
        modalidade: modalidadeUnica(candidato.modalidadesPreferidas),
      },
      objetivoOrigem: area ? `Exploração profissional — ${area.nome}` : 'Exploração profissional',
      buscaAmpla: true,
    }
  }

  const cargo = obterCargoBusca(candidato)
  return {
    filtros: {
      ...base,
      cargo,
      modalidade: modalidadeUnica(candidato.modalidadesPreferidas),
    },
    objetivoOrigem: cargo,
    buscaAmpla: false,
  }
}

export function construirFiltrosBusca(candidato: Candidato): FiltroBuscaVagas {
  return construirBuscaObjetivo(candidato).filtros
}

function calcularAderenciaConhecimentos(candidato: Candidato, vaga: VagaNormalizada): number {
  const conhecimentos = candidato.competencias.map((competencia) => competencia.nome)
  if (conhecimentos.length === 0) return 0
  const textoVaga = [vaga.titulo, vaga.descricao, ...vaga.requisitosObrigatorios.map((r) => r.nome), ...vaga.requisitosDesejaveis.map((r) => r.nome)]
    .join(' ')
    .toLowerCase()
  return conhecimentos.filter((conhecimento) => textoVaga.includes(conhecimento.toLowerCase())).length
}

function calcularDistribuicaoFaixas(recomendacoes: VagaRecomendada[]): ResultadoRecomendacoes['distribuicaoFaixas'] {
  return recomendacoes.reduce<ResultadoRecomendacoes['distribuicaoFaixas']>(
    (distribuicao, item) => {
      const compatibilidade = item.compatibilidade.compatibilidadeGeral
      if (compatibilidade >= 80) distribuicao.alta80 += 1
      else if (compatibilidade >= 60) distribuicao.media60a79 += 1
      else if (compatibilidade >= 40) distribuicao.entrada40a59 += 1
      else distribuicao.preparacaoAbaixo40 += 1
      return distribuicao
    },
    { alta80: 0, media60a79: 0, entrada40a59: 0, preparacaoAbaixo40: 0 },
  )
}

export const vagaRecomendacaoService = {
  async gerarRecomendacoes(candidato: Candidato, opcoes: OpcoesBuscaVagas = {}): Promise<ResultadoRecomendacoes> {
    const busca = construirBuscaObjetivo(candidato)
    const resultado = await jobAggregatorService.buscar(busca.filtros, opcoes)

    const vagasElegiveisPorPublico = resultado.vagas
      .filter((vaga) => candidatoElegivelParaPublicoDaVaga(candidato, vaga))
    const modalidadePreferida = modalidadePreferidaAtiva(candidato)

    const vagasAvaliadas = vagasElegiveisPorPublico
      .map((vaga) => {
        const compatibilidade = calcularCompatibilidade(candidato, vaga)
        const compatibilidadeAjustada = busca.buscaAmpla
          ? {
              ...compatibilidade,
              confiabilidade: {
                ...compatibilidade.confiabilidade,
                percentual: Math.round(compatibilidade.confiabilidade.percentual * 0.85),
                resumo: 'Busca ampla sem objetivo definido; a confiança da recomendação é menor.',
              },
            }
          : compatibilidade
        return {
          vaga,
          compatibilidade: compatibilidadeAjustada,
          objetivoOrigem: busca.objetivoOrigem,
          buscaAmpla: busca.buscaAmpla,
        }
      })
    const vagasElegiveisPorSenioridade = vagasAvaliadas.filter(
      (item) => !item.compatibilidade.impeditivos.some((impeditivo) => impeditivo.motivo === 'senioridade_incompativel'),
    )
    const vagasRecentes = vagasElegiveisPorSenioridade.filter((item) => vagaRecente(item.vaga))

    const recomendacoes = vagasRecentes
      // Nunca excluir só por nota baixa — só por impeditivos reais que o motor
      // já calcula (idioma eliminatório, licença obrigatória ausente,
      // localização objetivamente incompatível). Vagas encerradas já foram
      // removidas antes, no agregador.
      .filter((item) => item.compatibilidade.impeditivos.length === 0)
      .sort(
        (a, b) =>
          b.compatibilidade.compatibilidadeGeral - a.compatibilidade.compatibilidadeGeral ||
          Number(b.vaga.modalidade === modalidadePreferida) - Number(a.vaga.modalidade === modalidadePreferida) ||
          new Date(b.vaga.dataPublicacao ?? 0).getTime() - new Date(a.vaga.dataPublicacao ?? 0).getTime() ||
          b.compatibilidade.confiabilidade.percentual - a.compatibilidade.confiabilidade.percentual ||
          calcularAderenciaConhecimentos(candidato, b.vaga) - calcularAderenciaConhecimentos(candidato, a.vaga),
      )

    return {
      recomendacoes,
      fontesComFalha: resultado.fontesComFalha,
      codigosErro: resultado.codigosErro,
      usouFallback: resultado.usouFallback,
      deCache: resultado.deCache,
      consultadoEm: resultado.consultadoEm,
      totalVagasRetornadas: resultado.vagas.length,
      totalVagasEncontradas: vagasElegiveisPorSenioridade.length,
      totalVagasRecentes: vagasRecentes.length,
      totalVagasElegiveis: recomendacoes.length,
      distribuicaoFaixas: calcularDistribuicaoFaixas(recomendacoes),
      statusFonteReal: resultado.statusFonteReal,
    }
  },
}
