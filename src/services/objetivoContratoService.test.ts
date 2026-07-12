import { describe, expect, it } from 'vitest'
import {
  contratoInferidoPorNivel,
  contratosAoAlterarNivel,
  contratosEfetivosDaOpcao,
  contratosVisiveisParaNivel,
  termoBuscaContratoInferido,
} from './objetivoContratoService'

describe('objetivoContratoService', () => {
  it.each(['Estágio', 'Aprendiz', 'Trainee'] as const)('oculta contratos para %s', (nivel) => {
    expect(contratosVisiveisParaNivel(nivel)).toBe(false)
    expect(contratoInferidoPorNivel(nivel)).toBe(nivel)
  })

  it.each(['Júnior', 'Pleno', 'Sênior'] as const)('exibe contratos para %s', (nivel) => {
    expect(contratosVisiveisParaNivel(nivel)).toBe(true)
    expect(contratoInferidoPorNivel(nivel)).toBeUndefined()
  })

  it('limpa contratos ao trocar para Estágio', () => {
    expect(contratosAoAlterarNivel('Estágio', ['CLT', 'PJ'])).toEqual([])
  })

  it('reaparece para Júnior sem restaurar contratos antigos', () => {
    expect(contratosAoAlterarNivel('Júnior', [])).toEqual([])
  })

  it('usa contrato inferido como contrato efetivo', () => {
    expect(contratosEfetivosDaOpcao({ nivelAlvo: 'Aprendiz', tiposContratoAceitos: [] })).toEqual(['Aprendiz'])
    expect(contratosEfetivosDaOpcao({ nivelAlvo: 'Trainee', tiposContratoAceitos: [] })).toEqual(['Trainee'])
  })

  it('usa termo específico na busca de vagas', () => {
    expect(termoBuscaContratoInferido('Estágio')).toBe('estágio')
    expect(termoBuscaContratoInferido('Aprendiz')).toBe('jovem aprendiz')
    expect(termoBuscaContratoInferido('Trainee')).toBe('trainee')
  })
})
