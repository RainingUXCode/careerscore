import type { Candidato } from '../types/models'
import { NivelExperiencia, NomeArea, StatusCurso, TipoLink } from '../types/enums'
import type { NivelSenioridadeVaga } from '../types/vaga'
import { calcularDuracaoMeses } from '../utils/formatters'
import { normalizarTexto } from '../utils/texto'

export type NivelAtualInferido =
  | 'primeiro_emprego'
  | 'aprendiz'
  | 'estagiario'
  | 'junior'
  | 'pleno'
  | 'senior'
  | 'especialista'
  | 'nao_informado'

const palavrasPorArea: Record<NomeArea, string[]> = {
  [NomeArea.SAUDE]: ['saude', 'paciente', 'clinica', 'hospital', 'fisioterapia', 'enfermagem', 'farmacia'],
  [NomeArea.TECNOLOGIA_DADOS]: ['tecnologia', 'dados', 'desenvolvedor', 'programador', 'software', 'sistema', 'front', 'back', 'react', 'python', 'sql', 'ti'],
  [NomeArea.GESTAO_NEGOCIOS]: ['administrativo', 'gestao', 'negocios', 'rh', 'financeiro', 'processos', 'projeto', 'operacoes'],
  [NomeArea.ENGENHARIA]: ['engenharia', 'obra', 'projeto', 'manutencao', 'qualidade', 'producao'],
  [NomeArea.COMERCIO_ATENDIMENTO]: ['atendimento', 'cliente', 'vendas', 'comercial', 'loja', 'suporte'],
  [NomeArea.OUTRO]: [],
}

const fallbackLegado: Record<NivelExperiencia, NivelAtualInferido> = {
  [NivelExperiencia.ESTAGIARIO]: 'estagiario',
  [NivelExperiencia.JUNIOR]: 'junior',
  [NivelExperiencia.PLENO]: 'pleno',
  [NivelExperiencia.SENIOR]: 'senior',
  [NivelExperiencia.ESPECIALISTA]: 'especialista',
}

const senioridadePorNivelAtual: Partial<Record<NivelAtualInferido, NivelSenioridadeVaga>> = {
  aprendiz: 'Aprendiz',
  estagiario: 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  especialista: 'Especialista',
}

function contemQualquer(texto: string, termos: string[]): boolean {
  return termos.some((termo) => texto.includes(normalizarTexto(termo)))
}

function textoExperiencia(candidato: Candidato): string {
  return candidato.experiencias.map((experiencia) => `${experiencia.cargo} ${experiencia.descricao}`).join(' ')
}

function temProjetoOuPortfolio(candidato: Candidato): boolean {
  return candidato.links.some((link) =>
    [TipoLink.GITHUB, TipoLink.PORTFOLIO, TipoLink.BEHANCE, TipoLink.DRIBBBLE].includes(link.tipo) && link.url.trim(),
  )
}

function experienciaRelacionadaAreaAlvo(candidato: Candidato): boolean {
  const texto = normalizarTexto(textoExperiencia(candidato))
  const termosArea = [
    ...palavrasPorArea[candidato.areaInteresse.nome],
    candidato.areaInteresse.nomePersonalizado ?? '',
    ...candidato.competencias.map((competencia) => competencia.nome),
  ].filter(Boolean)
  return termosArea.length > 0 && contemQualquer(texto, termosArea)
}

function mesesExperiencia(candidato: Candidato): number {
  return candidato.experiencias.reduce(
    (soma, experiencia) => soma + calcularDuracaoMeses(experiencia.dataInicio, experiencia.empregoAtual ? undefined : experiencia.dataFim || experiencia.dataInicio),
    0,
  )
}

function cargoIndica(textoNormalizado: string, termos: string[]): boolean {
  return contemQualquer(textoNormalizado, termos)
}

export function inferirNivelAtual(candidato: Candidato): NivelAtualInferido {
  const texto = normalizarTexto(textoExperiencia(candidato))
  if (cargoIndica(texto, ['aprendiz', 'jovem aprendiz'])) return 'aprendiz'
  if (cargoIndica(texto, ['estagio', 'estagiario', 'estagiaria'])) return 'estagiario'

  if (candidato.experiencias.length === 0) {
    if (candidato.escolaridades.some((escolaridade) => escolaridade.status === StatusCurso.CURSANDO)) return 'estagiario'
    if (temProjetoOuPortfolio(candidato) || candidato.competencias.length > 0 || candidato.certificados.length > 0) return 'primeiro_emprego'
    return candidato.nivelExperiencia ? fallbackLegado[candidato.nivelExperiencia] : 'nao_informado'
  }

  const relacionada = experienciaRelacionadaAreaAlvo(candidato)
  const meses = mesesExperiencia(candidato)

  if (!relacionada) {
    return candidato.nivelExperiencia && fallbackLegado[candidato.nivelExperiencia] !== 'pleno' && fallbackLegado[candidato.nivelExperiencia] !== 'senior'
      ? fallbackLegado[candidato.nivelExperiencia]
      : 'junior'
  }

  if (cargoIndica(texto, ['especialista'])) return 'especialista'
  if (cargoIndica(texto, ['senior', 'sr']) && meses >= 60) return 'senior'
  if (cargoIndica(texto, ['pleno']) && meses >= 36) return 'pleno'
  if (meses >= 96) return 'senior'
  if (meses >= 48) return 'pleno'
  return 'junior'
}

export function senioridadeAtualInferida(candidato: Candidato): NivelSenioridadeVaga | undefined {
  return senioridadePorNivelAtual[inferirNivelAtual(candidato)]
}

export function rotuloNivelAtual(candidato: Candidato): string {
  const nivel = inferirNivelAtual(candidato)
  const rotulos: Record<NivelAtualInferido, string> = {
    primeiro_emprego: 'primeiro emprego',
    aprendiz: 'aprendiz',
    estagiario: 'estagiário',
    junior: 'júnior',
    pleno: 'pleno',
    senior: 'sênior',
    especialista: 'especialista',
    nao_informado: 'não informado',
  }
  return rotulos[nivel]
}
