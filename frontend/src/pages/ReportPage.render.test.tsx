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

function criarRecomendacaoComCompatibilidade(id: string, compatibilidadeGeral: number): VagaRecomendada {
  return {
    vaga: criarVagaBase({
      id,
      titulo: `Vaga ${id}`,
      senioridadeInformada: false,
      senioridade: undefined,
    }),
    compatibilidade: {
      vagaId: id,
      compatibilidadeGeral,
      dimensoes: [
        {
          chave: 'senioridade',
          nome: 'Senioridade',
          pesoOriginal: 10,
          pesoAplicado: 10,
          avaliada: false,
          confianca: 0,
          justificativa: 'A empresa não informou a senioridade. Confirme antes de se candidatar.',
          evidencias: [],
          requisitosAtendidos: [],
          requisitosParciais: [],
          requisitosAusentes: [],
          acoesRecomendadas: [],
        },
      ],
      confiabilidade: {
        percentual: 45,
        dimensoesAvaliadas: 1,
        totalDimensoes: 3,
        dimensoesSemDados: ['Senioridade'],
        resumo: 'Poucos dados fornecidos pela empresa.',
      },
      competenciasTransferiveis: [],
      experienciasAnteriores: [],
      impeditivos: [],
      recomendacaoCandidatura: compatibilidadeGeral >= 40 ? 'avaliar_com_cuidado' : 'nao_recomendada',
      motivosRecomendacao: ['aderência baixa aos requisitos identificados'],
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

  it('mostra cinco vagas em faixas inferiores sem sugerir zero resultados nas faixas superiores', () => {
    const candidato = criarCandidatoBase({
      nivelExperiencia: NivelExperiencia.JUNIOR,
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [{
          id: 'obj-1',
          cargoOuArea: 'Desenvolvedor Front-end',
          nivelAlvo: 'Estágio',
          tiposContratoAceitos: [],
          modalidadesAceitas: [],
        }],
      },
    })
    const recomendacoes = [
      criarRecomendacaoComCompatibilidade('entrada-1', 58),
      criarRecomendacaoComCompatibilidade('entrada-2', 52),
      criarRecomendacaoComCompatibilidade('entrada-3', 41),
      criarRecomendacaoComCompatibilidade('preparo-1', 38),
      criarRecomendacaoComCompatibilidade('preparo-2', 28),
    ]
    const resultado: ResultadoProcessamento = {
      candidato,
      analise: analysisService.gerarAnalise(candidato),
      recomendacoes,
      metaVagas: {
        fontesComFalha: [],
        codigosErro: [],
        usouFallback: false,
        deCache: false,
        consultadoEm: new Date().toISOString(),
        totalVagasRetornadas: 5,
        totalVagasEncontradas: 5,
        totalVagasRecentes: 5,
        totalVagasElegiveis: 5,
        distribuicaoFaixas: {
          alta80: 0,
          media60a79: 0,
          entrada40a59: 3,
          preparacaoAbaixo40: 2,
        },
        statusFonteReal: 'com_vagas',
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

    expect(html).toContain('5 vagas recomendadas')
    expect(html).toContain('Encontramos 5 oportunidades, mas nenhuma atingiu alta aderência')
    expect(html).toContain('Objetivo: Estágio em Desenvolvedor Front-end')
    expect(html).toContain('Nível atual inferido:')
    expect(html).toContain('80%+: 0')
    expect(html).toContain('60-79%: 0')
    expect(html).toContain('40-59%: 3')
    expect(html).toContain('abaixo de 40%: 2')
    expect(html).not.toContain('Nenhuma vaga nesta faixa ainda')
    expect(html).toContain('Pode ser uma porta de entrada')
    expect(html).toContain('Ainda exige preparação')
  })
})
