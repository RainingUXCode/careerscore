import type { NivelSenioridadeAlvo } from '../types/models'
import type { NivelSenioridadeVaga } from '../types/vaga'
import { normalizarTexto } from '../utils/texto'

export interface InferenciaSenioridadeVaga {
  senioridade?: NivelSenioridadeVaga
  senioridadesPossiveis: NivelSenioridadeVaga[]
  textoAnalisado: string
}

const ordemSenioridadeInferida: NivelSenioridadeVaga[] = [
  'Estágio',
  'Aprendiz',
  'Trainee',
  'Auxiliar',
  'Assistente',
  'Júnior',
  'Pleno',
  'Sênior',
  'Especialista',
  'Coordenação',
  'Gerência',
  'Diretoria',
]

const padroesSenioridade: Array<{ nivel: NivelSenioridadeVaga; padroes: string[] }> = [
  { nivel: 'Aprendiz', padroes: ['jovem aprendiz', 'aprendiz'] },
  { nivel: 'Estágio', padroes: ['estagio', 'estagiario', 'intern', 'internship'] },
  { nivel: 'Trainee', padroes: ['trainee'] },
  { nivel: 'Júnior', padroes: ['junior', 'jr', 'jr.', 'nivel inicial', 'entry level'] },
  { nivel: 'Pleno', padroes: ['pleno', 'pl', 'pl.', 'mid level', 'mid-level'] },
  { nivel: 'Sênior', padroes: ['senior', 'sr', 'sr.', 'senior level', 'senior-level'] },
  { nivel: 'Especialista', padroes: ['especialista', 'specialist', 'tech lead', 'lider tecnico', 'lead'] },
  { nivel: 'Coordenação', padroes: ['coordenacao', 'coordenador'] },
  { nivel: 'Gerência', padroes: ['gerente', 'manager'] },
  { nivel: 'Diretoria', padroes: ['head'] },
]

function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function padraoParaRegex(padrao: string): RegExp {
  const semPontoFinal = padrao.endsWith('.') ? padrao.slice(0, -1) : padrao
  const partes = semPontoFinal
    .split(/[\s-]+/)
    .map(escaparRegex)
    .join('[\\s-]+')
  return new RegExp(`(^|[^a-z0-9])${partes}\\.?($|[^a-z0-9])`, 'i')
}

function contemPadrao(texto: string, padrao: string): boolean {
  return padraoParaRegex(normalizarTexto(padrao)).test(texto)
}

export function inferirSenioridadeVaga(titulo = '', descricao = ''): InferenciaSenioridadeVaga {
  const textoAnalisado = `${titulo} ${descricao}`.trim()
  const texto = normalizarTexto(textoAnalisado)
  const encontrados = new Set<NivelSenioridadeVaga>()

  for (const grupo of padroesSenioridade) {
    if (grupo.padroes.some((padrao) => contemPadrao(texto, padrao))) {
      encontrados.add(grupo.nivel)
    }
  }

  const senioridadesPossiveis = ordemSenioridadeInferida.filter((nivel) => encontrados.has(nivel))
  return {
    senioridade: senioridadesPossiveis[0],
    senioridadesPossiveis,
    textoAnalisado,
  }
}

export function formatarSenioridadeVaga(vaga: {
  senioridade?: NivelSenioridadeVaga
  senioridadesPossiveis?: NivelSenioridadeVaga[]
  senioridadeInformada: boolean
}): string {
  if (!vaga.senioridadeInformada) {
    return 'A empresa não informou a senioridade. Confirme antes de se candidatar.'
  }
  const senioridades = vaga.senioridadesPossiveis?.length ? vaga.senioridadesPossiveis : vaga.senioridade ? [vaga.senioridade] : []
  return senioridades.length > 1 ? senioridades.join(' ou ') : senioridades[0] ?? 'A empresa não informou a senioridade. Confirme antes de se candidatar.'
}

function alvoEhExato(nivelAlvo: NivelSenioridadeAlvo, aceito: NivelSenioridadeVaga, senioridades: NivelSenioridadeVaga[]): boolean {
  return nivelAlvo === aceito && senioridades.includes(aceito)
}

export function senioridadeIncompativelComObjetivo(
  nivelAlvo: NivelSenioridadeAlvo | undefined,
  senioridadesPossiveis: NivelSenioridadeVaga[],
): boolean {
  if (!nivelAlvo || nivelAlvo === 'Indiferente' || senioridadesPossiveis.length === 0) return false

  if (nivelAlvo === 'Estágio') return !alvoEhExato(nivelAlvo, 'Estágio', senioridadesPossiveis)
  if (nivelAlvo === 'Aprendiz') return !alvoEhExato(nivelAlvo, 'Aprendiz', senioridadesPossiveis)
  if (nivelAlvo === 'Trainee') return !senioridadesPossiveis.includes('Trainee')

  const superioresParaJunior: NivelSenioridadeVaga[] = ['Pleno', 'Sênior', 'Especialista', 'Coordenação', 'Gerência', 'Diretoria']
  if (nivelAlvo === 'Júnior') return senioridadesPossiveis.some((nivel) => superioresParaJunior.includes(nivel))

  const entrada: NivelSenioridadeVaga[] = ['Estágio', 'Aprendiz', 'Trainee', 'Auxiliar', 'Assistente', 'Júnior']
  if (nivelAlvo === 'Auxiliar' || nivelAlvo === 'Assistente') {
    return senioridadesPossiveis.some((nivel) => !entrada.includes(nivel))
  }

  if (nivelAlvo === 'Pleno') {
    return senioridadesPossiveis.some((nivel) => ['Sênior', 'Especialista', 'Coordenação', 'Gerência', 'Diretoria'].includes(nivel))
  }

  return false
}
