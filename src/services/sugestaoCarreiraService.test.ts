import { describe, expect, it } from 'vitest'
import { TipoCompetencia } from '../types/enums'
import { criarCandidatoBase } from '../test/fixtures'
import { analysisService } from './analysisService'
import { careerAnalysisEngine } from './engine/careerAnalysisEngine'
import { gerarSugestoesCarreira, sugestaoParaObjetivo, sugestoesParaOpcoes } from './sugestaoCarreiraService'

describe('sugestoes de carreira em exploracao', () => {
  it('gera sugestoes baseadas em evidencias declaradas e sem diagnostico definitivo', () => {
    const sugestoes = gerarSugestoesCarreira(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'exploracao',
          preferenciasExploracao: {
            atividadesPreferidas: ['atender pessoas', 'organizar documentos'],
            atividadesEvitar: [],
            prefereTrabalharCom: ['pessoas', 'processos'],
            ambientesPreferidos: [],
            interesses: ['recursos humanos'],
          },
        },
        competencias: [
          { idCompetencia: 'comp-1', nome: 'Comunicação', tipo: TipoCompetencia.COMPORTAMENTAL },
          { idCompetencia: 'comp-2', nome: 'Excel', tipo: TipoCompetencia.TECNICA },
        ],
      }),
    )

    expect(sugestoes.length).toBeGreaterThanOrEqual(1)
    expect(sugestoes.length).toBeLessThanOrEqual(5)
    expect(sugestoes[0].evidencias.length).toBeGreaterThan(0)
    expect(sugestoes[0].mensagemCautelosa).toContain('pode combinar')
    expect(sugestoes[0].mensagemCautelosa).not.toContain('carreira certa')
  })

  it('permite salvar ate 3 opcoes para explorar', () => {
    const sugestoes = gerarSugestoesCarreira(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'exploracao',
          preferenciasExploracao: {
            atividadesPreferidas: ['vendas', 'atendimento', 'dados', 'design'],
            atividadesEvitar: [],
            prefereTrabalharCom: ['pessoas', 'dados', 'criatividade'],
            ambientesPreferidos: [],
            interesses: ['comercial', 'tecnologia', 'design'],
          },
        },
      }),
    )

    const opcoes = sugestoesParaOpcoes(sugestoes)

    expect(opcoes.length).toBeLessThanOrEqual(3)
    expect(opcoes.some((opcao) => opcao.principal)).toBe(true)
  })

  it('escolha posterior atualiza curriculo e plano de acao', async () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'exploracao',
        preferenciasExploracao: {
          atividadesPreferidas: ['organizar documentos'],
          atividadesEvitar: [],
          prefereTrabalharCom: ['processos'],
          ambientesPreferidos: [],
          interesses: ['administrativo'],
        },
      },
      competencias: [{ idCompetencia: 'comp-1', nome: 'Excel', tipo: TipoCompetencia.TECNICA }],
    })
    const sugestao = gerarSugestoesCarreira(candidato)[0]
    const atualizado = sugestaoParaObjetivo(candidato, sugestao)

    const curriculo = await careerAnalysisEngine.gerarCurriculoOtimizado({ candidato: atualizado })
    const analise = analysisService.gerarAnalise(atualizado)

    expect(atualizado.objetivoProfissional.modo).toBe('definido')
    expect(atualizado.competencias).toEqual(candidato.competencias)
    expect(atualizado.nome).toBe(candidato.nome)
    expect(curriculo.resumoProfissional).toContain(atualizado.objetivoProfissional.cargoDesejado)
    expect(analise.planoAcao.some((acao) => acao.titulo.includes(atualizado.objetivoProfissional.cargoDesejado))).toBe(true)
  })
})
