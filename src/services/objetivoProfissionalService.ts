import type {
  ModoObjetivoProfissional,
  ObjetivoProfissional,
  OpcaoObjetivoProfissional,
  PreferenciasExploracao,
} from '../types/models'
import { Modalidade } from '../types/enums'

export const preferenciasExploracaoPadrao: PreferenciasExploracao = {
  atividadesPreferidas: [],
  atividadesEvitar: [],
  prefereTrabalharCom: [],
  rotinaOuVariedade: undefined,
  individualOuEquipe: undefined,
  ambientesPreferidos: [],
  interesses: [],
}

export const objetivoProfissionalPadrao: ObjetivoProfissional = {
  modo: 'exploracao',
  cargoDesejado: '',
  nivelAlvo: 'Indiferente',
  areasSecundarias: [],
  tiposContratoAceitos: ['Indiferente'],
  modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
  cidadeBusca: '',
  estadoBusca: '',
  paisBusca: 'Brasil',
  aceitaMudanca: false,
  conhecimentosPrioritarios: [],
  opcoes: [],
  preferenciasExploracao: preferenciasExploracaoPadrao,
}

function texto(valor: unknown, fallback = ''): string {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : fallback
}

function arrayTexto(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.map((item) => texto(item)).filter(Boolean)
    : []
}

function arrayComFallback<T>(valor: unknown, fallback: T[]): T[] {
  return Array.isArray(valor) && valor.length > 0 ? (valor as T[]) : fallback
}

function normalizarModo(valor: unknown, cargoDesejado: string): ModoObjetivoProfissional {
  if (valor === 'definido' || valor === 'multiplas_opcoes' || valor === 'exploracao') return valor
  return cargoDesejado ? 'definido' : 'exploracao'
}

function normalizarOpcoes(valor: unknown): OpcaoObjetivoProfissional[] {
  if (!Array.isArray(valor)) return []
  const opcoes = valor
    .slice(0, 3)
    .map((item, indice) => {
      const dados = item && typeof item === 'object' ? (item as Partial<OpcaoObjetivoProfissional>) : {}
      return {
        id: texto(dados.id, `objetivo-${indice + 1}`),
        cargoOuArea: texto(dados.cargoOuArea),
        nivelAlvo: dados.nivelAlvo,
        prioridade: typeof dados.prioridade === 'number' ? dados.prioridade : indice + 1,
        principal: Boolean(dados.principal),
        tiposContratoAceitos: arrayComFallback(dados.tiposContratoAceitos, objetivoProfissionalPadrao.tiposContratoAceitos),
        modalidadesAceitas: arrayComFallback(dados.modalidadesAceitas, objetivoProfissionalPadrao.modalidadesAceitas),
      }
    })
    .filter((opcao) => opcao.cargoOuArea)

  if (opcoes.length > 0 && !opcoes.some((opcao) => opcao.principal)) {
    opcoes[0] = { ...opcoes[0], principal: true }
  }

  return opcoes
}

function normalizarPreferenciasExploracao(valor: unknown): PreferenciasExploracao {
  const dados = valor && typeof valor === 'object' ? (valor as Partial<PreferenciasExploracao>) : {}
  return {
    atividadesPreferidas: arrayTexto(dados.atividadesPreferidas),
    atividadesEvitar: arrayTexto(dados.atividadesEvitar),
    prefereTrabalharCom: arrayTexto(dados.prefereTrabalharCom) as PreferenciasExploracao['prefereTrabalharCom'],
    rotinaOuVariedade: dados.rotinaOuVariedade,
    individualOuEquipe: dados.individualOuEquipe,
    ambientesPreferidos: arrayTexto(dados.ambientesPreferidos),
    interesses: arrayTexto(dados.interesses),
  }
}

export function normalizarObjetivoProfissional(valor: unknown): ObjetivoProfissional {
  const dados = valor && typeof valor === 'object' ? (valor as Partial<ObjetivoProfissional>) : {}
  const cargoDesejado = texto(dados.cargoDesejado)
  const opcoes = normalizarOpcoes(dados.opcoes)
  const preferenciasExploracao = normalizarPreferenciasExploracao(dados.preferenciasExploracao)
  return {
    ...objetivoProfissionalPadrao,
    ...dados,
    modo: normalizarModo(dados.modo, cargoDesejado),
    cargoDesejado,
    nivelAlvo: dados.nivelAlvo ?? objetivoProfissionalPadrao.nivelAlvo,
    areasSecundarias: arrayTexto(dados.areasSecundarias),
    tiposContratoAceitos: arrayComFallback(dados.tiposContratoAceitos, objetivoProfissionalPadrao.tiposContratoAceitos),
    modalidadesAceitas: arrayComFallback(dados.modalidadesAceitas, objetivoProfissionalPadrao.modalidadesAceitas),
    cidadeBusca: texto(dados.cidadeBusca),
    estadoBusca: texto(dados.estadoBusca),
    paisBusca: texto(dados.paisBusca, objetivoProfissionalPadrao.paisBusca) || objetivoProfissionalPadrao.paisBusca,
    aceitaMudanca: Boolean(dados.aceitaMudanca),
    conhecimentosPrioritarios: arrayTexto(dados.conhecimentosPrioritarios),
    pretensaoSalarial: dados.pretensaoSalarial,
    opcoes,
    preferenciasExploracao,
  }
}
