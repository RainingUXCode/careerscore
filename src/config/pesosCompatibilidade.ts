/**
 * Pesos-base de cada dimensão de compatibilidade. A nota geral é sempre
 * recalculada apenas sobre a soma dos pesos das dimensões efetivamente
 * avaliadas (ver compatibilidadeService.ts) — uma dimensão sem dados nunca
 * reduz a nota geral artificialmente.
 */
export const pesosCompatibilidade = {
  area: 20,
  cargo: 10,
  senioridade: 10,
  formacao: 8,
  experiencia: 10,
  competenciasTecnicas: 20,
  softSkills: 6,
  competenciasTransferiveis: 4,
  idiomas: 6,
  certificados: 4,
  licencas: 4,
  localizacao: 8,
  modalidade: 6,
  tipoContrato: 4,
  faixaSalarial: 6,
} as const

export type ChavePeso = keyof typeof pesosCompatibilidade
