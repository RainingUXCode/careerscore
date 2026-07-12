import { describe, expect, it } from 'vitest'
import { calcularCompatibilidade } from '../compatibilidadeService'
import { criarCandidatoBase, criarVagaBase } from '../../test/fixtures'
import { Modalidade, NomeArea } from '../../types/enums'

describe('objetivo profissional na compatibilidade', () => {
  it('cargo desejado orienta cargo e senioridade alvo', () => {
    const resultado = calcularCompatibilidade(
      criarCandidatoBase({
        cidade: 'Recife',
        estado: 'PE',
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [{
            id: 'obj-1',
            cargoOuArea: 'Assistente de RH',
            nivelAlvo: 'Assistente',
            tiposContratoAceitos: ['CLT', 'PJ'],
            modalidadesAceitas: [Modalidade.HIBRIDO],
          }],
          preferenciasExploracao: { interesses: [] },
        },
      }),
      criarVagaBase({
        titulo: 'Assistente de RH',
        cargoNormalizado: 'Assistente de RH',
        senioridadeInformada: true,
        senioridade: 'Assistente',
        tipoContrato: 'CLT',
        modalidade: Modalidade.HIBRIDO,
        modalidadeInformada: true,
        localizacao: { cidade: 'Recife', estado: 'PE', pais: 'Brasil' },
        descricao: 'Vaga com rotinas de Excel e atendimento interno.',
      }),
    )

    expect(resultado.dimensoes.find((d) => d.chave === 'cargo')?.nota).toBe(10)
    expect(resultado.dimensoes.find((d) => d.chave === 'senioridade')?.nota).toBe(10)
    expect(resultado.dimensoes.find((d) => d.chave === 'tipo_contrato')?.nota).toBe(10)
    expect(resultado.dimensoes.find((d) => d.chave === 'modalidade')?.nota).toBe(10)
    expect(resultado.dimensoes.some((d) => d.chave === 'conhecimentos_prioritarios')).toBe(false)
  })

  it('transicao de carreira usa area alvo do cargo desejado', () => {
    const resultado = calcularCompatibilidade(
      criarCandidatoBase({
        areaInteresse: { idArea: 'area-1', nome: NomeArea.TECNOLOGIA_DADOS },
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [{
            id: 'obj-1',
            cargoOuArea: 'Assistente de RH',
            nivelAlvo: 'Assistente',
            tiposContratoAceitos: ['CLT'],
            modalidadesAceitas: [Modalidade.PRESENCIAL],
          }],
          preferenciasExploracao: { interesses: [] },
        },
      }),
      criarVagaBase({ areaId: 'recursos-humanos' }),
    )

    expect(resultado.dimensoes.find((d) => d.chave === 'area')?.nota).toBe(10)
  })
})
