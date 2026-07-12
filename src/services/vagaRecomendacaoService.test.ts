import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modalidade, NomeArea, TipoCompetencia } from '../types/enums'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'
import { jobAggregatorService } from './jobAggregatorService'
import { construirBuscasObjetivo, construirFiltrosBusca, montarTermosBuscaObjetivo, vagaRecomendacaoService } from './vagaRecomendacaoService'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('construirFiltrosBusca', () => {
  it('preserva filtros do candidato para a busca real de vagas', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        cidade: 'Sao Paulo',
        estado: 'SP',
        modalidadesPreferidas: [Modalidade.REMOTO],
        objetivoProfissional: {
          cargoDesejado: 'Estagio em Front-end',
          nivelAlvo: 'Estágio',
          areasSecundarias: ['Design'],
          tiposContratoAceitos: ['Estágio', 'CLT'],
          modalidadesAceitas: [Modalidade.REMOTO],
          cidadeBusca: 'Sao Paulo',
          estadoBusca: 'SP',
          paisBusca: 'Brasil',
          aceitaMudanca: false,
          conhecimentosPrioritarios: ['React', 'Figma'],
        },
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
      cargo: 'Estagio em Front-end',
      cidade: 'Sao Paulo',
      estado: 'SP',
      pais: 'Brasil',
      modalidade: Modalidade.REMOTO,
    })
  })

  it('usa cargo desejado na query e nao substitui pelo cargo anterior', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        cargoDesejado: 'Assistente de RH',
        nivelAlvo: 'Assistente',
        areasSecundarias: [],
        tiposContratoAceitos: ['CLT'],
        modalidadesAceitas: [Modalidade.PRESENCIAL],
        cidadeBusca: 'Recife',
        estadoBusca: 'PE',
        paisBusca: 'Brasil',
        aceitaMudanca: false,
        conhecimentosPrioritarios: ['recrutamento', 'Excel'],
      },
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

  it('usuario sem experiencia busca vagas pelo objetivo', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        experiencias: [],
        objetivoProfissional: {
          cargoDesejado: 'Auxiliar de Logistica',
          nivelAlvo: 'Auxiliar',
          areasSecundarias: [],
          tiposContratoAceitos: ['CLT'],
          modalidadesAceitas: [Modalidade.PRESENCIAL, Modalidade.HIBRIDO],
          cidadeBusca: '',
          estadoBusca: '',
          paisBusca: 'Brasil',
          aceitaMudanca: false,
          conhecimentosPrioritarios: [],
        },
      }),
    )

    expect(filtros.cargo).toBe('Auxiliar de Logistica')
    expect(filtros.modalidade).toBeUndefined()
  })

  it('nao restringe modalidade quando o candidato aceita varias modalidades', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        modalidadesPreferidas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
        objetivoProfissional: {
          cargoDesejado: 'Analista de Marketing',
          nivelAlvo: 'Júnior',
          areasSecundarias: [],
          tiposContratoAceitos: ['CLT', 'PJ'],
          modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO],
          cidadeBusca: '',
          estadoBusca: '',
          paisBusca: 'Brasil',
          aceitaMudanca: false,
          conhecimentosPrioritarios: [],
        },
      }),
    )

    expect(filtros.modalidade).toBeUndefined()
  })

  it('busca ampla funciona sem objetivo definido', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'exploracao',
        cargoDesejado: '',
        preferenciasExploracao: {
          atividadesPreferidas: ['atender pessoas'],
          atividadesEvitar: [],
          prefereTrabalharCom: ['pessoas'],
          ambientesPreferidos: [],
          interesses: ['administrativo'],
        },
      },
    })

    const buscas = construirBuscasObjetivo(candidato)

    expect(buscas.length).toBeGreaterThan(1)
    expect(buscas.every((busca) => busca.buscaAmpla)).toBe(true)
    expect(buscas[0].filtros.cargo).toBeUndefined()
    expect(buscas[0].filtros.palavraChave).toContain('primeiro emprego')
  })

  it('multiplas opcoes executa buscas separadas e preserva a principal', () => {
    const buscas = construirBuscasObjetivo(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'multiplas_opcoes',
          opcoes: [
            { id: '1', cargoOuArea: 'Assistente de RH', prioridade: 2, principal: true, tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
            { id: '2', cargoOuArea: 'Auxiliar Administrativo', prioridade: 1, principal: false, tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO] },
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

  it('confiança fica menor em recomendacao ampla sem reduzir compatibilidade', async () => {
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
          cargoDesejado: '',
          preferenciasExploracao: {
            atividadesPreferidas: ['organizar documentos'],
            atividadesEvitar: [],
            prefereTrabalharCom: ['processos'],
            ambientesPreferidos: [],
            interesses: ['administrativo'],
          },
        },
      }),
    )

    expect(resultado.recomendacoes[0].buscaAmpla).toBe(true)
    expect(resultado.recomendacoes[0].compatibilidade.compatibilidadeGeral).toBeGreaterThanOrEqual(55)
    expect(resultado.recomendacoes[0].compatibilidade.confiabilidade.resumo).toContain('Busca ampla')
  })
})
