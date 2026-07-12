import { describe, expect, it } from 'vitest'
import { criarCandidatoBase } from '../test/fixtures'
import { FormatoCurriculo, NivelExperiencia, NivelProficiencia, StatusCurso, TipoCompetencia, TipoLink } from '../types/enums'
import { analysisService } from './analysisService'

describe('analysisService', () => {
  it('normaliza a soma bruta para a escala 0-100 em vez de apenas cortar acima de 100', () => {
    const candidato = criarCandidatoBase({
      nivelExperiencia: NivelExperiencia.ESTAGIARIO,
      experiencias: Array.from({ length: 5 }, (_, indice) => ({
        idExperiencia: `exp-${indice}`,
        empresa: 'Empresa Teste',
        cargo: 'Desenvolvedor',
        descricao: '',
        dataInicio: '2020-01',
        dataFim: '2022-01',
        empregoAtual: false,
      })),
      competencias: Array.from({ length: 10 }, (_, indice) => ({
        idCompetencia: `comp-${indice}`,
        nome: `Competencia ${indice}`,
        tipo: indice < 8 ? TipoCompetencia.TECNICA : TipoCompetencia.COMPORTAMENTAL,
      })),
      escolaridades: [
        {
          idEscolaridade: 'esc-1',
          instituicao: 'Universidade',
          curso: 'Sistemas',
          nivel: 'Superior',
          status: StatusCurso.CONCLUIDO,
          dataInicio: '2020',
          dataFim: '2024',
        },
      ],
      idiomas: [
        { idIdioma: 'idi-1', nome: 'Ingles', nivelProficiencia: NivelProficiencia.FLUENTE },
        { idIdioma: 'idi-2', nome: 'Espanhol', nivelProficiencia: NivelProficiencia.AVANCADO },
      ],
      links: [
        { idLink: 'link-1', tipo: TipoLink.GITHUB, url: 'https://github.com/teste' },
        { idLink: 'link-2', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/teste' },
        { idLink: 'link-3', tipo: TipoLink.PORTFOLIO, url: 'https://example.com' },
      ],
      certificados: [
        { idCertificado: 'cert-1', titulo: 'React', instituicao: 'Escola', nomeArquivo: 'react.pdf' },
        { idCertificado: 'cert-2', titulo: 'TypeScript', instituicao: 'Escola', nomeArquivo: 'ts.pdf' },
      ],
      curriculo: {
        idCurriculo: 'curr-1',
        nomeArquivo: 'curriculo.pdf',
        formato: FormatoCurriculo.PDF,
        dataUpload: '2026-01-01',
      },
    })

    const analise = analysisService.gerarAnalise(candidato)

    expect(Object.values(analise.pontuacaoDetalhes).reduce((soma, valor) => soma + valor, 0)).toBeGreaterThan(100)
    expect(analise.scoreEmpregabilidade).toBeLessThan(100)
  })

  it('nao trata experiencia sem data final como atual quando empregoAtual e falso', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-1',
          empresa: 'Empresa Teste',
          cargo: 'Estagio',
          descricao: '',
          dataInicio: '2020-01',
          dataFim: '',
          empregoAtual: false,
        },
      ],
    })

    const analise = analysisService.gerarAnalise(candidato)

    expect(analise.pontuacaoDetalhes.experiencia).toBe(6)
  })
})
