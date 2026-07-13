import type { Candidato, OpcaoObjetivoProfissional } from '../types/models'
import type { Modalidade } from '../types/enums'

export function ajustarModalidadePreferida(aceitas: Modalidade[], preferida?: Modalidade): Modalidade | undefined {
  if (aceitas.length === 1) return aceitas[0]
  if (preferida && aceitas.includes(preferida)) return preferida
  return undefined
}

export function modalidadesAceitasAtivas(candidato: Candidato): Modalidade[] {
  const objetivo = candidato.objetivoProfissional
  if (objetivo.modo === 'definido' && objetivo.opcoes[0]?.modalidadesAceitas.length) {
    return objetivo.opcoes[0].modalidadesAceitas
  }
  return candidato.modalidadesPreferidas
}

export function modalidadePreferidaAtiva(candidato: Candidato): Modalidade | undefined {
  const objetivo = candidato.objetivoProfissional
  if (objetivo.modo === 'definido' && objetivo.opcoes[0]) {
    return ajustarModalidadePreferida(objetivo.opcoes[0].modalidadesAceitas, objetivo.opcoes[0].modalidadePreferida)
  }
  return ajustarModalidadePreferida(candidato.modalidadesPreferidas, candidato.modalidadePreferida)
}

export function normalizarOpcaoModalidade(opcao: OpcaoObjetivoProfissional): OpcaoObjetivoProfissional {
  return {
    ...opcao,
    modalidadePreferida: ajustarModalidadePreferida(opcao.modalidadesAceitas, opcao.modalidadePreferida),
  }
}
