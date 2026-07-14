import { describe, expect, it } from 'vitest'
import { formatarSenioridadeVaga, inferirSenioridadeVaga } from './senioridadeVagaService'

describe('inferirSenioridadeVaga', () => {
  it('Frontend PL vira Pleno', () => {
    expect(inferirSenioridadeVaga('Desenvolvedor(a) Frontend PL', '').senioridadesPossiveis).toEqual(['Pleno'])
  })

  it('Fullstack Pleno vira Pleno', () => {
    expect(inferirSenioridadeVaga('Profissional Fullstack Pleno', '').senioridadesPossiveis).toEqual(['Pleno'])
  })

  it('React Jr/Pl vira faixa Júnior/Pleno', () => {
    const inferencia = inferirSenioridadeVaga('Pessoa Desenvolvedora Front-end React Jr/Pl', '')
    expect(inferencia.senioridadesPossiveis).toEqual(['Júnior', 'Pleno'])
    expect(formatarSenioridadeVaga({ senioridadeInformada: true, senioridadesPossiveis: inferencia.senioridadesPossiveis })).toBe('Júnior ou Pleno')
  })

  it('Senior Developer vira Sênior', () => {
    expect(inferirSenioridadeVaga('Senior Developer', '').senioridadesPossiveis).toEqual(['Sênior'])
  })

  it('Estágio Front-end vira Estágio', () => {
    expect(inferirSenioridadeVaga('Estágio Front-end', '').senioridadesPossiveis).toEqual(['Estágio'])
  })

  it('Intern Frontend vira Estágio', () => {
    expect(inferirSenioridadeVaga('Intern Frontend', '').senioridadesPossiveis).toEqual(['Estágio'])
  })

  it('pl não casa dentro de palavra maior', () => {
    expect(inferirSenioridadeVaga('Developer platform engineer', '').senioridadesPossiveis).toEqual([])
  })

  it('sr não casa dentro de palavra maior', () => {
    expect(inferirSenioridadeVaga('User research assistant', '').senioridadesPossiveis).toEqual([])
  })
})
