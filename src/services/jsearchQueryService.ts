export interface ParametrosQueryJSearch {
  /** Cargo/título já resolvido pelo front-end (não deve ser repetido em `termo`). */
  cargo?: string
  /** Termo complementar (ex: indicador de nível "estágio"/"jovem aprendiz") — nunca repete cargo/área. */
  termo?: string
  /** Nome da área, já resolvido a partir do areaId — entra na query uma única vez. */
  areaNome?: string
}

/**
 * Monta a query de busca externa (JSearch) a partir de partes estruturadas.
 * Única função responsável por montar esse texto — o front-end (vagaRecomendacaoService)
 * só monta filtros estruturados (cargo, areaId, termo), nunca a query final.
 *
 * Não embute a cidade no texto livre da busca: um nome de cidade de porte
 * médio dentro da query ("... em João Pessoa") tende a restringir demais os
 * resultados de fontes agregadas como a JSearch — inclusive derrubando vagas
 * remotas que nunca mencionam a cidade do candidato. A narrowing geográfica
 * continua acontecendo por `country=br` (amplo) e pelo filtro de `estado`
 * feito depois da resposta em `api/vagas.ts` (tolerante, via `.includes()`),
 * que são mecanismos mais seguros do que embutir a cidade na busca textual.
 *
 * Deduplica palavras repetidas entre as partes como camada defensiva extra
 * (a responsabilidade de não duplicar cargo/área já é de quem monta os
 * filtros, mas isso evita queries redundantes mesmo que um chamador futuro
 * repita algo por engano).
 */
export function montarQueryJSearch({ cargo, termo, areaNome }: ParametrosQueryJSearch): string {
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

  return textoFinal.join(' ').trim() || 'vaga'
}
