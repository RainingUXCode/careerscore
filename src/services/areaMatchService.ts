import type { AreaProfissional } from '../types/area'
import { areasProfissionais } from '../data/areasProfissionais'
import { normalizarTexto } from '../utils/texto'

/** Busca a área do catálogo cujo nome/sinônimo/palavra relacionada melhor casa com o texto livre. */
export function encontrarAreaPorTexto(texto: string): AreaProfissional | undefined {
  const alvo = normalizarTexto(texto.trim())
  if (!alvo) return undefined

  // 1) correspondência exata de nome ou sinônimo
  const exata = areasProfissionais.find(
    (area) =>
      normalizarTexto(area.nome) === alvo ||
      area.sinonimos.some((sinonimo) => normalizarTexto(sinonimo) === alvo),
  )
  if (exata) return exata

  // 2) o texto contém ou é contido por um nome/sinônimo/palavra relacionada
  return areasProfissionais.find((area) => {
    const candidatos = [area.nome, ...area.sinonimos, ...(area.palavrasRelacionadas ?? [])]
    return candidatos.some((candidato) => {
      const normalizado = normalizarTexto(candidato)
      return alvo.includes(normalizado) || normalizado.includes(alvo)
    })
  })
}

/** Todas as subáreas de uma área ampla (categoriaPaiId apontando para ela). */
export function obterSubareas(areaId: string): AreaProfissional[] {
  return areasProfissionais.filter((area) => area.categoriaPaiId === areaId)
}
