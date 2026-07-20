import type {
  ModoObjetivoProfissional,
  ObjetivoProfissional,
  OpcaoObjetivoProfissional,
  PreferenciasExploracao,
} from '../types/models'
import { Modalidade } from '../types/enums'
import { separarValoresLista } from '../utils/listas'
import { ajustarModalidadePreferida } from './modalidadePreferenciaService'

export const preferenciasExploracaoPadrao: PreferenciasExploracao = {
  interesses: [],
}

export const objetivoProfissionalPadrao: ObjetivoProfissional = {
  modo: 'exploracao',
  opcoes: [],
  preferenciasExploracao: preferenciasExploracaoPadrao,
}

function texto(valor: unknown, fallback = ''): string {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : fallback
}

function arrayTexto(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.map((item) => texto(item)).filter(Boolean)
    : typeof valor === 'string'
      ? separarValoresLista(valor)
      : []
}

function arrayComFallback<T>(valor: unknown, fallback: T[]): T[] {
  return Array.isArray(valor) && valor.length > 0 ? (valor as T[]) : fallback
}

function normalizarOpcao(valor: unknown, indice: number): OpcaoObjetivoProfissional | undefined {
  const dados = valor && typeof valor === 'object' ? (valor as Partial<OpcaoObjetivoProfissional>) : {}
  const cargoOuArea = texto(dados.cargoOuArea)
  if (!cargoOuArea) return undefined
  const modalidadesAceitas = arrayComFallback(dados.modalidadesAceitas, [
    Modalidade.REMOTO,
    Modalidade.HIBRIDO,
    Modalidade.PRESENCIAL,
  ])
  return {
    id: texto(dados.id, `objetivo-${indice + 1}`),
    cargoOuArea,
    nivelAlvo: dados.nivelAlvo ?? 'Indiferente',
    tiposContratoAceitos: arrayComFallback(dados.tiposContratoAceitos, ['Indiferente']),
    modalidadesAceitas,
    modalidadePreferida: ajustarModalidadePreferida(modalidadesAceitas, dados.modalidadePreferida),
  }
}

function normalizarOpcoes(dados: Record<string, unknown>): OpcaoObjetivoProfissional[] {
  const opcoes = Array.isArray(dados.opcoes)
    ? dados.opcoes
        .slice(0, 3)
        .map((opcao, indice) => normalizarOpcao(opcao, indice))
        .filter((opcao): opcao is OpcaoObjetivoProfissional => Boolean(opcao))
    : []

  const cargoLegado = texto(dados.cargoDesejado)
  if (opcoes.length === 0 && cargoLegado) {
    const modalidadesAceitas = arrayComFallback(dados.modalidadesAceitas, [
      Modalidade.REMOTO,
      Modalidade.HIBRIDO,
      Modalidade.PRESENCIAL,
    ])
    return [
      {
        id: 'objetivo-1',
        cargoOuArea: cargoLegado,
        nivelAlvo: (dados.nivelAlvo as OpcaoObjetivoProfissional['nivelAlvo']) ?? 'Indiferente',
        tiposContratoAceitos: arrayComFallback(dados.tiposContratoAceitos, ['Indiferente']),
        modalidadesAceitas,
        modalidadePreferida: ajustarModalidadePreferida(modalidadesAceitas, dados.modalidadePreferida as Modalidade | undefined),
      },
    ]
  }

  return opcoes
}

function normalizarModo(valor: unknown, opcoes: OpcaoObjetivoProfissional[]): ModoObjetivoProfissional {
  if (valor === 'exploracao') return 'exploracao'
  if (valor === 'definido' || valor === 'multiplas_opcoes') return 'definido'
  return opcoes.length > 0 ? 'definido' : 'exploracao'
}

function normalizarPreferenciasExploracao(valor: unknown): PreferenciasExploracao {
  const dados = valor && typeof valor === 'object' ? (valor as Partial<PreferenciasExploracao>) : {}
  return {
    interesses: arrayTexto(dados.interesses),
  }
}

export function normalizarObjetivoProfissional(valor: unknown): ObjetivoProfissional {
  const dados = valor && typeof valor === 'object' ? (valor as Record<string, unknown>) : {}
  const opcoes = normalizarOpcoes(dados)
  return {
    modo: normalizarModo(dados.modo, opcoes),
    opcoes,
    preferenciasExploracao: normalizarPreferenciasExploracao(dados.preferenciasExploracao),
  }
}
