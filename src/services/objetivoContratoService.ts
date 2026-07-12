import type { NivelSenioridadeAlvo, OpcaoObjetivoProfissional, TipoContratoAceito } from '../types/models'

const contratosPorNivel: Partial<Record<NivelSenioridadeAlvo, TipoContratoAceito>> = {
  Estágio: 'Estágio',
  Aprendiz: 'Aprendiz',
  Trainee: 'Trainee',
}

const termosBuscaPorNivel: Partial<Record<NivelSenioridadeAlvo, string>> = {
  Estágio: 'estágio',
  Aprendiz: 'jovem aprendiz',
  Trainee: 'trainee',
}

export function contratoInferidoPorNivel(nivel?: NivelSenioridadeAlvo): TipoContratoAceito | undefined {
  return nivel ? contratosPorNivel[nivel] : undefined
}

export function nivelOcultaContratos(nivel?: NivelSenioridadeAlvo): boolean {
  return Boolean(contratoInferidoPorNivel(nivel))
}

export function contratosVisiveisParaNivel(nivel?: NivelSenioridadeAlvo): boolean {
  return !nivelOcultaContratos(nivel)
}

export function contratosAoAlterarNivel(nivel: NivelSenioridadeAlvo, contratosAtuais: TipoContratoAceito[]): TipoContratoAceito[] {
  return nivelOcultaContratos(nivel) ? [] : contratosAtuais
}

export function contratosEfetivosDaOpcao(opcao?: Pick<OpcaoObjetivoProfissional, 'nivelAlvo' | 'tiposContratoAceitos'>): TipoContratoAceito[] {
  const inferido = contratoInferidoPorNivel(opcao?.nivelAlvo)
  return inferido ? [inferido] : (opcao?.tiposContratoAceitos ?? [])
}

export function termoBuscaContratoInferido(nivel?: NivelSenioridadeAlvo): string | undefined {
  return nivel ? termosBuscaPorNivel[nivel] : undefined
}
