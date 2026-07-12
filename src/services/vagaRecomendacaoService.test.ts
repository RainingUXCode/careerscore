import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modalidade, NomeArea, TipoCompetencia } from '../types/enums'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'
import { jobAggregatorService } from './jobAggregatorService'
import { construirBuscasObjetivo, construirFiltrosBusca, montarTermosBuscaObjetivo, vagaRecomendacaoService } from './vagaRecomendacaoService'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('construirFiltrosBusca', () => {
  it('preserva filtros do cadastro principal para a busca real de vagas', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        cidade: 'São Paulo',
        estado: 'SP',
        modalidadesPreferidas: [Modalidade.REMOTO],
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [{
            id: 'obj-1',
            cargoOuArea: 'Estágio em Front-end',
            nivelAlvo: 'Estágio',
            tiposContratoAceitos: ['Estágio', 'CLT'],
            modalidadesAceitas: [Modalidade.REMOTO],
          }],
        },
        competencias: [
          { idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA },
          { idCompetencia: 'comp-2', nome: 'Figma', tipo: TipoCompetencia.TECNICA },
        ],
      }),
    )

    expect(filtros).toMatchObject({
      areaId: 'tecnologia',
      cargo: 'Estágio em Front-end',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil',
      modalidade: Modalidade.REMOTO,
    })
  })

  it('usa o objetivo definido na query e nao substitui pelo cargo anterior', () => {
    const candidato = criarCandidatoBase({
      cidade: 'Recife',
      estado: 'PE',
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [{
          id: 'obj-1',
          cargoOuArea: 'Assistente de RH',
          nivelAlvo: 'Assistente',
          tiposContratoAceitos: ['CLT'],
          modalidadesAceitas: [Modalidade.PRESENCIAL],
        }],
      },
      competencias: [{ idCompetencia: 'comp-1', nome: 'Excel', tipo: TipoCompetencia.TECNICA }],
      experiencias: [
        {
          idExperiencia: 'exp-1',
          empresa: 'Loja',
          cargo: 'Atendente',
          descricao: '',
          dataInicio: '2024-01',
          empregoAtual: true,
        },
      ],
    })

    const filtros = construirFiltrosBusca(candidato)
    expect(filtros.cargo).toBe('Assistente de RH')
    expect(filtros.cidade).toBe('Recife')
    expect(filtros.estado).toBe('PE')
    expect(filtros.modalidade).toBe(Modalidade.PRESENCIAL)
    expect(montarTermosBuscaObjetivo(candidato)).toContain('Assistente de RH')
    expect(montarTermosBuscaObjetivo(candidato)).not.toContain('Atendente')
  })

  it('usuario sem experiencia busca vagas pelo objetivo definido', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        experiencias: [],
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [{
            id: 'obj-1',
            cargoOuArea: 'Auxiliar de Logística',
            nivelAlvo: 'Auxiliar',
            tiposContratoAceitos: ['CLT'],
            modalidadesAceitas: [Modalidade.PRESENCIAL, Modalidade.HIBRIDO],
          }],
        },
      }),
    )

    expect(filtros.cargo).toBe('Auxiliar de Logística')
    expect(filtros.modalidade).toBeUndefined()
  })

  it('nao restringe modalidade quando o candidato aceita varias modalidades no objetivo', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [{
            id: 'obj-1',
            cargoOuArea: 'Analista de Marketing',
            nivelAlvo: 'Júnior',
            tiposContratoAceitos: ['CLT', 'PJ'],
            modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO],
          }],
        },
      }),
    )

    expect(filtros.modalidade).toBeUndefined()
  })

  it('busca ampla funciona sem objetivo definido', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'exploracao',
        opcoes: [],
        preferenciasExploracao: {
          interesses: ['administrativo'],
        },
      },
    })

    const buscas = construirBuscasObjetivo(candidato)

    expect(buscas.length).toBeGreaterThan(1)
    expect(buscas.every((busca) => busca.buscaAmpla)).toBe(true)
    expect(buscas[0].filtros.cargo).toBeUndefined()
    expect(buscas.map((busca) => busca.filtros.palavraChave).join(' ')).toContain('primeiro emprego')
    expect(buscas.map((busca) => busca.filtros.palavraChave).join(' ')).toContain('estágio')
  })

  it('modo definido executa buscas separadas para ate 3 objetivos na ordem informada', () => {
    const buscas = construirBuscasObjetivo(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [
            { id: '1', cargoOuArea: 'Assistente de RH', tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
            { id: '2', cargoOuArea: 'Auxiliar Administrativo', tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO] },
          ],
        },
      }),
    )

    expect(buscas).toHaveLength(2)
    expect(buscas[0].objetivoOrigem).toBe('Assistente de RH')
    expect(buscas[0].filtros.modalidade).toBe(Modalidade.PRESENCIAL)
    expect(buscas[1].filtros.modalidade).toBeUndefined()
  })

  it('mantem vagas com ressalvas para a faixa de monitoramento', async () => {
    const vagaComRessalva = criarVagaBase({
      id: 'vaga-ressalva',
      fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' },
      areaId: 'tecnologia',
      modalidade: Modalidade.REMOTO,
      modalidadeInformada: true,
      requisitosObrigatorios: [
        {
          id: 'req-1',
          nome: 'Python',
          tipo: 'competencia_tecnica',
          obrigatorio: true,
        },
      ],
      requisitosDesejaveis: [],
    })
    vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [vagaComRessalva],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
    })

    const resultado = await vagaRecomendacaoService.gerarRecomendacoes(
      criarCandidatoBase({
        competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
      }),
    )

    expect(resultado.recomendacoes).toHaveLength(1)
    expect(resultado.recomendacoes[0].compatibilidade.compatibilidadeGeral).toBeGreaterThanOrEqual(55)
    expect(resultado.recomendacoes[0].compatibilidade.compatibilidadeGeral).toBeLessThan(70)
  })

  it('confianca fica menor em recomendacao ampla sem reduzir compatibilidade', async () => {
    const vaga = criarVagaBase({
      id: 'vaga-ampla',
      fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' },
      titulo: 'Assistente Administrativo',
      cargoNormalizado: 'Assistente Administrativo',
      areaId: 'administracao',
      modalidadeInformada: false,
    })
    vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [vaga],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
    })

    const resultado = await vagaRecomendacaoService.gerarRecomendacoes(
      criarCandidatoBase({
        areaInteresse: { idArea: 'area-admin', nome: NomeArea.GESTAO_NEGOCIOS },
        objetivoProfissional: {
          modo: 'exploracao',
          opcoes: [],
          preferenciasExploracao: {
            interesses: ['administrativo', 'organizar documentos'],
          },
        },
      }),
    )

    expect(resultado.recomendacoes[0].buscaAmpla).toBe(true)
    expect(resultado.recomendacoes[0].compatibilidade.compatibilidadeGeral).toBeGreaterThanOrEqual(55)
    expect(resultado.recomendacoes[0].compatibilidade.confiabilidade.resumo).toContain('Busca ampla')
  })
})
