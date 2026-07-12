import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReportPage } from './ReportPage'
import { criarCandidatoBase } from '../test/fixtures'
import { NivelExperiencia } from '../types/enums'
import { analysisService } from '../services/analysisService'
import type { ResultadoProcessamento } from '../types/models'

describe('ReportPage', () => {
  it('renderiza relatorio com dados antigos que ainda possuem nivelExperiencia', () => {
    const candidato = criarCandidatoBase({ nivelExperiencia: NivelExperiencia.JUNIOR })
    const resultado: ResultadoProcessamento = {
      candidato,
      analise: analysisService.gerarAnalise(candidato),
      recomendacoes: [],
      metaVagas: {
        fontesComFalha: [],
        codigosErro: [],
        usouFallback: false,
        deCache: false,
        consultadoEm: new Date().toISOString(),
        totalVagasEncontradas: 0,
        totalVagasRecentes: 0,
        statusFonteReal: 'vazia',
      },
    }

    const html = renderToStaticMarkup(
      <ReportPage
        resultado={resultado}
        historico={[]}
        onReanalisar={vi.fn()}
        onReiniciar={vi.fn()}
        onAtualizarVagas={vi.fn()}
        onEscolherSugestao={vi.fn()}
      />,
    )

    expect(html).toContain('Sua análise de carreira')
  })
})
