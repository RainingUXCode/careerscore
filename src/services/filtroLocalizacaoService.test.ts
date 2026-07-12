import { describe, it, expect } from 'vitest'
import { avaliarLocalizacaoVaga } from './filtroLocalizacaoService'
import { Modalidade } from '../types/enums'

describe('avaliarLocalizacaoVaga', () => {
  it('remoto de outro estado permanece, sem exigir cidade/estado', () => {
    const resultado = avaliarLocalizacaoVaga(
      { modalidade: Modalidade.REMOTO, modalidadeInformada: true, localizacao: { pais: 'Brasil' } },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(true)
    expect(resultado.confiancaReduzida).toBe(false)
  })

  it('híbrido de outra cidade é excluído', () => {
    const resultado = avaliarLocalizacaoVaga(
      {
        modalidade: Modalidade.HIBRIDO,
        modalidadeInformada: true,
        localizacao: { cidade: 'Campina Grande', estado: 'PB', pais: 'Brasil' },
      },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(false)
  })

  it('presencial de outra cidade é excluído', () => {
    const resultado = avaliarLocalizacaoVaga(
      {
        modalidade: Modalidade.PRESENCIAL,
        modalidadeInformada: true,
        localizacao: { cidade: 'Recife', estado: 'PE', pais: 'Brasil' },
      },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(false)
  })

  it('híbrido em João Pessoa permanece para candidato em João Pessoa/PB', () => {
    const resultado = avaliarLocalizacaoVaga(
      {
        modalidade: Modalidade.HIBRIDO,
        modalidadeInformada: true,
        localizacao: { cidade: 'João Pessoa', estado: 'PB', pais: 'Brasil' },
      },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(true)
    expect(resultado.confiancaReduzida).toBe(false)
  })

  it('não aceita automaticamente outra cidade do mesmo estado (mesmo estado não basta)', () => {
    const resultado = avaliarLocalizacaoVaga(
      {
        modalidade: Modalidade.PRESENCIAL,
        modalidadeInformada: true,
        localizacao: { cidade: 'Campina Grande', estado: 'PB', pais: 'Brasil' },
      },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(false)
  })

  it('modalidade desconhecida nunca descarta automaticamente, mas reduz confiança', () => {
    const resultado = avaliarLocalizacaoVaga(
      { modalidade: undefined, modalidadeInformada: false, localizacao: { pais: 'Brasil' } },
      { cidade: 'João Pessoa', estado: 'PB' },
    )
    expect(resultado.manter).toBe(true)
    expect(resultado.confiancaReduzida).toBe(true)
  })

  it('presencial/híbrido sem cidade/estado do candidato não descarta, mas reduz confiança', () => {
    const resultado = avaliarLocalizacaoVaga(
      {
        modalidade: Modalidade.PRESENCIAL,
        modalidadeInformada: true,
        localizacao: { cidade: 'Recife', estado: 'PE', pais: 'Brasil' },
      },
      {},
    )
    expect(resultado.manter).toBe(true)
    expect(resultado.confiancaReduzida).toBe(true)
  })
})
