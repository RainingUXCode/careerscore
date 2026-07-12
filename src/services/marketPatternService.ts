import type { Candidato } from '../types/models'
import type { VagaNormalizada, ItemPadraoMercado } from '../types/vaga'
import { resolverAreaDoCandidato } from './areaBridgeService'
import { normalizarTexto } from '../utils/texto'

export type { ItemPadraoMercado }

export const marketPatternService = {
  /**
   * Calcula, entre as vagas já buscadas para a análise atual (recebidas como
   * parâmetro — NUNCA busca de novo aqui), quais requisitos aparecem com mais
   * frequência na área do candidato, e se ele já os possui. Reaproveitar a
   * mesma lista evita uma segunda chamada real à fonte de vagas por análise.
   */
  calcularPadraoMercado(candidato: Candidato, vagas: VagaNormalizada[]): ItemPadraoMercado[] {
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
