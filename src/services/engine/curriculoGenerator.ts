import type { Candidato } from '../../types/models'
import { TipoCompetencia, NomeArea, StatusCurso } from '../../types/enums'
import type {
  CareerAnalyzer,
  CurriculoOtimizadoResult,
  ContatoOtimizado,
  ProjetoOtimizado,
  ExperienciaOtimizada,
  FormacaoOtimizada,
  CertificadoOtimizado,
  IdiomaOtimizado,
  LinkOtimizado,
} from '../../types/engine'
import type { ContextoExterno } from '../../types/externo'
import { competenciasReferenciaPorArea } from '../../data/competenciasReferencia'
import { formatarData, calcularDuracaoMeses } from '../../utils/formatters'

export interface CurriculoGeneratorInput {
  candidato: Candidato
  contextoExterno?: ContextoExterno
}

// ---------------------------------------------------------------------------
// Helpers de composição de texto (só organizam/reformatam dados reais já
// existentes — nunca acrescentam fatos novos).
// ---------------------------------------------------------------------------

function listarComE(itens: string[]): string {
  if (itens.length === 0) return ''
  if (itens.length === 1) return itens[0]
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

function formatarDuracao(meses: number): string {
  const anos = Math.floor(meses / 12)
  const mesesRestantes = meses % 12
  const partes: string[] = []
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`)
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`)
  return partes.length > 0 ? partes.join(' e ') : 'menos de 1 mês'
}

function ordenarPorRelevancia(itens: string[], referencia: string[]): string[] {
  const referenciaNormalizada = referencia.map((r) => r.toLowerCase())
  return [...itens].sort((a, b) => {
    const aRelevante = referenciaNormalizada.includes(a.toLowerCase()) ? 0 : 1
    const bRelevante = referenciaNormalizada.includes(b.toLowerCase()) ? 0 : 1
    return aRelevante - bRelevante
  })
}

/** Quebra a descrição (texto livre do próprio candidato) em pontos curtos, sem alterar o conteúdo. */
function dividirEmPontos(descricao: string): string[] {
  return descricao
    .split(/\n+|(?<=[.;])\s+(?=[A-ZÀ-Ú])/)
    .map((parte) => parte.trim())
    .filter(Boolean)
}

function obterNomeArea(candidato: Candidato): string {
  if (candidato.areaInteresse.nome === NomeArea.OUTRO) {
    return candidato.areaInteresse.nomePersonalizado?.trim() || 'sua área de interesse'
  }
  return candidato.areaInteresse.nome
}

// ---------------------------------------------------------------------------
// Construtores de cada seção — cada um usa exclusivamente dados já existentes
// no formulário ou em análises externas já validadas (GitHub, certificados).
// ---------------------------------------------------------------------------

function montarContato(candidato: Candidato): ContatoOtimizado {
  return {
    nome: candidato.nome,
    email: candidato.email,
    telefone: candidato.telefone,
    localizacao: [candidato.cidade, candidato.estado].filter((parte) => parte.trim()).join(', '),
  }
}

function montarResumoProfissional(candidato: Candidato): string {
  const area = obterNomeArea(candidato)
  const referencia = competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []
  const tecnicas = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.TECNICA).map((c) => c.nome)
  const tecnicasDestaque = ordenarPorRelevancia(tecnicas, referencia).slice(0, 3)

  const mesesExperiencia = candidato.experiencias.reduce(
    (soma, exp) => soma + calcularDuracaoMeses(exp.dataInicio, exp.empregoAtual ? undefined : exp.dataFim),
    0,
  )

  const frases: string[] = []

  frases.push(
    `Profissional nível ${candidato.nivelExperiencia.toLowerCase()} com interesse em ${area}` +
      (tecnicasDestaque.length > 0 ? `, com conhecimento em ${listarComE(tecnicasDestaque)}.` : '.'),
  )

  if (mesesExperiencia > 0) {
    frases.push(`Acumula ${formatarDuracao(mesesExperiencia)} de experiência profissional registrada.`)
  }

  const idiomaDestaque = candidato.idiomas.find((idioma) =>
    ['Avançado', 'Fluente', 'Nativo'].includes(idioma.nivelProficiencia),
  )
  if (idiomaDestaque) {
    frases.push(`Nível ${idiomaDestaque.nivelProficiencia.toLowerCase()} em ${idiomaDestaque.nome}.`)
  }

  return frases.join(' ')
}

function montarHabilidadesTecnicas(candidato: Candidato): string[] {
  const referencia = competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []
  const tecnicas = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.TECNICA).map((c) => c.nome)
  return ordenarPorRelevancia(tecnicas, referencia)
}

/**
 * Projetos vêm exclusivamente de repositórios reais do GitHub já qualificados
 * (ver githubService.repoQualificaComoProjeto) — nunca são inventados aqui.
 * Se não houver GitHub analisado ou nenhum repositório qualificado, a seção
 * fica vazia (a UI mostra uma mensagem honesta em vez de preencher com algo
 * genérico).
 */
function montarProjetos(contextoExterno?: ContextoExterno): ProjetoOtimizado[] {
  const repositorios = contextoExterno?.github?.repositoriosDestaque ?? []
  return repositorios.map((repo) => ({
    nome: repo.nome,
    descricao: repo.descricao,
    url: repo.url,
    tecnologias: repo.linguagem ? [repo.linguagem] : [],
  }))
}

function montarExperiencias(candidato: Candidato): ExperienciaOtimizada[] {
  return candidato.experiencias.map((exp) => ({
    cargo: exp.cargo,
    empresa: exp.empresa,
    periodo: `${formatarData(exp.dataInicio)} – ${exp.empregoAtual ? 'Atual' : formatarData(exp.dataFim)}`,
    pontos: dividirEmPontos(exp.descricao),
  }))
}

function montarFormacao(candidato: Candidato): FormacaoOtimizada[] {
  return candidato.escolaridades.map((esc) => ({
    curso: esc.curso,
    instituicao: esc.instituicao,
    nivel: esc.nivel,
    status: esc.status,
    periodo: `${formatarData(esc.dataInicio)} – ${esc.status === StatusCurso.CURSANDO ? 'Em andamento' : formatarData(esc.dataFim)}`,
  }))
}

function montarCertificados(candidato: Candidato, contextoExterno?: ContextoExterno): CertificadoOtimizado[] {
  return candidato.certificados.map((cert) => ({
    titulo: cert.titulo,
    instituicao: cert.instituicao,
    cargaHoraria: cert.cargaHoraria,
    competenciasDetectadas: contextoExterno?.competenciasPorCertificado?.[cert.idCertificado] ?? [],
  }))
}

function montarIdiomas(candidato: Candidato): IdiomaOtimizado[] {
  return candidato.idiomas.map((idioma) => ({ nome: idioma.nome, nivel: idioma.nivelProficiencia }))
}

function montarLinks(candidato: Candidato): LinkOtimizado[] {
  return candidato.links.filter((link) => link.url.trim()).map((link) => ({ tipo: link.tipo, url: link.url }))
}

/**
 * Serializa o currículo otimizado em texto simples, no mesmo formato que a
 * extração de PDF produziria. Usado para reaproveitar o motor heurístico de
 * ATS já existente (`careerAnalysisEngine.analisarAts`) e estimar a nota do
 * currículo otimizado sem duplicar nenhuma lógica de pontuação.
 */
export function serializarCurriculoParaTexto(curriculo: CurriculoOtimizadoResult): string {
  const linhas: string[] = []

  linhas.push(curriculo.contato.nome)
  linhas.push([curriculo.contato.email, curriculo.contato.telefone, curriculo.contato.localizacao].filter(Boolean).join(' | '))

  if (curriculo.resumoProfissional) {
    linhas.push('', 'Resumo', curriculo.resumoProfissional)
  }

  if (curriculo.habilidadesTecnicas.length > 0) {
    linhas.push('', 'Habilidades', curriculo.habilidadesTecnicas.join(', '))
  }

  if (curriculo.projetos.length > 0) {
    linhas.push('', 'Projetos')
    curriculo.projetos.forEach((projeto) => {
      linhas.push(`${projeto.nome} — ${projeto.descricao}`)
      if (projeto.tecnologias.length > 0) linhas.push(projeto.tecnologias.join(', '))
    })
  }

  if (curriculo.experiencias.length > 0) {
    linhas.push('', 'Experiência profissional')
    curriculo.experiencias.forEach((exp) => {
      linhas.push(`${exp.cargo} — ${exp.empresa} (${exp.periodo})`)
      linhas.push(...exp.pontos)
    })
  }

  if (curriculo.formacao.length > 0) {
    linhas.push('', 'Formação')
    curriculo.formacao.forEach((form) => {
      linhas.push(`${form.curso} — ${form.instituicao} (${form.periodo})`)
    })
  }

  if (curriculo.certificados.length > 0) {
    linhas.push('', 'Certificados')
    curriculo.certificados.forEach((cert) => {
      linhas.push(`${cert.titulo} — ${cert.instituicao}`)
    })
  }

  if (curriculo.idiomas.length > 0) {
    linhas.push('', 'Idiomas', curriculo.idiomas.map((idioma) => `${idioma.nome} (${idioma.nivel})`).join(', '))
  }

  if (curriculo.links.length > 0) {
    linhas.push('', 'Links', ...curriculo.links.map((link) => `${link.tipo}: ${link.url}`))
  }

  return linhas.join('\n').trim()
}

/**
 * Implementação heurística (v1) do gerador de currículo ATS otimizado.
 * Reaproveita o mesmo contrato Strategy (CareerAnalyzer) usado pela análise de
 * ATS — o método continua se chamando `analisar` por convenção da interface,
 * mesmo aqui produzindo um documento em vez de uma nota. Uma futura
 * `ClaudeCurriculoGenerator` implementaria o mesmo contrato sem exigir
 * mudanças em componentes ou no motor.
 */
export class HeuristicCurriculoGenerator
  implements CareerAnalyzer<CurriculoGeneratorInput, CurriculoOtimizadoResult>
{
  readonly nome = 'curriculo-heuristico-v1'

  async analisar({ candidato, contextoExterno }: CurriculoGeneratorInput): Promise<CurriculoOtimizadoResult> {
    const projetos = montarProjetos(contextoExterno)
    return {
      contato: montarContato(candidato),
      resumoProfissional: montarResumoProfissional(candidato),
      habilidadesTecnicas: montarHabilidadesTecnicas(candidato),
      projetos,
      experiencias: montarExperiencias(candidato),
      formacao: montarFormacao(candidato),
      certificados: montarCertificados(candidato, contextoExterno),
      idiomas: montarIdiomas(candidato),
      links: montarLinks(candidato),
      fonte: 'heuristico',
      geradoEm: new Date().toISOString(),
      origens: {
        contato: 'formulario',
        resumoProfissional: 'gerado_pelo_sistema',
        habilidadesTecnicas: 'formulario',
        projetos: projetos.length > 0 ? 'github' : 'formulario',
        experiencias: 'formulario',
        formacao: 'formulario',
        certificados: 'formulario',
        certificadosCompetenciasDetectadas: 'certificado',
        idiomas: 'formulario',
        links: 'formulario',
      },
    }
  }
}
