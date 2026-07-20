import type { Candidato } from '../types/models'
import { TipoCompetencia, StatusCurso } from '../types/enums'
import type {
  CurriculoOtimizadoResult,
  ComparacaoSecao,
  ComparacaoCurriculo,
  TipoMudancaSecao,
  AtsAnalysisResult,
  CategoriaAnalise,
} from '../types/engine'
import { competenciasReferenciaPorArea } from '../data/competenciasReferencia'
import { formatarData } from '../utils/formatters'

export interface ComparacaoNotasAts {
  notaAnterior: number
  notaOtimizada: number
  diferenca: number
  categoriasMelhoradas: Array<{ categoria: CategoriaAnalise; delta: number }>
  categoriasPendentes: CategoriaAnalise[]
}

/**
 * Compara a nota de ATS anterior com a estimada para o currículo otimizado,
 * categoria por categoria. Não aplica nenhum bônus artificial — as duas notas
 * vêm do mesmo motor heurístico, cada uma analisando um texto diferente.
 */
export function compararNotasAts(original: AtsAnalysisResult, otimizado: AtsAnalysisResult): ComparacaoNotasAts {
  const categoriasMelhoradas = otimizado.categorias
    .map((categoria) => {
      const anterior = original.categorias.find((c) => c.chave === categoria.chave)
      const delta = anterior ? categoria.nota - anterior.nota : 0
      return { categoria, delta }
    })
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)

  const categoriasPendentes = otimizado.categorias.filter((categoria) => categoria.nota < 6).sort((a, b) => a.nota - b.nota)

  return {
    notaAnterior: original.notaGeral,
    notaOtimizada: otimizado.notaGeral,
    diferenca: otimizado.notaGeral - original.notaGeral,
    categoriasMelhoradas,
    categoriasPendentes,
  }
}

/**
 * Compara o perfil cadastrado (dados estruturados do formulário, sem
 * curadoria) com o currículo ATS otimizado, seção por seção. O gerador nunca remove conteúdo do
 * candidato, só reorganiza ou acrescenta o que já é comprovável (ex: projetos
 * do GitHub) — por isso não existe tipo 'removido'. Quando não há diferença
 * comprovável, a seção fica marcada como 'sem_alteracao': não inventamos uma
 * melhoria para toda seção.
 */
export function compararCurriculo(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoCurriculo {
  return {
    secoes: [
      compararResumo(otimizado),
      compararHabilidades(candidato, otimizado),
      compararProjetos(otimizado),
      compararExperiencias(candidato, otimizado),
      compararFormacao(candidato, otimizado),
      compararCertificados(candidato, otimizado),
      compararIdiomas(candidato, otimizado),
      compararLinks(candidato, otimizado),
    ],
    geradoEm: new Date().toISOString(),
  }
}

function compararResumo(otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const temResumo = otimizado.resumoProfissional.trim().length > 0
  return {
    chave: 'resumo',
    nome: 'Resumo profissional',
    tipos: temResumo ? ['adicionado'] : ['ausente'],
    resumoMudanca: temResumo
      ? 'O formulário não tem um campo de resumo — este parágrafo foi montado a partir do nível de experiência, área de interesse, principais competências técnicas e idiomas já informados.'
      : 'Não há dados suficientes ainda para montar um resumo profissional.',
    motivoAts:
      'Um resumo no topo ajuda tanto recrutadores quanto sistemas de triagem a identificar rapidamente o perfil, antes mesmo de ler o restante do documento.',
    conteudoOriginal: [],
    conteudoOtimizado: temResumo ? [otimizado.resumoProfissional] : [],
  }
}

function compararHabilidades(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.TECNICA).map((c) => c.nome)
  const referencia = (competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []).map((r) => r.toLowerCase())
  const destacadas = otimizado.habilidadesTecnicas.filter((h) => referencia.includes(h.toLowerCase()))

  const ordemMudou = original.join('|').toLowerCase() !== otimizado.habilidadesTecnicas.join('|').toLowerCase()

  const tipos: TipoMudancaSecao[] = []
  if (ordemMudou) tipos.push('reorganizado')
  if (destacadas.length > 0 && ordemMudou) tipos.push('destacado')
  if (tipos.length === 0) tipos.push('sem_alteracao')

  return {
    chave: 'habilidades',
    nome: 'Habilidades técnicas',
    tipos,
    resumoMudanca: ordemMudou
      ? `As mesmas ${original.length} competência(s) cadastradas foram reordenadas${
          destacadas.length > 0
            ? `, priorizando ${destacadas.join(', ')} por serem mais relevantes para ${candidato.areaInteresse.nome}`
            : ''
        }. Nenhuma competência foi adicionada ou removida.`
      : 'A ordem já correspondia à prioridade da área — nenhuma reorganização foi necessária.',
    motivoAts:
      'Sistemas de triagem e recrutadores tendem a dar mais peso às primeiras palavras-chave lidas em uma lista de habilidades.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizado.habilidadesTecnicas,
  }
}

function compararProjetos(otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const temProjetos = otimizado.projetos.length > 0
  return {
    chave: 'projetos',
    nome: 'Projetos',
    tipos: temProjetos ? ['adicionado'] : ['ausente'],
    resumoMudanca: temProjetos
      ? `O formulário não tem uma seção de projetos — estes ${otimizado.projetos.length} projeto(s) vieram de repositórios públicos reais do GitHub com descrição e tecnologia identificável.`
      : 'Nenhum projeto público com dados suficientes foi encontrado para incluir automaticamente (nada foi inventado).',
    motivoAts:
      'Projetos com tecnologias explícitas reforçam as palavras-chave técnicas do currículo e dão evidência prática das habilidades listadas.',
    conteudoOriginal: [],
    conteudoOtimizado: otimizado.projetos.map(
      (p) => `${p.nome}${p.tecnologias.length > 0 ? ` (${p.tecnologias.join(', ')})` : ''}`,
    ),
  }
}

function compararExperiencias(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.experiencias.map((exp) => `${exp.cargo} — ${exp.empresa}: ${exp.descricao}`)
  const otimizadoTexto = otimizado.experiencias.map((exp) => `${exp.cargo} — ${exp.empresa}: ${exp.pontos.join(' ')}`)

  const algumaQuebrouEmTopicos = otimizado.experiencias.some((exp) => exp.pontos.length > 1)
  const tipos: TipoMudancaSecao[] = algumaQuebrouEmTopicos ? ['reorganizado'] : ['sem_alteracao']

  return {
    chave: 'experiencias',
    nome: 'Experiência profissional',
    tipos,
    resumoMudanca:
      candidato.experiencias.length === 0
        ? 'Nenhuma experiência cadastrada.'
        : algumaQuebrouEmTopicos
          ? `As mesmas ${candidato.experiencias.length} experiência(s) foram mantidas na íntegra — as descrições longas foram quebradas em tópicos, sem alterar o texto original.`
          : 'As descrições já eram curtas o suficiente — nenhuma reorganização foi necessária.',
    motivoAts:
      'Descrições em tópicos são mais fáceis de escanear rapidamente por recrutadores e por sistemas automáticos de leitura de currículo.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizadoTexto,
  }
}

function compararFormacao(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.escolaridades.map(
    (e) =>
      `${e.curso} — ${e.instituicao} (${e.dataInicio || '—'} a ${e.status === StatusCurso.CURSANDO ? 'atual' : e.dataFim || '—'})`,
  )
  const otimizadoTexto = otimizado.formacao.map((f) => `${f.curso} — ${f.instituicao} (${f.periodo})`)

  const formatoMudou = candidato.escolaridades.some((e) => formatarData(e.dataInicio) !== e.dataInicio)
  const tipos: TipoMudancaSecao[] = formatoMudou ? ['reorganizado'] : ['sem_alteracao']

  return {
    chave: 'formacao',
    nome: 'Formação',
    tipos,
    resumoMudanca:
      candidato.escolaridades.length === 0
        ? 'Nenhuma formação cadastrada.'
        : formatoMudou
          ? 'As mesmas formações foram mantidas — apenas as datas foram padronizadas no formato mês/ano.'
          : 'Nenhuma reformatação foi necessária nas datas.',
    motivoAts: 'Datas em um formato consistente facilitam a leitura tanto por pessoas quanto por sistemas automáticos.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizadoTexto,
  }
}

function compararCertificados(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.certificados.map((c) => `${c.titulo} — ${c.instituicao}`)
  const otimizadoTexto = otimizado.certificados.map(
    (c) => `${c.titulo} — ${c.instituicao}${c.competenciasDetectadas.length > 0 ? ` [${c.competenciasDetectadas.join(', ')}]` : ''}`,
  )

  const temDetectadas = otimizado.certificados.some((c) => c.competenciasDetectadas.length > 0)
  const tipos: TipoMudancaSecao[] = temDetectadas ? ['destacado'] : ['sem_alteracao']

  return {
    chave: 'certificados',
    nome: 'Certificados',
    tipos,
    resumoMudanca:
      candidato.certificados.length === 0
        ? 'Nenhum certificado cadastrado.'
        : temDetectadas
          ? 'Os mesmos certificados foram mantidos — competências mencionadas no conteúdo real dos arquivos PDF foram identificadas e destacadas ao lado de cada um.'
          : 'Nenhuma competência adicional foi identificada automaticamente no conteúdo dos certificados.',
    motivoAts:
      'Mostrar explicitamente quais competências cada certificado comprova reforça a correspondência com os requisitos da vaga.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizadoTexto,
  }
}

function compararIdiomas(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.idiomas.map((i) => `${i.nome} (${i.nivelProficiencia})`)
  const otimizadoTexto = otimizado.idiomas.map((i) => `${i.nome} (${i.nivel})`)

  return {
    chave: 'idiomas',
    nome: 'Idiomas',
    tipos: ['sem_alteracao'],
    resumoMudanca:
      candidato.idiomas.length === 0
        ? 'Nenhum idioma adicional cadastrado.'
        : 'Os idiomas foram transcritos exatamente como informados, sem reorganização.',
    motivoAts: 'Uma seção de idiomas clara ajuda a qualificar para vagas com requisito de idioma.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizadoTexto,
  }
}

function compararLinks(candidato: Candidato, otimizado: CurriculoOtimizadoResult): ComparacaoSecao {
  const original = candidato.links.map((l) => `${l.tipo}: ${l.url || '(vazio)'}`)
  const otimizadoTexto = otimizado.links.map((l) => `${l.tipo}: ${l.url}`)

  const removeuVazios = candidato.links.some((l) => !l.url.trim())
  const tipos: TipoMudancaSecao[] = removeuVazios ? ['reorganizado'] : ['sem_alteracao']

  return {
    chave: 'links',
    nome: 'Links',
    tipos,
    resumoMudanca:
      candidato.links.length === 0
        ? 'Nenhum link cadastrado.'
        : removeuVazios
          ? 'Links sem URL preenchida foram omitidos do currículo — os demais foram mantidos como informados.'
          : 'Todos os links cadastrados foram incluídos, sem alteração.',
    motivoAts: 'Links diretos para GitHub/LinkedIn/portfólio no próprio arquivo facilitam a verificação por quem avalia o currículo.',
    conteudoOriginal: original,
    conteudoOtimizado: otimizadoTexto,
  }
}
