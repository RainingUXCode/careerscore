import { describe, it, expect } from 'vitest'
import { MockJobProvider } from './mockJobProvider'
import { Modalidade } from '../../types/enums'

describe('MockJobProvider — filtro de localização', () => {
  it('vaga remota permanece mesmo para candidato de outra cidade/estado', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({ cidade: 'Cidade Inexistente', estado: 'ZZ' })
    const remotas = vagas.filter((vaga) => vaga.modalidade === Modalidade.REMOTO)
    expect(remotas.length).toBeGreaterThan(0)
  })

  it('vaga presencial em outra cidade é excluída', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({ cidade: 'Cidade Inexistente', estado: 'ZZ' })
    const presenciaisForaDoFiltro = vagas.filter(
      (vaga) => vaga.modalidade === Modalidade.PRESENCIAL && vaga.localizacao.cidade !== 'Cidade Inexistente',
    )
    expect(presenciaisForaDoFiltro).toHaveLength(0)
  })

  it('vaga híbrida em outro estado é excluída', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({ estado: 'ZZ' })
    const hibridasForaDoFiltro = vagas.filter((vaga) => vaga.modalidade === Modalidade.HIBRIDO && vaga.localizacao.estado !== 'ZZ')
    expect(hibridasForaDoFiltro).toHaveLength(0)
  })

  it('vaga presencial na mesma cidade do candidato permanece', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({ cidade: 'João Pessoa', estado: 'PB' })
    const presencialLocal = vagas.find((vaga) => vaga.modalidade === Modalidade.PRESENCIAL && vaga.localizacao.cidade === 'João Pessoa')
    expect(presencialLocal).toBeDefined()
  })

  it('fallback para uma cidade sem nenhuma vaga presencial ainda retorna vagas remotas úteis', async () => {
    const provider = new MockJobProvider()
    const { vagas, sucesso } = await provider.buscar({ cidade: 'Uma Cidade Qualquer Sem Vaga Presencial', estado: 'XX' })
    expect(sucesso).toBe(true)
    expect(vagas.length).toBeGreaterThan(0)
  })

  it('nenhuma vaga mock tem link de candidatura real (só exemplos)', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({})
    const comLinkSuspeito = vagas.filter((vaga) => vaga.urlOriginal && !vaga.urlOriginal.includes('example.com'))
    expect(comLinkSuspeito).toHaveLength(0)
  })

  it('todas as vagas mock são marcadas como demonstração', async () => {
    const provider = new MockJobProvider()
    const { vagas } = await provider.buscar({})
    expect(vagas.every((vaga) => vaga.fonte.tipo === 'demonstracao')).toBe(true)
  })
})
