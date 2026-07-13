import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReportPage } from './ReportPage'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'
import { NivelExperiencia } from '../types/enums'
import { analysisService } from '../services/analysisService'
import type { ResultadoProcessamento } from '../types/models'
import type { VagaRecomendada } from '../types/compatibilidade'

function criarRecomendacaoDemonstracao(): VagaRecomendada {
  return {
    vaga: criarVagaBase({
      id: 'mock-1',
      urlOriginal: 'https://example.test/vaga-demo',
      fonte: { id: 'mock', nome: 'Vagas de demonstração', tipo: 'demonstracao' },
    }),
    compatibilidade: {
      vagaId: 'mock-1',
      compatibilidadeGeral: 72,
      dimensoes: [],
      confiabilidade: {
        percentual: 80,
        dimensoesAvaliadas: 1,
        totalDimensoes: 1,
        dimensoesSemDados: [],
        resumo: 'Compatibilidade de teste.',
      },
      competenciasTransferiveis: [],
      experienciasAnteriores: [],
      impeditivos: [],
      recomendacaoCandidatura: 'recomendada_com_ressalvas',
      motivosRecomendacao: ['Vaga útil para validar compatibilidade.'],
    },
  }
}

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
    expect(html).toContain('Checklist do perfil')
    expect(html).toContain('Exportar PDF')
  })

  it('diferencia fonte real vazia de fonte não configurada quando mostra vagas de demonstração', () => {
    const candidato = criarCandidatoBase()
    const resultado: ResultadoProcessamento = {
      candidato,
      analise: analysisService.gerarAnalise(candidato),
      recomendacoes: [criarRecomendacaoDemonstracao()],
      metaVagas: {
        fontesComFalha: [],
        codigosErro: [],
        usouFallback: true,
        deCache: false,
        consultadoEm: new Date().toISOString(),
        totalVagasEncontradas: 1,
        totalVagasRecentes: 1,
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

    expect(html).toContain('Fonte: vagas de demonstração')
    expect(html).toContain('A fonte real respondeu, mas não encontrou vagas para esta busca')
    expect(html).toContain('a fonte real respondeu, mas não encontrou vagas para os filtros atuais')
    expect(html).not.toContain('nenhuma fonte real de vagas está conectada ainda')
    expect(html).not.toContain('Ver vaga')
    expect(html).not.toContain('Candidatar agora')
  })
})
