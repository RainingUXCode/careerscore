import { describe, expect, it, vi, afterEach } from 'vitest'
import { Modalidade, TipoLink } from '../types/enums'
import { criarCandidatoBase } from '../test/fixtures'
import { draftService } from './draftService'
import { objetivoProfissionalPadrao } from './objetivoProfissionalService'
import { validationService } from './validationService'

function localStorageMemoria() {
  const dados = new Map<string, string>()
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => dados.set(chave, valor),
    removeItem: (chave: string) => dados.delete(chave),
  }
}

describe('objetivo profissional', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cargo desejado e campos principais sao obrigatorios', () => {
    const erros = validationService.validarObjetivoProfissional(
      criarCandidatoBase({
        objetivoProfissional: {
          ...objetivoProfissionalPadrao,
          modo: 'definido',
          cargoDesejado: '',
          modalidadesAceitas: [],
          tiposContratoAceitos: [],
          paisBusca: '',
        },
      }),
    )

    expect(erros.cargoDesejado).toBeDefined()
    expect(erros.modalidadesAceitas).toBeDefined()
    expect(erros.tiposContratoAceitos).toBeDefined()
    expect(erros.paisBusca).toBeDefined()
  })

  it('cargo desejado nao e obrigatorio no modo exploracao', () => {
    const erros = validationService.validarObjetivoProfissional(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'exploracao',
          cargoDesejado: '',
          preferenciasExploracao: {
            ...objetivoProfissionalPadrao.preferenciasExploracao,
            interesses: ['pessoas'],
          },
        },
      }),
    )

    expect(erros.cargoDesejado).toBeUndefined()
    expect(erros.preferenciasExploracao).toBeUndefined()
  })

  it('multiplas opcoes aceita ate 3 objetivos e exige principal', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'multiplas_opcoes',
        opcoes: [
          { id: '1', cargoOuArea: 'RH', prioridade: 1, principal: false, tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
          { id: '2', cargoOuArea: 'Administrativo', prioridade: 2, principal: false, tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
          { id: '3', cargoOuArea: 'Vendas', prioridade: 3, principal: false, tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
        ],
      },
    })

    const erros = validationService.validarObjetivoProfissional(candidato)
    expect(erros.opcoes).toBeUndefined()
    expect(erros.opcaoPrincipal).toBeDefined()

    const comPrincipal = validationService.validarObjetivoProfissional(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'multiplas_opcoes',
          opcoes: [{ ...candidato.objetivoProfissional.opcoes[0], principal: true }],
        },
      }),
    )
    expect(comPrincipal.opcaoPrincipal).toBeUndefined()
  })

  it('migra rascunho antigo sem objetivo sem apagar dados existentes', () => {
    const storage = localStorageMemoria()
    storage.setItem(
      'careerscore:rascunho-candidato',
      JSON.stringify({
        nome: 'Pessoa Teste',
        email: 'teste@example.com',
        telefone: '83999999999',
        cidade: 'Joao Pessoa',
        estado: 'PB',
      }),
    )
    vi.stubGlobal('window', { localStorage: storage })

    const candidato = draftService.carregar(criarCandidatoBase())

    expect(candidato.nome).toBe('Pessoa Teste')
    expect(candidato.objetivoProfissional).toMatchObject({
      modo: 'exploracao',
      cargoDesejado: '',
      paisBusca: 'Brasil',
      modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
    })
  })

  it('migra perfil com cargo preenchido para modo definido', () => {
    const storage = localStorageMemoria()
    storage.setItem(
      'careerscore:rascunho-candidato',
      JSON.stringify({
        objetivoProfissional: {
          cargoDesejado: 'Assistente de RH',
          paisBusca: 'Brasil',
        },
      }),
    )
    vi.stubGlobal('window', { localStorage: storage })

    const candidato = draftService.carregar(criarCandidatoBase())

    expect(candidato.objetivoProfissional.modo).toBe('definido')
    expect(candidato.objetivoProfissional.cargoDesejado).toBe('Assistente de RH')
  })

  it('saneia links antigos duplicados sem apagar os demais dados do rascunho', () => {
    const storage = localStorageMemoria()
    storage.setItem(
      'careerscore:rascunho-candidato',
      JSON.stringify({
        nome: 'Pessoa com Links',
        links: [
          { idLink: '1', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/pessoa' },
          { idLink: '2', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/pessoa/' },
          { idLink: '3', tipo: TipoLink.GITHUB, url: 'https://github.com/pessoa' },
        ],
      }),
    )
    vi.stubGlobal('window', { localStorage: storage })

    const candidato = draftService.carregar(criarCandidatoBase())

    expect(candidato.nome).toBe('Pessoa com Links')
    expect(candidato.links).toHaveLength(2)
    expect(candidato.links.map((link) => link.tipo)).toEqual([TipoLink.LINKEDIN, TipoLink.GITHUB])
  })
})
