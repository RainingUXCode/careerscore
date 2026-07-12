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
            interesses: ['recursos humanos', 'atendimento', 'organização'],
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

  it('transforma sugestoes em ate 3 opcoes sem campo principal ou prioridade manual', () => {
    const sugestoes = gerarSugestoesCarreira(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'exploracao',
          preferenciasExploracao: {
            interesses: ['comercial', 'tecnologia', 'design', 'atendimento'],
          },
        },
        competencias: [
          { idCompetencia: 'comp-1', nome: 'Figma', tipo: TipoCompetencia.TECNICA },
          { idCompetencia: 'comp-2', nome: 'Comunicação', tipo: TipoCompetencia.COMPORTAMENTAL },
        ],
      }),
    )

    const opcoes = sugestoesParaOpcoes(sugestoes)

    expect(opcoes.length).toBeLessThanOrEqual(3)
    expect(opcoes[0].cargoOuArea).toBeTruthy()
    expect('principal' in opcoes[0]).toBe(false)
    expect('prioridade' in opcoes[0]).toBe(false)
  })

  it('escolha posterior atualiza curriculo e plano de acao sem criar conhecimentos prioritarios', async () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'exploracao',
        preferenciasExploracao: {
          interesses: ['administrativo', 'organizar documentos'],
        },
      },
      competencias: [{ idCompetencia: 'comp-1', nome: 'Excel', tipo: TipoCompetencia.TECNICA }],
    })
    const sugestao = gerarSugestoesCarreira(candidato)[0]
    const atualizado = sugestaoParaObjetivo(candidato, sugestao)
    const cargoEscolhido = atualizado.objetivoProfissional.opcoes[0].cargoOuArea

    const curriculo = await careerAnalysisEngine.gerarCurriculoOtimizado({ candidato: atualizado })
    const analise = analysisService.gerarAnalise(atualizado)

    expect(atualizado.objetivoProfissional.modo).toBe('definido')
    expect(atualizado.competencias).toEqual(candidato.competencias)
    expect(atualizado.nome).toBe(candidato.nome)
    expect('conhecimentosPrioritarios' in atualizado.objetivoProfissional).toBe(false)
    expect(curriculo.resumoProfissional).toContain(cargoEscolhido)
    expect(analise.planoAcao.some((acao) => acao.titulo.includes(cargoEscolhido))).toBe(true)
  })
})
