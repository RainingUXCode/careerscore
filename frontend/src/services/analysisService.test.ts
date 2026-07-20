import { describe, expect, it } from 'vitest'
import { criarCandidatoBase } from '../test/fixtures'
import { FormatoCurriculo, NivelProficiencia, NomeArea, StatusCurso, TipoCompetencia, TipoLink } from '../types/enums'
import { analysisService } from './analysisService'
import { categoriasPontuacao } from './benchmarkService'
import { calcularCompatibilidade } from './compatibilidadeService'
import { criarVagaBase } from '../test/fixtures'

describe('analysisService score v2', () => {
  it('usa cinco categorias que somam exatamente 100 e não mantém normalização de 130', () => {
    const candidato = criarCandidatoBase({
      competencias: [
        { idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA },
        { idCompetencia: 'comp-2', nome: 'TypeScript', tipo: TipoCompetencia.TECNICA },
        { idCompetencia: 'comp-3', nome: 'Comunicação', tipo: TipoCompetencia.COMPORTAMENTAL },
      ],
    })

    const analise = analysisService.gerarAnalise(candidato)
    const maximo = categoriasPontuacao.reduce((soma, categoria) => soma + categoria.maximo, 0)
    const pontos = Object.values(analise.pontuacaoDetalhes).reduce((soma, detalhe) => soma + detalhe.pontos, 0)

    expect(maximo).toBe(100)
    expect(pontos).toBe(analise.scoreEmpregabilidade)
    const detalhesLegados = analise.pontuacaoDetalhes as unknown as Record<string, unknown>
    expect(detalhesLegados.escolaridade).toBeUndefined()
    expect(detalhesLegados.idiomas).toBeUndefined()
    expect(detalhesLegados.certificados).toBeUndefined()
    expect(detalhesLegados.presencaDigital).toBeUndefined()
  })

  it('não mostra escolaridade completa como nota parcial', () => {
    const analise = analysisService.gerarAnalise(criarCandidatoBase({
      escolaridades: [{
        idEscolaridade: 'esc-1',
        instituicao: 'Universidade',
        curso: 'Sistemas',
        nivel: 'Superior',
        status: StatusCurso.CONCLUIDO,
        dataInicio: '2020',
        dataFim: '2024',
      }],
    }))

    const escolaridade = analise.checklistPerfil?.find((item) => item.id === 'escolaridade')
    expect(escolaridade?.status).toBe('atendido')
    expect(escolaridade?.explicacao).toContain('Ensino Superior completo')
    expect(escolaridade?.explicacao).not.toMatch(/\d+\/\d+/)
  })

  it('escolaridade não é categoria fixa do score global', () => {
    const base = {
      experiencias: [{
        idExperiencia: 'exp-1',
        empresa: 'Empresa',
        cargo: 'Desenvolvedor',
        descricao: 'Projeto web com React e documentação.',
        dataInicio: '2024-01',
        dataFim: '2025-01',
        empregoAtual: false,
      }],
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    }

    const semEscolaridade = analysisService.calcularScore(criarCandidatoBase({ ...base, escolaridades: [] }))
    const comEscolaridade = analysisService.calcularScore(criarCandidatoBase({
      ...base,
      escolaridades: [{
        idEscolaridade: 'esc-1',
        instituicao: 'Universidade',
        curso: 'Sistemas',
        nivel: 'Superior',
        status: StatusCurso.CONCLUIDO,
        dataInicio: '2020',
        dataFim: '2024',
      }],
    }))

    expect(semEscolaridade).toBe(comEscolaridade)
  })

  it('ausência de certificados não reduz score e certificado relevante aparece no checklist', () => {
    const camposBase = {
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    }
    const base = criarCandidatoBase(camposBase)
    const comCertificado = criarCandidatoBase({
      ...camposBase,
      certificados: [{ idCertificado: 'cert-1', titulo: 'React', instituicao: 'Escola' }],
    })

    const semCertificado = analysisService.gerarAnalise(base)
    const analiseComCertificado = analysisService.gerarAnalise(comCertificado)

    expect(analysisService.calcularScore(base)).toBe(analysisService.calcularScore(comCertificado))
    expect(semCertificado.checklistPerfil?.find((item) => item.id === 'certificados')?.status).toBe('opcional')
    expect(analiseComCertificado.checklistPerfil?.find((item) => item.id === 'certificados')?.status).toBe('atendido')
  })

  it('ausência de idiomas não reduz score automaticamente, mas idioma obrigatório afeta compatibilidade da vaga', () => {
    const camposBase = {
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
      idiomas: [],
    }
    const candidato = criarCandidatoBase(camposBase)
    const comIdioma = criarCandidatoBase({
      ...camposBase,
      idiomas: [{ idIdioma: 'idi-1', nome: 'Inglês', nivelProficiencia: NivelProficiencia.AVANCADO }],
    })
    const vaga = criarVagaBase({
      idiomasExigidos: [{ idioma: 'Inglês', nivelMinimo: 'Avançado', obrigatorio: true }],
    })

    expect(analysisService.calcularScore(candidato)).toBe(analysisService.calcularScore(comIdioma))
    expect(calcularCompatibilidade(candidato, vaga).impeditivos.some((item) => item.motivo === 'idioma_obrigatorio_ausente')).toBe(true)
  })

  it('GitHub não é exigido fora de Tecnologia e Behance/portfólio é reconhecido em Design', () => {
    const administrativo = analysisService.gerarAnalise(criarCandidatoBase({
      areaInteresse: { idArea: 'area-admin', nome: NomeArea.GESTAO_NEGOCIOS },
      links: [{ idLink: 'link-1', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/teste' }],
    }))
    const design = analysisService.gerarAnalise(criarCandidatoBase({
      areaInteresse: { idArea: 'area-design', nome: NomeArea.OUTRO, nomePersonalizado: 'Design UX' },
      links: [{ idLink: 'link-1', tipo: TipoLink.BEHANCE, url: 'https://behance.net/teste' }],
    }))

    expect(administrativo.checklistPerfil?.find((item) => item.id === 'github')?.status).toBe('nao_aplicavel')
    expect(design.checklistPerfil?.find((item) => item.id === 'portfolio')?.status).toBe('atendido')
    expect(design.pontuacaoDetalhes.projetosEntregas.evidencias.join(' ')).toContain('Design')
  })

  it('primeiro emprego com projetos e currículo ausente recebe avaliação justa sem zerar dimensão', () => {
    const candidato = criarCandidatoBase({
      experiencias: [],
      competencias: [
        { idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA },
        { idCompetencia: 'comp-2', nome: 'Comunicação', tipo: TipoCompetencia.COMPORTAMENTAL },
      ],
      escolaridades: [{
        idEscolaridade: 'esc-1',
        instituicao: 'Universidade',
        curso: 'Sistemas',
        nivel: 'Superior',
        status: StatusCurso.CURSANDO,
        dataInicio: '2025',
      }],
      links: [{ idLink: 'link-1', tipo: TipoLink.GITHUB, url: 'https://github.com/teste' }],
      curriculo: undefined,
    })

    const analise = analysisService.gerarAnalise(candidato)

    expect(analise.scoreEmpregabilidade).toBeGreaterThanOrEqual(40)
    expect(analise.pontuacaoDetalhes.curriculoApresentacao.pontos).toBeGreaterThan(0)
    expect(analise.checklistPerfil?.find((item) => item.id === 'curriculo')?.status).toBe('opcional')
  })

  it('checklist classifica itens como obrigatório, recomendado, opcional e não aplicável', () => {
    const analise = analysisService.gerarAnalise(criarCandidatoBase({
      areaInteresse: { idArea: 'area-saude', nome: NomeArea.SAUDE },
      certificados: [],
      idiomas: [],
      links: [],
    }))
    const importancias = new Set(analise.checklistPerfil?.map((item) => item.importancia))

    expect(importancias.has('obrigatorio')).toBe(true)
    expect(importancias.has('recomendado')).toBe(true)
    expect(importancias.has('opcional')).toBe(true)
    expect(importancias.has('nao_aplicavel')).toBe(true)
    expect(analise.checklistPerfil?.find((item) => item.id === 'registro_profissional')?.status).toBe('pendente')
  })

  it('dados estruturados substituem parcialmente currículo ausente e novos relatórios usam v2', () => {
    const analise = analysisService.gerarAnalise(criarCandidatoBase({
      nome: 'Pessoa Teste',
      email: 'pessoa@example.com',
      telefone: '83999999999',
      competencias: [{ idCompetencia: 'comp-1', nome: 'Excel', tipo: TipoCompetencia.TECNICA }],
      curriculo: undefined,
    }))

    expect(analise.versaoScore).toBe('v2')
    expect(analise.pontuacaoDetalhes.curriculoApresentacao.pontos).toBeGreaterThan(0)
    expect(analise.pontuacaoDetalhes.curriculoApresentacao.evidencias.join(' ')).toContain('dados estruturados')
  })

  it('currículo anexado não é binário e não zera nem cria 15 pontos automáticos', () => {
    const semCurriculo = analysisService.gerarAnalise(criarCandidatoBase({
      curriculo: undefined,
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    }))
    const comCurriculo = analysisService.gerarAnalise(criarCandidatoBase({
      curriculo: {
        idCurriculo: 'curr-1',
        nomeArquivo: 'curriculo.pdf',
        formato: FormatoCurriculo.PDF,
        dataUpload: '2026-01-01',
      },
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    }))

    expect(semCurriculo.pontuacaoDetalhes.curriculoApresentacao.pontos).toBeGreaterThan(0)
    expect(comCurriculo.pontuacaoDetalhes.curriculoApresentacao.pontos - semCurriculo.pontuacaoDetalhes.curriculoApresentacao.pontos).toBeLessThan(15)
  })
})
