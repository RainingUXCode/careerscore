import { describe, expect, it } from 'vitest'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'
import { classificarPublicoVaga, candidatoElegivelParaPublicoDaVaga } from './publicoVagaService'

describe('publicoVagaService', () => {
  it('detecta título explícito de exclusividade PcD', () => {
    expect(classificarPublicoVaga('Vaga exclusiva PcD - Assistente', '')).toBe('exclusiva_pcd')
  })

  it('texto genérico de diversidade não vira exclusividade PcD', () => {
    expect(classificarPublicoVaga('Analista', 'Valorizamos a diversidade e pessoas com deficiência são bem-vindas.')).toBe('afirmativa_nao_exclusiva')
  })

  it('nao e prefiro_nao_informar excluem vaga exclusiva PcD', () => {
    const vaga = criarVagaBase({ publico: 'exclusiva_pcd' })
    expect(candidatoElegivelParaPublicoDaVaga(criarCandidatoBase({ preferenciaVagasPcd: 'nao' }), vaga)).toBe(false)
    expect(candidatoElegivelParaPublicoDaVaga(criarCandidatoBase({ preferenciaVagasPcd: 'prefiro_nao_informar' }), vaga)).toBe(false)
  })

  it('sim inclui vaga exclusiva PcD e também mantém vagas gerais', () => {
    const candidato = criarCandidatoBase({ preferenciaVagasPcd: 'sim' })
    expect(candidatoElegivelParaPublicoDaVaga(candidato, criarVagaBase({ publico: 'exclusiva_pcd' }))).toBe(true)
    expect(candidatoElegivelParaPublicoDaVaga(candidato, criarVagaBase({ publico: 'geral' }))).toBe(true)
  })
})
