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

  it('modo definido exige de 1 a 3 objetivos com cargo, modalidade e contrato', () => {
    const candidato = criarCandidatoBase()
    candidato.objetivoProfissional = {
      ...objetivoProfissionalPadrao,
      modo: 'definido',
      opcoes: [{
        id: '1',
        cargoOuArea: '',
        modalidadesAceitas: [],
        tiposContratoAceitos: [],
      }],
    }

    const erros = validationService.validarObjetivoProfissional(
      candidato,
    )

    expect(erros.opcao_0).toBeDefined()
    expect(erros.modalidades_0).toBeDefined()
    expect(erros.contratos_0).toBeDefined()
  })

  it('modo exploracao nao exige cargo, area, tecnologia prioritaria ou nivel', () => {
    const erros = validationService.validarObjetivoProfissional(
      criarCandidatoBase({
        objetivoProfissional: {
          modo: 'exploracao',
          opcoes: [],
          preferenciasExploracao: {
            interesses: ['pessoas'],
          },
        },
      }),
    )

    expect(erros.opcoes).toBeUndefined()
    expect(erros.preferenciasExploracao).toBeUndefined()
  })

  it('modo definido aceita ate 3 objetivos e usa a ordem como prioridade implicita', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [
          { id: '1', cargoOuArea: 'RH', tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
          { id: '2', cargoOuArea: 'Administrativo', tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
          { id: '3', cargoOuArea: 'Vendas', tiposContratoAceitos: ['CLT'], modalidadesAceitas: [Modalidade.PRESENCIAL] },
        ],
      },
    })

    const erros = validationService.validarObjetivoProfissional(candidato)
    expect(erros.opcoes).toBeUndefined()
    expect(candidato.objetivoProfissional.opcoes[0].cargoOuArea).toBe('RH')
  })

  it('nao exige contratos quando nivel infere contratação', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [{
          id: '1',
          cargoOuArea: 'Estágio em Dados',
          nivelAlvo: 'Estágio',
          tiposContratoAceitos: [],
          modalidadesAceitas: [Modalidade.REMOTO],
        }],
      },
    })

    const erros = validationService.validarObjetivoProfissional(candidato)
    expect(erros.contratos_0).toBeUndefined()
  })

  it('continua exigindo contratos quando nivel nao infere contratação', () => {
    const candidato = criarCandidatoBase()
    candidato.objetivoProfissional = {
      ...objetivoProfissionalPadrao,
      modo: 'definido',
      opcoes: [{
        id: '1',
        cargoOuArea: 'Desenvolvedor Júnior',
        nivelAlvo: 'Júnior',
        tiposContratoAceitos: [],
        modalidadesAceitas: [Modalidade.REMOTO],
      }],
    }

    const erros = validationService.validarObjetivoProfissional(candidato)
    expect(erros.contratos_0).toBeDefined()
  })

  it('migra rascunho antigo sem objetivo sem apagar dados existentes', () => {
    const storage = localStorageMemoria()
    storage.setItem(
      'careerscore:rascunho-candidato',
      JSON.stringify({
        nome: 'Pessoa Teste',
        email: 'teste@example.com',
        telefone: '83999999999',
        cidade: 'João Pessoa',
        estado: 'PB',
      }),
    )
    vi.stubGlobal('window', { localStorage: storage })

    const candidato = draftService.carregar(criarCandidatoBase())

    expect(candidato.nome).toBe('Pessoa Teste')
    expect(candidato.objetivoProfissional).toMatchObject({
      modo: 'exploracao',
      preferenciasExploracao: { interesses: [] },
      opcoes: [],
    })
  })

  it('migra perfil antigo com cargo preenchido para uma opcao definida', () => {
    const storage = localStorageMemoria()
    storage.setItem(
      'careerscore:rascunho-candidato',
      JSON.stringify({
        objetivoProfissional: {
          cargoDesejado: 'Assistente de RH',
          nivelAlvo: 'Assistente',
          tiposContratoAceitos: ['CLT'],
          modalidadesAceitas: [Modalidade.PRESENCIAL],
          paisBusca: 'Brasil',
          conhecimentosPrioritarios: ['Excel'],
        },
      }),
    )
    vi.stubGlobal('window', { localStorage: storage })

    const candidato = draftService.carregar(criarCandidatoBase())

    expect(candidato.objetivoProfissional.modo).toBe('definido')
    expect(candidato.objetivoProfissional.opcoes[0]).toMatchObject({
      cargoOuArea: 'Assistente de RH',
      nivelAlvo: 'Assistente',
      tiposContratoAceitos: ['CLT'],
      modalidadesAceitas: [Modalidade.PRESENCIAL],
    })
    expect('conhecimentosPrioritarios' in candidato.objetivoProfissional).toBe(false)
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
