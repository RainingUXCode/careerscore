import { describe, expect, it } from 'vitest'
import { NomeArea, StatusCurso, TipoLink } from '../types/enums'
import { criarCandidatoBase } from '../test/fixtures'
import { inferirNivelAtual, senioridadeAtualInferida } from './nivelAtualService'

describe('nivelAtualService', () => {
  it('infere inicio de carreira para usuario sem experiencia e com formacao em andamento', () => {
    const candidato = criarCandidatoBase({
      experiencias: [],
      escolaridades: [{
        idEscolaridade: 'esc-1',
        instituicao: 'Universidade',
        curso: 'Sistemas de Informação',
        nivel: 'Superior',
        status: StatusCurso.CURSANDO,
        dataInicio: '2024-01',
      }],
    })

    expect(inferirNivelAtual(candidato)).toBe('estagiario')
  })

  it('infere estagiario quando existe experiencia anterior de estagio', () => {
    const candidato = criarCandidatoBase({
      experiencias: [{
        idExperiencia: 'exp-1',
        empresa: 'Empresa',
        cargo: 'Estágio em Dados',
        descricao: 'Apoio em relatórios e SQL.',
        dataInicio: '2025-01',
        dataFim: '2025-06',
        empregoAtual: false,
      }],
    })

    expect(inferirNivelAtual(candidato)).toBe('estagiario')
    expect(senioridadeAtualInferida(candidato)).toBe('Estágio')
  })

  it('na transicao de carreira nao herda senioridade alta da area anterior', () => {
    const candidato = criarCandidatoBase({
      areaInteresse: { idArea: 'area-tech', nome: NomeArea.TECNOLOGIA_DADOS },
      experiencias: [{
        idExperiencia: 'exp-1',
        empresa: 'Clínica',
        cargo: 'Fisioterapeuta sênior',
        descricao: 'Atendimento a pacientes e organização de agenda clínica.',
        dataInicio: '2016-01',
        dataFim: '2025-01',
        empregoAtual: false,
      }],
    })

    expect(inferirNivelAtual(candidato)).toBe('junior')
  })

  it('usa projeto ou portfolio como sinal de primeiro emprego sem experiencia formal', () => {
    const candidato = criarCandidatoBase({
      experiencias: [],
      links: [{ idLink: 'link-1', tipo: TipoLink.GITHUB, url: 'https://github.com/pessoa' }],
    })

    expect(inferirNivelAtual(candidato)).toBe('primeiro_emprego')
  })
})
