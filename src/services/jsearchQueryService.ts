export interface ParametrosQueryJSearch {
  /** Cargo/título já resolvido pelo front-end (não deve ser repetido em `termo`). */
  cargo?: string
  /** Termo complementar (ex: indicador de nível "estágio"/"jovem aprendiz") — nunca repete cargo/área. */
  termo?: string
  /** Nome da área, já resolvido a partir do areaId — entra na query uma única vez. */
  areaNome?: string
  cidade?: string
}

/**
 * Monta a query de busca externa (JSearch) a partir de partes estruturadas.
 * Única função responsável por montar esse texto — o front-end (vagaRecomendacaoService)
 * só monta filtros estruturados (cargo, areaId, termo), nunca a query final.
 *
 * Deduplica palavras repetidas entre as partes como camada defensiva extra
 * (a responsabilidade de não duplicar cargo/área já é de quem monta os
 * filtros, mas isso evita queries redundantes mesmo que um chamador futuro
 * repita algo por engano).
 */
export function montarQueryJSearch({ cargo, termo, areaNome, cidade }: ParametrosQueryJSearch): string {
  const partes = [termo, cargo, areaNome].filter((parte): parte is string => Boolean(parte && parte.trim()))

  const palavrasVistas = new Set<string>()
  const textoFinal: string[] = []
  for (const parte of partes) {
    const palavrasNovas = parte
      .trim()
      .split(/\s+/)
      .filter((palavra) => {
        const chave = palavra.toLowerCase()
        if (palavrasVistas.has(chave)) return false
        palavrasVistas.add(chave)
        return true
      })
    if (palavrasNovas.length > 0) textoFinal.push(palavrasNovas.join(' '))
  }

  const base = textoFinal.join(' ').trim() || 'vaga'
  return cidade ? `${base} em ${cidade}` : base
}
