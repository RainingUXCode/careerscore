import { describe, it, expect } from 'vitest'
import { normalizarVagaJSearch } from './jSearchJobNormalizer'
import type { JSearchRawJob } from '../providers/jsearch/types'

function vagaBrutaBase(sobrescreve: Partial<JSearchRawJob> = {}): JSearchRawJob {
  return {
    job_id: 'js-1',
    job_title: 'Desenvolvedor(a) Front-end',
    employer_name: 'Empresa Teste',
    job_description: 'Vaga para desenvolvedor com experiência em React e TypeScript.',
    job_city: 'São Paulo',
    job_state: 'SP',
    job_country: 'BR',
    job_apply_link: 'https://example.com/vaga/1',
    job_posted_at_datetime_utc: '2026-06-01T00:00:00Z',
    ...sobrescreve,
  }
}

describe('normalizarVagaJSearch', () => {
  it('normaliza uma vaga completa com fonte marcada como real', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase())
    expect(vaga.fonte.tipo).toBe('real')
    expect(vaga.fonte.id).toBe('jsearch')
    expect(vaga.titulo).toBe('Desenvolvedor(a) Front-end')
    expect(vaga.empresa).toBe('Empresa Teste')
    expect(vaga.status).toBe('aberta')
  })

  it('vaga sem salário: campo salario fica undefined, não zero ou inventado', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_min_salary: null, job_max_salary: null }))
    expect(vaga.salario).toBeUndefined()
  })

  it('vaga com salário estimado marca a condição explicitamente', () => {
    const vaga = normalizarVagaJSearch(
      vagaBrutaBase({ job_min_salary: 3000, job_max_salary: 5000, job_salary_is_predicted: true }),
    )
    expect(vaga.salario?.estimado).toBe(true)
  })

  it('vaga sem job_is_remote definido: modalidade não é informada (nunca assume presencial)', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_is_remote: undefined }))
    expect(vaga.modalidadeInformada).toBe(false)
    expect(vaga.modalidade).toBeUndefined()
  })

  it('vaga com job_is_remote=false também não assume modalidade (pode ser híbrida)', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_is_remote: false }))
    expect(vaga.modalidadeInformada).toBe(false)
  })

  it('vaga com job_is_remote=true marca modalidade remota com confiança', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_is_remote: true }))
    expect(vaga.modalidadeInformada).toBe(true)
    expect(vaga.modalidade).toBe('Remoto')
  })

  it('infere senioridade explícita do título da JSearch', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_title: 'Senior Software Engineer' }))
    expect(vaga.senioridadeInformada).toBe(true)
    expect(vaga.senioridade).toBe('Sênior')
  })

  it('infere faixa múltipla do título da JSearch', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_title: 'Pessoa Desenvolvedora Front-end React Jr/Pl' }))
    expect(vaga.senioridadeInformada).toBe(true)
    expect(vaga.senioridadesPossiveis).toEqual(['Júnior', 'Pleno'])
  })

  it('sem senioridade no título ou descrição permanece não informada', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_title: 'Pessoa Desenvolvedora Front-end', job_description: 'Vaga para React.' }))
    expect(vaga.senioridadeInformada).toBe(false)
    expect(vaga.senioridade).toBeUndefined()
  })

  it('vaga com data de expiração futura permanece aberta', () => {
    const dataFutura = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_offer_expiration_datetime_utc: dataFutura }))
    expect(vaga.status).toBe('aberta')
    expect(vaga.dataExpiracao).toBeDefined()
  })

  it('vaga com data de expiração passada é marcada como encerrada', () => {
    const dataPassada = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_offer_expiration_datetime_utc: dataPassada }))
    expect(vaga.status).toBe('encerrada')
  })

  it('vaga sem data de expiração não inventa uma data', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_offer_expiration_datetime_utc: undefined }))
    expect(vaga.dataExpiracao).toBeUndefined()
    expect(vaga.status).toBe('aberta')
  })

  it('URL ausente fica undefined, nunca um link inventado', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_apply_link: undefined }))
    expect(vaga.urlOriginal).toBeUndefined()
  })

  it('requisitos estruturados (job_required_skills) são marcados como obrigatórios e não inferidos', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_required_skills: ['React', 'TypeScript'] }))
    expect(vaga.requisitosObrigatorios.length).toBeGreaterThan(0)
    expect(vaga.requisitosObrigatorios.every((r) => !r.inferido)).toBe(true)
  })

  it('sem job_required_skills, extrai da descrição de forma conservadora e marca como inferido', () => {
    const vaga = normalizarVagaJSearch(
      vagaBrutaBase({
        job_required_skills: undefined,
        job_description: 'Buscamos profissional com experiência em React e Git.',
      }),
    )
    const todos = [...vaga.requisitosObrigatorios, ...vaga.requisitosDesejaveis]
    expect(todos.length).toBeGreaterThan(0)
    expect(todos.every((r) => r.inferido && !r.obrigatorio)).toBe(true)
  })

  it('formação estruturada é mapeada a partir de job_required_education', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_required_education: { bachelors_degree: true } }))
    expect(vaga.formacaoRequerida).toContain('Graduação')
  })

  it('sem job_required_education, formacaoRequerida fica undefined (não inventa)', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_required_education: undefined }))
    expect(vaga.formacaoRequerida).toBeUndefined()
  })

  it('idiomas exigidos ficam sempre vazios nesta fonte (extração não implementada, por segurança)', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase())
    expect(vaga.idiomasExigidos).toEqual([])
  })

  it('confiabilidade dos dados é calculada e nunca omitida', () => {
    const vaga = normalizarVagaJSearch(vagaBrutaBase({ job_city: null, job_state: null }))
    expect(vaga.confiabilidadeDados).toBeDefined()
    expect(['alta', 'media', 'baixa']).toContain(vaga.confiabilidadeDados.nivel)
  })
})
