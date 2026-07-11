import { describe, expect, it } from 'vitest'
import { Modalidade } from '../types/enums'
import { criarCandidatoBase } from '../test/fixtures'
import { construirFiltrosBusca } from './vagaRecomendacaoService'

describe('construirFiltrosBusca', () => {
  it('preserva filtros do candidato para a busca real de vagas', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        cidade: 'Sao Paulo',
        estado: 'SP',
        modalidadesPreferidas: [Modalidade.REMOTO],
        experiencias: [
          {
            idExperiencia: 'exp-1',
            empresa: 'Empresa Teste',
            cargo: 'Desenvolvedor Front-end',
            descricao: '',
            dataInicio: '2024-01-01',
            empregoAtual: true,
          },
        ],
      }),
    )

    expect(filtros).toMatchObject({
      areaId: 'tecnologia',
      cargo: 'Desenvolvedor Front-end',
      cidade: 'Sao Paulo',
      estado: 'SP',
      pais: 'Brasil',
      modalidade: Modalidade.REMOTO,
    })
  })

  it('nao restringe modalidade quando o candidato aceita varias modalidades', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        modalidadesPreferidas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
      }),
    )

    expect(filtros.modalidade).toBeUndefined()
  })
})
