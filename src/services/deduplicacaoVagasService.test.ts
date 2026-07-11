import { describe, it, expect } from 'vitest'
import { deduplicarVagas } from './deduplicacaoVagasService'
import { normalizarVagaMock, type VagaMockBruta } from './normalizers/mockJobNormalizer'
import { JobAggregatorService } from './jobAggregatorService'
import { MockJobProvider } from './providers/mockJobProvider'
import { criarVagaBase } from '../test/fixtures'

function vagaMockBrutaBase(sobrescreve: Partial<VagaMockBruta> = {}): VagaMockBruta {
  return {
    id: 'x1',
    titulo: 'Vaga Teste',
    empresa: 'Empresa Teste',
    descricao: 'Descrição',
    areaTexto: 'Tecnologia',
    pais: 'Brasil',
    requisitosObrigatoriosTexto: [],
    statusBruto: 'aberta',
    ...sobrescreve,
  }
}

describe('20. vagas mock corretamente rotuladas como demonstração', () => {
  it('nunca reporta status "aberta" mesmo quando a fonte bruta diz que está aberta', () => {
    const vaga = normalizarVagaMock(vagaMockBrutaBase({ statusBruto: 'aberta' }))
    expect(vaga.fonte.tipo).toBe('demonstracao')
    expect(vaga.status).not.toBe('aberta')
    expect(vaga.status).toBe('demonstracao')
  })

  it('preserva o status "encerrada" quando a fonte bruta diz isso, para permitir o filtro', () => {
    const vaga = normalizarVagaMock(vagaMockBrutaBase({ statusBruto: 'encerrada' }))
    expect(vaga.status).toBe('encerrada')
  })
})

describe('21. vagas encerradas são filtradas pelo agregador', () => {
  it('o agregador nunca retorna vagas com status "encerrada"', async () => {
    const agregador = new JobAggregatorService([new MockJobProvider()])
    const { vagas } = await agregador.buscar({})
    expect(vagas.every((v) => v.status !== 'encerrada')).toBe(true)
  })
})

describe('22. deduplicação simples de vagas', () => {
  it('remove vagas duplicadas pela mesma URL original', () => {
    const vaga1 = criarVagaBase({ id: 'a', urlOriginal: 'https://example.com/vaga/123' })
    const vaga2 = criarVagaBase({ id: 'b', urlOriginal: 'https://example.com/vaga/123' })
    const resultado = deduplicarVagas([vaga1, vaga2])
    expect(resultado).toHaveLength(1)
  })

  it('mantém vagas distintas quando não há URL/empresa/título em comum', () => {
    const vaga1 = criarVagaBase({ id: 'a', urlOriginal: 'https://example.com/vaga/1', empresa: 'Empresa A' })
    const vaga2 = criarVagaBase({ id: 'b', urlOriginal: 'https://example.com/vaga/2', empresa: 'Empresa B' })
    const resultado = deduplicarVagas([vaga1, vaga2])
    expect(resultado).toHaveLength(2)
  })

  it('deduplica por assinatura (empresa+título+cidade+estado) quando não há URL/id externo', () => {
    const vaga1 = criarVagaBase({
      id: 'a',
      urlOriginal: undefined,
      idExterno: undefined,
      empresa: 'Empresa X',
      titulo: 'Analista',
      localizacao: { cidade: 'Recife', estado: 'PE', pais: 'Brasil' },
    })
    const vaga2 = criarVagaBase({
      id: 'b',
      urlOriginal: undefined,
      idExterno: undefined,
      empresa: 'empresa x',
      titulo: 'analista',
      localizacao: { cidade: 'recife', estado: 'pe', pais: 'Brasil' },
    })
    const resultado = deduplicarVagas([vaga1, vaga2])
    expect(resultado).toHaveLength(1)
  })
})
