import { describe, expect, it } from 'vitest'
import { Modalidade } from '../types/enums'
import { ajustarModalidadePreferida } from './modalidadePreferenciaService'

describe('modalidadePreferenciaService', () => {
  it('apenas modalidades selecionadas podem virar preferida', () => {
    expect(ajustarModalidadePreferida([Modalidade.REMOTO, Modalidade.HIBRIDO], Modalidade.PRESENCIAL)).toBeUndefined()
  })

  it('uma única modalidade é definida automaticamente como preferida', () => {
    expect(ajustarModalidadePreferida([Modalidade.REMOTO], undefined)).toBe(Modalidade.REMOTO)
  })

  it('remover a modalidade preferida limpa a preferência quando sobram várias', () => {
    expect(ajustarModalidadePreferida([Modalidade.HIBRIDO, Modalidade.PRESENCIAL], Modalidade.REMOTO)).toBeUndefined()
  })
})
