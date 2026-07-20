import { describe, it, expect, vi, afterEach } from 'vitest'
import { marketPatternService } from './marketPatternService'
import { jobAggregatorService } from './jobAggregatorService'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('marketPatternService.calcularPadraoMercado', () => {
  it('nunca chama o agregador — só usa as vagas recebidas por parâmetro', () => {
    const espiao = vi.spyOn(jobAggregatorService, 'buscar')
    const candidato = criarCandidatoBase()
    const vagas = [
      criarVagaBase({
        id: 'v1',
        areaId: 'tecnologia',
        requisitosObrigatorios: [{ id: 'r1', nome: 'React', tipo: 'competencia_tecnica', obrigatorio: true }],
      }),
    ]

    marketPatternService.calcularPadraoMercado(candidato, vagas)

    expect(espiao).not.toHaveBeenCalled()
  })

  it('calcula frequência a partir da lista recebida, sem rede', () => {
    const candidato = criarCandidatoBase()
    const vagas = [
      criarVagaBase({ id: 'v1', areaId: 'tecnologia', requisitosObrigatorios: [{ id: 'r1', nome: 'React', tipo: 'competencia_tecnica', obrigatorio: true }] }),
      criarVagaBase({ id: 'v2', areaId: 'tecnologia', requisitosObrigatorios: [{ id: 'r2', nome: 'React', tipo: 'competencia_tecnica', obrigatorio: true }] }),
    ]

    const padrao = marketPatternService.calcularPadraoMercado(candidato, vagas)

    expect(padrao.find((item) => item.competencia === 'React')?.frequenciaPercentual).toBe(100)
  })

  it('retorna lista vazia quando não há vagas', () => {
    expect(marketPatternService.calcularPadraoMercado(criarCandidatoBase(), [])).toEqual([])
  })
})
