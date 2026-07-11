import type { Candidato } from '../types/models'
import type { ItemPadraoMercado } from '../types/vaga'
import { jobAggregatorService } from './jobAggregatorService'
import { resolverAreaDoCandidato } from './areaBridgeService'
import { normalizarTexto } from '../utils/texto'

export type { ItemPadraoMercado }

export const marketPatternService = {
  /**
   * Calcula, entre as vagas da mesma área profissional do candidato (já
   * resolvida via areaBridgeService, não mais um enum fechado de tecnologia),
   * quais requisitos aparecem com mais frequência — e se o candidato já
   * possui cada um. Funciona para qualquer área, não só tecnologia.
   */
  async calcularPadraoMercado(candidato: Candidato): Promise<ItemPadraoMercado[]> {
    const { vagas } = await jobAggregatorService.buscar({})
    const areaCandidato = resolverAreaDoCandidato(candidato)

    const vagasDaArea = areaCandidato ? vagas.filter((vaga) => vaga.areaId === areaCandidato.id) : []
    const pool = vagasDaArea.length >= 3 ? vagasDaArea : vagas
    if (pool.length === 0) return []

    const contagem = new Map<string, number>()
    pool.forEach((vaga) => {
      ;[...vaga.requisitosObrigatorios, ...vaga.requisitosDesejaveis].forEach((requisito) => {
        contagem.set(requisito.nome, (contagem.get(requisito.nome) ?? 0) + 1)
      })
    })

    const nomesCandidato = [
      ...candidato.competencias.map((c) => c.nome),
      ...candidato.certificados.map((c) => c.titulo),
      ...candidato.idiomas.map((i) => i.nome),
    ].map((nome) => normalizarTexto(nome))

    return Array.from(contagem.entries())
      .map(([competencia, ocorrencias]) => ({
        competencia,
        frequenciaPercentual: Math.round((ocorrencias / pool.length) * 100),
        candidatoPossui: nomesCandidato.some((nome) => {
          const competenciaNormalizada = normalizarTexto(competencia)
          return nome.includes(competenciaNormalizada) || competenciaNormalizada.includes(nome)
        }),
      }))
      .sort((a, b) => b.frequenciaPercentual - a.frequenciaPercentual)
      .slice(0, 10)
  },
}
