import { describe, expect, it } from 'vitest'
import type { Escolaridade } from '../types/models'
import { StatusCurso } from '../types/enums'
import { inferirMaiorNivelEscolaridade, inferirTipoFormacao } from './escolaridadeService'

function esc(sobrescreve: Partial<Escolaridade>): Escolaridade {
  return {
    idEscolaridade: 'esc-1',
    instituicao: 'Instituição',
    curso: '',
    nivel: '',
    status: StatusCurso.CURSANDO,
    dataInicio: '',
    ...sobrescreve,
  }
}

describe('escolaridadeService', () => {
  it('Tecnólogo conta como Ensino Superior', () => {
    expect(inferirMaiorNivelEscolaridade([esc({ tipoFormacao: 'tecnologo', status: StatusCurso.CURSANDO })])).toBe('superior_em_andamento')
    expect(inferirMaiorNivelEscolaridade([esc({ tipoFormacao: 'tecnologo', status: StatusCurso.CONCLUIDO })])).toBe('superior_completo')
  })

  it('Bacharelado e Licenciatura contam como Ensino Superior', () => {
    expect(inferirMaiorNivelEscolaridade([esc({ tipoFormacao: 'bacharelado', status: StatusCurso.CONCLUIDO })])).toBe('superior_completo')
    expect(inferirMaiorNivelEscolaridade([esc({ tipoFormacao: 'licenciatura', status: StatusCurso.CURSANDO })])).toBe('superior_em_andamento')
  })

  it('graduação concluída + outra em andamento resulta em superior completo', () => {
    expect(inferirMaiorNivelEscolaridade([
      esc({ idEscolaridade: 'esc-1', tipoFormacao: 'bacharelado', status: StatusCurso.CONCLUIDO }),
      esc({ idEscolaridade: 'esc-2', tipoFormacao: 'tecnologo', status: StatusCurso.CURSANDO }),
    ])).toBe('superior_completo')
  })

  it('pós em andamento não apaga graduação concluída e vira maior nível', () => {
    expect(inferirMaiorNivelEscolaridade([
      esc({ idEscolaridade: 'esc-1', tipoFormacao: 'bacharelado', status: StatusCurso.CONCLUIDO }),
      esc({ idEscolaridade: 'esc-2', tipoFormacao: 'pos_graduacao', status: StatusCurso.CURSANDO }),
    ])).toBe('pos_em_andamento')
  })

  it('dados legados inferem tipo sem perda', () => {
    expect(inferirTipoFormacao(esc({ nivel: 'Tecnólogo', curso: 'ADS' }))).toBe('tecnologo')
  })
})
