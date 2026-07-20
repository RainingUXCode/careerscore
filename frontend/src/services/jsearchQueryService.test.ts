import { describe, it, expect } from 'vitest'
import { montarQueryJSearch } from './jsearchQueryService'

describe('montarQueryJSearch', () => {
  it('monta query curta a partir de termo + cargo', () => {
    const query = montarQueryJSearch({ termo: 'estágio', cargo: 'Desenvolvedor Front-end' })
    expect(query.toLowerCase()).toBe('estágio desenvolvedor front-end')
  })

  it('não repete o cargo quando ele também aparece no termo', () => {
    const query = montarQueryJSearch({ termo: 'estágio Desenvolvedor', cargo: 'Desenvolvedor Front-end' })
    const ocorrencias = query.toLowerCase().split(' ').filter((palavra) => palavra === 'desenvolvedor').length
    expect(ocorrencias).toBe(1)
  })

  it('não repete a área quando ela também aparece no cargo', () => {
    const query = montarQueryJSearch({ cargo: 'Analista de Marketing', areaNome: 'Marketing' })
    const ocorrencias = query.toLowerCase().split(' ').filter((palavra) => palavra === 'marketing').length
    expect(ocorrencias).toBe(1)
  })

  it('usa "vaga" como fallback quando nada é informado', () => {
    expect(montarQueryJSearch({})).toBe('vaga')
  })

  it('nunca embute a cidade no texto da query, mesmo se um chamador tentar passar esse campo', () => {
    // @ts-expect-error -- cidade não faz mais parte do contrato; garante que não voltou por engano
    const query = montarQueryJSearch({ cargo: 'Analista Contábil', cidade: 'Porto Alegre' })
    expect(query).toBe('Analista Contábil')
    expect(query).not.toContain('Porto Alegre')
    expect(query).not.toContain(' em ')
  })

  it('produz query curta e sem termos genéricos extras quando só a área é conhecida', () => {
    const query = montarQueryJSearch({ areaNome: 'Administração' })
    expect(query).toBe('Administração')
  })

  it('mantém apenas uma ocorrência de cada palavra mesmo com termo, cargo e área sobrepostos', () => {
    const query = montarQueryJSearch({
      termo: 'estágio administrativo',
      cargo: 'Assistente administrativo',
      areaNome: 'Administração',
    })
    const palavras = query.toLowerCase().split(' ')
    const unicas = new Set(palavras)
    expect(palavras.length).toBe(unicas.size)
  })
})
