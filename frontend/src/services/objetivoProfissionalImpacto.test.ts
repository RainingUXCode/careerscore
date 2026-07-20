import { describe, expect, it } from 'vitest'
import { Modalidade, TipoCompetencia, TipoLink } from '../types/enums'
import { criarCandidatoBase } from '../test/fixtures'
import { analysisService } from './analysisService'
import { careerAnalysisEngine } from './engine/careerAnalysisEngine'

const candidatoComObjetivo = criarCandidatoBase({
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
  competencias: [
    { idCompetencia: 'comp-1', nome: 'Excel', tipo: TipoCompetencia.TECNICA },
    { idCompetencia: 'comp-2', nome: 'Comunicação', tipo: TipoCompetencia.COMPORTAMENTAL },
  ],
})

describe('impacto do objetivo profissional', () => {
  it('curriculo ATS usa objetivo profissional', async () => {
    const curriculo = await careerAnalysisEngine.gerarCurriculoOtimizado({ candidato: candidatoComObjetivo })

    expect(curriculo.resumoProfissional).toContain('Assistente de RH')
    expect(curriculo.habilidadesTecnicas[0]).toBe('Excel')
  })

  it('plano de acao usa objetivo profissional', () => {
    const analise = analysisService.gerarAnalise(candidatoComObjetivo)

    expect(analise.planoAcao.some((acao) => acao.titulo.includes('Assistente de RH'))).toBe(true)
    expect(analise.planoAcao.some((acao) => acao.descricao.includes('competências já cadastradas'))).toBe(true)
  })

  it('curriculo ATS nao duplica links saneados', async () => {
    const curriculo = await careerAnalysisEngine.gerarCurriculoOtimizado({
      candidato: criarCandidatoBase({
        links: [
          { idLink: '1', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/pessoa' },
          { idLink: '2', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/pessoa/' },
          { idLink: '3', tipo: TipoLink.GITHUB, url: 'https://github.com/pessoa' },
        ],
      }),
    })

    expect(curriculo.links).toHaveLength(2)
    expect(curriculo.links.map((link) => link.tipo)).toEqual([TipoLink.LINKEDIN, TipoLink.GITHUB])
  })
})
