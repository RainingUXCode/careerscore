import type { NivelSenioridadeVaga } from '../types/vaga'

/** Ordem crescente de senioridade, usada para comparar candidato x vaga. */
export const ordemSenioridadeVaga: Record<NivelSenioridadeVaga, number> = {
  Estágio: 0,
  Aprendiz: 0,
  Trainee: 1,
  Assistente: 1,
  Auxiliar: 1,
  Júnior: 1,
  Pleno: 2,
  Sênior: 3,
  Especialista: 3,
  Coordenação: 4,
  Gerência: 5,
  Diretoria: 6,
}

/**
 * Só classifica a senioridade de uma vaga a partir de um campo estruturado
 * explícito (ex: já vindo assim da fonte/mock) — nunca infere pelo título sem
 * marcar como inferência. Reservado para uso futuro; hoje o normalizador só
 * usa o valor já presente na vaga mock.
 */
export function textoParaSenioridadeVaga(texto: string): NivelSenioridadeVaga | undefined {
  const normalizado = texto.trim().toLowerCase()
  const entradas = Object.keys(ordemSenioridadeVaga) as NivelSenioridadeVaga[]
  return entradas.find((nivel) => nivel.toLowerCase() === normalizado)
}
