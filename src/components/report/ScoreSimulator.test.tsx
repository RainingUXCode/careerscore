import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { criarCandidatoBase } from '../../test/fixtures'
import { TipoCompetencia } from '../../types/enums'
import { ScoreSimulator } from './ScoreSimulator'
import { analysisService } from '../../services/analysisService'

describe('ScoreSimulator', () => {
  it('usa o novo modelo com evidência pública em vez de idioma como pontuação universal', () => {
    const candidato = criarCandidatoBase({
      competencias: [{ idCompetencia: 'comp-1', nome: 'JavaScript', tipo: TipoCompetencia.TECNICA }],
      idiomas: [],
      curriculo: undefined,
    })
    const html = renderToStaticMarkup(
      <ScoreSimulator candidato={candidato} scoreAtual={analysisService.calcularScore(candidato)} />,
    )

    expect(html).toContain('Evidência pública de projeto')
    expect(html).not.toContain('Ingles avancado')
    expect(html).not.toContain('Inglês avançado')
  })
})
