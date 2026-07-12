import type { Candidato } from '../types/models'
import type { FiltroBuscaVagas } from '../types/jobProvider'
import type { VagaNormalizada } from '../types/vaga'
import type { VagaRecomendada } from '../types/compatibilidade'
import { jobAggregatorService, type OpcoesBuscaVagas } from './jobAggregatorService'
import { calcularCompatibilidade } from './compatibilidadeService'
import { resolverAreaDoCandidato } from './areaBridgeService'

const COMPATIBILIDADE_MINIMA = 55
const DIAS_MAXIMOS_VAGA_RECENTE = 45

export interface ResultadoRecomendacoes {
  recomendacoes: VagaRecomendada[]
  fontesComFalha: string[]
  codigosErro: string[]
  usouFallback: boolean
  deCache: boolean
  consultadoEm: string
  totalVagasEncontradas: number
  totalVagasRecentes: number
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
  const objetivo = candidato.objetivoProfissional
  if (objetivo?.modo === 'multiplas_opcoes') {
    const principal = objetivo.opcoes.find((opcao) => opcao.principal) ?? objetivo.opcoes[0]
    return textoOuUndefined(principal?.cargoOuArea)
  }
  const cargoDesejado = objetivo?.modo === 'definido' ? textoOuUndefined(objetivo.cargoDesejado) : undefined
  if (cargoDesejado) return cargoDesejado
  const experienciaAtual = candidato.experiencias.find((experiencia) => experiencia.empregoAtual && experiencia.cargo.trim())
  const experienciaComCargo = experienciaAtual ?? candidato.experiencias.find((experiencia) => experiencia.cargo.trim())
  return textoOuUndefined(experienciaComCargo?.cargo)
}

export function montarTermosBuscaObjetivo(candidato: Candidato): string {
  const area = resolverAreaDoCandidato(candidato)
  const objetivo = candidato.objetivoProfissional
  if (objetivo?.modo === 'exploracao') {
    return ['primeiro emprego', 'estagio', 'assistente', 'auxiliar', area?.nome].filter(Boolean).join(' ')
  }
  const cargo = textoOuUndefined(objetivo?.cargoDesejado) ?? obterCargoBusca(candidato)
  const conhecimentoPrincipal = objetivo?.conhecimentosPrioritarios?.[0]
  return [cargo, area?.nome, conhecimentoPrincipal].filter(Boolean).join(' ').trim() || 'vaga'
}

export interface BuscaObjetivo {
  filtros: FiltroBuscaVagas
  objetivoOrigem?: string
  buscaAmpla?: boolean
}

function modalidadeUnica(modalidades: Candidato['modalidadesPreferidas']): Candidato['modalidadesPreferidas'][number] | undefined {
  return modalidades.length === 1 ? modalidades[0] : undefined
}

function filtroBase(candidato: Candidato): Pick<FiltroBuscaVagas, 'areaId' | 'cidade' | 'estado' | 'pais'> {
  const area = resolverAreaDoCandidato(candidato)
  const objetivo = candidato.objetivoProfissional
  return {
    areaId: area?.id,
    cidade: textoOuUndefined(objetivo?.cidadeBusca) ?? textoOuUndefined(candidato.cidade),
    estado: textoOuUndefined(objetivo?.estadoBusca) ?? textoOuUndefined(candidato.estado),
    pais: textoOuUndefined(objetivo?.paisBusca) ?? 'Brasil',
  }
}

export function construirBuscasObjetivo(candidato: Candidato): BuscaObjetivo[] {
  const area = resolverAreaDoCandidato(candidato)
  const objetivo = candidato.objetivoProfissional
  const base = filtroBase(candidato)

  if (objetivo?.modo === 'exploracao') {
    const termosAmplos = [
      'primeiro emprego assistente auxiliar sem experiencia',
      'estagio jovem aprendiz trainee',
      'atendimento administrativo comercial operacoes',
    ]
    const preferencias = [
      ...objetivo.preferenciasExploracao.interesses,
      ...objetivo.preferenciasExploracao.prefereTrabalharCom,
    ].slice(0, 1)

    return [...termosAmplos, ...preferencias].slice(0, 4).map((termo) => ({
      filtros: {
        ...base,
        cargo: undefined,
        palavraChave: [termo, area?.nome].filter(Boolean).join(' '),
        modalidade: undefined,
      },
      objetivoOrigem: 'Exploração profissional',
      buscaAmpla: true,
    }))
  }

  if (objetivo?.modo === 'multiplas_opcoes' && objetivo.opcoes.length > 0) {
    return [...objetivo.opcoes]
      .sort((a, b) => Number(b.principal) - Number(a.principal) || a.prioridade - b.prioridade)
      .slice(0, 3)
      .map((opcao) => ({
        filtros: {
          ...base,
          cargo: textoOuUndefined(opcao.cargoOuArea),
          palavraChave: [opcao.cargoOuArea, area?.nome].filter(Boolean).join(' '),
          modalidade: modalidadeUnica(opcao.modalidadesAceitas),
        },
        objetivoOrigem: opcao.cargoOuArea,
        buscaAmpla: false,
      }))
  }

  const modalidades = objetivo?.modalidadesAceitas?.length ? objetivo.modalidadesAceitas : candidato.modalidadesPreferidas
  return [{
    filtros: {
      ...base,
      cargo: obterCargoBusca(candidato),
      palavraChave: textoOuUndefined(montarTermosBuscaObjetivo(candidato)),
      modalidade: modalidadeUnica(modalidades),
    },
    objetivoOrigem: objetivo?.cargoDesejado,
    buscaAmpla: false,
  }]
}

export function construirFiltrosBusca(candidato: Candidato): FiltroBuscaVagas {
  return construirBuscasObjetivo(candidato)[0]?.filtros ?? { palavraChave: 'vaga', pais: 'Brasil' }
}

function calcularAderenciaConhecimentos(candidato: Candidato, vaga: VagaNormalizada): number {
  const conhecimentos = candidato.objetivoProfissional?.conhecimentosPrioritarios ?? []
  if (conhecimentos.length === 0) return 0
  const textoVaga = [vaga.titulo, vaga.descricao, ...vaga.requisitosObrigatorios.map((r) => r.nome), ...vaga.requisitosDesejaveis.map((r) => r.nome)]
    .join(' ')
    .toLowerCase()
  return conhecimentos.filter((conhecimento) => textoVaga.includes(conhecimento.toLowerCase())).length
}

export const vagaRecomendacaoService = {
  async gerarRecomendacoes(candidato: Candidato, opcoes: OpcoesBuscaVagas = {}): Promise<ResultadoRecomendacoes> {
    const buscas = construirBuscasObjetivo(candidato)
    const resultados = await Promise.all(
      buscas.map(async (busca) => ({
        busca,
        resultado: await jobAggregatorService.buscar(busca.filtros, opcoes),
      })),
    )

    const fontesComFalha = [...new Set(resultados.flatMap(({ resultado }) => resultado.fontesComFalha))]
    const codigosErro = [...new Set(resultados.flatMap(({ resultado }) => resultado.codigosErro))]
    const usouFallback = resultados.some(({ resultado }) => resultado.usouFallback)
    const deCache = resultados.every(({ resultado }) => resultado.deCache)
    const consultadoEm = resultados[0]?.resultado.consultadoEm ?? new Date().toISOString()
    const origemPorVaga = new Map<string, BuscaObjetivo>()
    const vagasMap = new Map<string, VagaNormalizada>()

    for (const { busca, resultado } of resultados) {
      for (const vaga of resultado.vagas) {
        const chave = vaga.urlOriginal ?? vaga.idExterno ?? vaga.id
        if (!vagasMap.has(chave)) {
          vagasMap.set(chave, vaga)
          origemPorVaga.set(chave, busca)
        }
      }
    }

    const vagas = Array.from(vagasMap.values())

    const vagasRecentes = vagas.filter(vagaRecente)
    const recomendacoes = vagasRecentes
      .map((vaga) => {
        const chave = vaga.urlOriginal ?? vaga.idExterno ?? vaga.id
        const origem = origemPorVaga.get(chave)
        const compatibilidade = calcularCompatibilidade(candidato, vaga)
        const compatibilidadeAjustada = origem?.buscaAmpla
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
          objetivoOrigem: origem?.objetivoOrigem,
          buscaAmpla: origem?.buscaAmpla,
        }
      })
      .filter((item) => item.compatibilidade.compatibilidadeGeral >= COMPATIBILIDADE_MINIMA)
      .sort(
        (a, b) =>
          b.compatibilidade.compatibilidadeGeral - a.compatibilidade.compatibilidadeGeral ||
          calcularAderenciaConhecimentos(candidato, b.vaga) - calcularAderenciaConhecimentos(candidato, a.vaga),
      )

    return {
      recomendacoes,
      fontesComFalha,
      codigosErro,
      usouFallback,
      deCache,
      consultadoEm,
      totalVagasEncontradas: vagas.length,
      totalVagasRecentes: vagasRecentes.length,
    }
  },
}
