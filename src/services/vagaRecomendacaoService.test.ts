import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modalidade, NomeArea, TipoCompetencia } from '../types/enums'
import { criarCandidatoBase, criarVagaBase } from '../test/fixtures'
import { jobAggregatorService } from './jobAggregatorService'
import { construirBuscaObjetivo, construirFiltrosBusca, vagaRecomendacaoService } from './vagaRecomendacaoService'

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
          opcoes: [
            {
              id: 'obj-1',
              cargoOuArea: 'Estágio em Front-end',
              nivelAlvo: 'Estágio',
              tiposContratoAceitos: ['Estágio', 'CLT'],
              modalidadesAceitas: [Modalidade.REMOTO],
            },
          ],
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
    // palavraChave só carrega o indicador de nível — nunca repete cargo, área ou competência
    expect(filtros.palavraChave).toBe('estágio')
    expect(filtros.palavraChave).not.toContain('React')
    expect(filtros.palavraChave).not.toContain('Figma')
  })

  it('usa apenas o objetivo principal (primeira opção) e não o cargo anterior', () => {
    const candidato = criarCandidatoBase({
      cidade: 'Recife',
      estado: 'PE',
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [
          {
            id: 'obj-1',
            cargoOuArea: 'Assistente de RH',
            nivelAlvo: 'Assistente',
            tiposContratoAceitos: ['CLT'],
            modalidadesAceitas: [Modalidade.PRESENCIAL],
          },
        ],
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
    expect(filtros.cargo).not.toBe('Atendente')
    expect(filtros.cidade).toBe('Recife')
    expect(filtros.estado).toBe('PE')
    expect(filtros.modalidade).toBe(Modalidade.PRESENCIAL)
  })

  it('não inclui a primeira competência técnica na query (não deve restringir a busca)', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [
            {
              id: 'obj-1',
              cargoOuArea: 'Desenvolvedor Front-end',
              tiposContratoAceitos: ['CLT'],
              modalidadesAceitas: [Modalidade.REMOTO],
            },
          ],
        },
        competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
      }),
    )
    expect(filtros.palavraChave ?? '').not.toContain('React')
  })

  it('usuario sem experiencia busca vagas pelo objetivo definido', () => {
    const filtros = construirFiltrosBusca(
      criarCandidatoBase({
        experiencias: [],
        objetivoProfissional: {
          modo: 'definido',
          opcoes: [
            {
              id: 'obj-1',
              cargoOuArea: 'Auxiliar de Logística',
              nivelAlvo: 'Auxiliar',
              tiposContratoAceitos: ['CLT'],
              modalidadesAceitas: [Modalidade.PRESENCIAL, Modalidade.HIBRIDO],
            },
          ],
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
          opcoes: [
            {
              id: 'obj-1',
              cargoOuArea: 'Analista de Marketing',
              nivelAlvo: 'Júnior',
              tiposContratoAceitos: ['CLT', 'PJ'],
              modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO],
            },
          ],
        },
      }),
    )

    expect(filtros.modalidade).toBeUndefined()
  })

  it('modo exploração monta uma única busca ampla com o termo padrão de primeiro emprego', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'exploracao',
        opcoes: [],
        preferenciasExploracao: { interesses: ['administrativo'] },
      },
    })

    const busca = construirBuscaObjetivo(candidato)

    expect(busca.buscaAmpla).toBe(true)
    expect(busca.filtros.cargo).toBeUndefined()
    expect(busca.filtros.palavraChave).toBe('primeiro emprego assistente auxiliar estágio')
  })

  it('modo definido com múltiplas opções usa só a primeira — as demais ficam salvas para uso futuro', () => {
    const opcoes = [
      { id: '1', cargoOuArea: 'Assistente de RH', tiposContratoAceitos: ['CLT' as const], modalidadesAceitas: [Modalidade.PRESENCIAL] },
      { id: '2', cargoOuArea: 'Auxiliar Administrativo', tiposContratoAceitos: ['CLT' as const], modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO] },
    ]
    const candidato = criarCandidatoBase({ objetivoProfissional: { modo: 'definido', opcoes } })

    const busca = construirBuscaObjetivo(candidato)

    expect(busca.objetivoOrigem).toBe('Assistente de RH')
    expect(busca.filtros.modalidade).toBe(Modalidade.PRESENCIAL)
    // as opções alternativas continuam intactas no candidato — só não alimentam a busca automática
    expect(candidato.objetivoProfissional.opcoes).toHaveLength(2)
    expect(candidato.objetivoProfissional.opcoes[1].cargoOuArea).toBe('Auxiliar Administrativo')
  })

  it('faz exatamente uma chamada ao agregador por análise', async () => {
    const espiao = vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
      statusFonteReal: 'com_vagas',
    })

    await vagaRecomendacaoService.gerarRecomendacoes(criarCandidatoBase())

    expect(espiao).toHaveBeenCalledTimes(1)
  })

  it('atualizar vagas (forcarAtualizacao) também faz apenas uma chamada', async () => {
    const espiao = vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
      statusFonteReal: 'com_vagas',
    })

    await vagaRecomendacaoService.gerarRecomendacoes(criarCandidatoBase(), { forcarAtualizacao: true })

    expect(espiao).toHaveBeenCalledTimes(1)
    expect(espiao).toHaveBeenCalledWith(expect.anything(), { forcarAtualizacao: true })
  })

  it('preserva vaga com compatibilidade abaixo de 55% quando não há impeditivo real', async () => {
    const vagaCompatibilidadeBaixa = criarVagaBase({
      id: 'vaga-baixa',
      fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' },
      areaId: 'tecnologia',
    })
    vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [vagaCompatibilidadeBaixa],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
      statusFonteReal: 'com_vagas',
    })

    const resultado = await vagaRecomendacaoService.gerarRecomendacoes(criarCandidatoBase({ competencias: [] }))

    expect(resultado.recomendacoes).toHaveLength(1)
  })

  it('exclui vaga com impeditivo real (localização presencial incompatível)', async () => {
    const vagaImpeditivo = criarVagaBase({
      id: 'vaga-impeditivo',
      fonte: { id: 'jsearch', nome: 'JSearch', tipo: 'real' },
      modalidade: Modalidade.PRESENCIAL,
      modalidadeInformada: true,
      localizacao: { cidade: 'Manaus', estado: 'AM', pais: 'Brasil' },
    })
    vi.spyOn(jobAggregatorService, 'buscar').mockResolvedValue({
      vagas: [vagaImpeditivo],
      fontesComFalha: [],
      codigosErro: [],
      usouFallback: false,
      deCache: false,
      consultadoEm: '2026-07-11T12:00:00.000Z',
      statusFonteReal: 'com_vagas',
    })

    const resultado = await vagaRecomendacaoService.gerarRecomendacoes(
      criarCandidatoBase({ cidade: 'João Pessoa', estado: 'PB' }),
    )

    expect(resultado.recomendacoes).toHaveLength(0)
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
      statusFonteReal: 'com_vagas',
    })

    const resultado = await vagaRecomendacaoService.gerarRecomendacoes(
      criarCandidatoBase({
        areaInteresse: { idArea: 'area-admin', nome: NomeArea.GESTAO_NEGOCIOS },
        objetivoProfissional: {
          modo: 'exploracao',
          opcoes: [],
          preferenciasExploracao: { interesses: ['administrativo', 'organizar documentos'] },
        },
      }),
    )

    expect(resultado.recomendacoes[0].buscaAmpla).toBe(true)
    expect(resultado.recomendacoes[0].compatibilidade.confiabilidade.resumo).toContain('Busca ampla')
  })
})
