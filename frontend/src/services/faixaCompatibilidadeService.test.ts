import { describe, it, expect } from 'vitest'
import { classificarFaixa, faixasCompatibilidade } from './faixaCompatibilidadeService'

describe('classificarFaixa', () => {
  it('classifica 40% na faixa "pode ser uma porta de entrada"', () => {
    expect(classificarFaixa(40)).toBe('entrada')
  })

  it('classifica valores abaixo de 40% na quarta faixa ("ainda exige preparação")', () => {
    expect(classificarFaixa(39)).toBe('preparo')
    expect(classificarFaixa(0)).toBe('preparo')
  })

  it('classifica 80% ou mais como "boa oportunidade agora"', () => {
    expect(classificarFaixa(80)).toBe('agora')
    expect(classificarFaixa(100)).toBe('agora')
  })

  it('classifica a faixa intermediária "vale a pena tentar" entre 60 e 79', () => {
    expect(classificarFaixa(60)).toBe('tentar')
    expect(classificarFaixa(79)).toBe('tentar')
  })

  it('existem exatamente quatro faixas, cobrindo 0-100% sem lacuna nem sobreposição', () => {
    expect(faixasCompatibilidade).toHaveLength(4)
    for (let percentual = 0; percentual <= 100; percentual += 1) {
      expect(classificarFaixa(percentual)).toBeDefined()
    }
  })

  it('faixa "agora" nunca usa linguagem de "candidatar agora" no título de demonstração', () => {
    const faixaAgora = faixasCompatibilidade.find((f) => f.chave === 'agora')!
    expect(faixaAgora.tituloDemo.toLowerCase()).not.toContain('candidatar agora')
    expect(faixaAgora.descricaoDemo.toLowerCase()).toContain('não são oportunidades')
  })
})
