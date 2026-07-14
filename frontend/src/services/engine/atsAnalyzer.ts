import type { Candidato } from '../../types/models'
import { TipoCompetencia } from '../../types/enums'
import type { CareerAnalyzer, CategoriaAnalise, AtsAnalysisResult, MotivoTextoIndisponivel } from '../../types/engine'
import { competenciasReferenciaPorArea } from '../../data/competenciasReferencia'
import { normalizarTexto } from '../../utils/texto'

export interface AtsAnalyzerInput {
  candidato: Candidato
  /** Texto extraído do currículo (null quando não há currículo, ou não foi possível ler). */
  textoCurriculo: string | null
  /** Motivo pelo qual o texto não pôde ser lido, quando textoCurriculo é null. */
  motivoTextoIndisponivel?: MotivoTextoIndisponivel
}

/** Mensagem clara e específica sobre por que o texto do currículo não está disponível. */
function descreverMotivo(motivo?: MotivoTextoIndisponivel): string {
  switch (motivo) {
    case 'sem_arquivo':
      return 'Nenhum currículo foi anexado.'
    case 'formato_nao_suportado':
      return 'O formato do arquivo anexado não é suportado para leitura de texto nesta versão.'
    case 'documento_sem_texto':
      return 'Não conseguimos extrair texto do arquivo enviado — ele pode ser um PDF escaneado (imagem, sem OCR) ou o conteúdo está vazio.'
    case 'falha_na_leitura':
      return 'Houve uma falha ao tentar ler o arquivo — ele pode estar corrompido ou protegido.'
    default:
      return 'Não foi possível ler o conteúdo do currículo.'
  }
}

function recomendacoesPorMotivo(motivo?: MotivoTextoIndisponivel): string[] {
  switch (motivo) {
    case 'sem_arquivo':
      return ['Anexe seu currículo em PDF ou DOCX para permitir a leitura do conteúdo.']
    case 'formato_nao_suportado':
      return ['Envie o currículo em PDF ou DOCX.']
    case 'documento_sem_texto':
      return ['Se o PDF foi gerado a partir de uma digitalização/foto, exporte uma versão com texto selecionável (ex: a partir do Word ou Google Docs).']
    case 'falha_na_leitura':
      return ['Tente reexportar o arquivo e enviar novamente — ele pode estar corrompido.']
    default:
      return []
  }
}

/** Mensagem curta e consistente usada nas categorias que não têm um motivo específico para explicar. */
const JUSTIFICATIVA_SEM_TEXTO_GENERICA =
  'Sem o texto do currículo, esta categoria foi estimada apenas com os dados do formulário — a nota é menos precisa.'

function contarOcorrencias(textoNormalizado: string, termos: string[]): number {
  return termos.filter((termo) => termoNoTexto(textoNormalizado, termo)).length
}

function termoNoTexto(textoNormalizado: string, termo: string): boolean {
  return textoNormalizado.includes(normalizarTexto(termo))
}

// ---------------------------------------------------------------------------
// Categoria: Estrutura — currículo existe, em formato legível, com seções padrão?
// ---------------------------------------------------------------------------
function analisarEstrutura(_candidato: Candidato, texto: string | null, motivo?: MotivoTextoIndisponivel): CategoriaAnalise {
  const base = { chave: 'estrutura', nome: 'Estrutura' }

  if (!texto) {
    return {
      ...base,
      nota: motivo === 'documento_sem_texto' ? 2 : motivo === 'sem_arquivo' ? 0 : 4,
      justificativa: descreverMotivo(motivo),
      recomendacoes: recomendacoesPorMotivo(motivo),
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const secoes: Record<string, string[]> = {
    contato: ['email', '@', 'telefone', 'contato'],
    objetivo: ['objetivo', 'resumo', 'sobre mim', 'perfil profissional'],
    experiencia: ['experiencia', 'experiencia profissional', 'historico profissional'],
    formacao: ['formacao', 'educacao', 'escolaridade', 'graduacao'],
    habilidades: ['habilidades', 'competencias', 'skills', 'tecnologias'],
  }

  const secoesEncontradas = Object.entries(secoes).filter(([, termos]) =>
    termos.some((termo) => termoNoTexto(textoNormalizado, termo)),
  )
  const faltantes = Object.keys(secoes).filter(
    (chave) => !secoesEncontradas.some(([encontrada]) => encontrada === chave),
  )

  const nota = Math.round((secoesEncontradas.length / Object.keys(secoes).length) * 10)

  return {
    ...base,
    nota,
    justificativa:
      faltantes.length === 0
        ? 'Currículo contém as seções básicas esperadas (contato, objetivo, experiência, formação e habilidades).'
        : `Não foi possível identificar claramente: ${faltantes.join(', ')}.`,
    recomendacoes: faltantes.map((secao) => `Inclua uma seção clara de "${secao}" no currículo.`),
  }
}

// ---------------------------------------------------------------------------
// Categoria: Organização — tamanho do texto, presença de marcadores, densidade
// ---------------------------------------------------------------------------
function analisarOrganizacao(texto: string | null): CategoriaAnalise {
  const base = { chave: 'organizacao', nome: 'Organização' }

  if (!texto) {
    return {
      ...base,
      nota: 5,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const palavras = texto.trim().split(/\s+/).filter(Boolean)
  const totalPalavras = palavras.length
  const temMarcadores = /[•●▪‣]|(^|\n)\s*-\s/m.test(texto)
  const comprimentoMedioPalavra = totalPalavras > 0 ? texto.replace(/\s+/g, '').length / totalPalavras : 0

  const pontos: number[] = []
  const recomendacoes: string[] = []

  if (totalPalavras >= 150 && totalPalavras <= 900) {
    pontos.push(4)
  } else if (totalPalavras < 150) {
    pontos.push(1)
    recomendacoes.push('Currículo muito curto — detalhe mais suas experiências e competências.')
  } else {
    pontos.push(2)
    recomendacoes.push('Currículo extenso — para o início de carreira, tente manter em 1 página.')
  }

  if (temMarcadores) {
    pontos.push(3)
  } else {
    recomendacoes.push('Use marcadores (bullet points) para listar atividades e competências.')
  }

  if (comprimentoMedioPalavra >= 3 && comprimentoMedioPalavra <= 9) {
    pontos.push(3)
  } else {
    pontos.push(1)
    recomendacoes.push('O texto extraído ficou com palavras muito fragmentadas — verifique se o PDF não usa layout em colunas ou tabelas, o que atrapalha a leitura por sistemas de ATS reais.')
  }

  return {
    ...base,
    nota: Math.min(10, pontos.reduce((a, b) => a + b, 0)),
    justificativa: `Currículo com aproximadamente ${totalPalavras} palavras${temMarcadores ? ', com uso de marcadores' : ', sem marcadores identificados'}.`,
    recomendacoes,
  }
}

// ---------------------------------------------------------------------------
// Categoria: Palavras-chave — aderência ao vocabulário esperado da área
// ---------------------------------------------------------------------------
function analisarPalavrasChave(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'palavras-chave', nome: 'Palavras-chave' }
  const referencia = competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []

  if (!texto || referencia.length === 0) {
    return {
      ...base,
      nota: 5,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const encontradas = referencia.filter((termo) => termoNoTexto(textoNormalizado, termo))
  const faltantes = referencia.filter((termo) => !encontradas.includes(termo))
  const nota = Math.round((encontradas.length / referencia.length) * 10)

  return {
    ...base,
    nota,
    justificativa: `${encontradas.length} de ${referencia.length} palavras-chave comuns para ${candidato.areaInteresse.nome} aparecem no texto do currículo.`,
    recomendacoes: faltantes.slice(0, 3).map((termo) => `Considere mencionar "${termo}" no currículo, se você tiver essa competência.`),
  }
}

// ---------------------------------------------------------------------------
// Categoria: Tecnologias — o que foi digitado no formulário aparece no currículo?
// ---------------------------------------------------------------------------
function analisarTecnologias(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'tecnologias', nome: 'Tecnologias' }
  const tecnicas = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.TECNICA)

  if (tecnicas.length === 0) {
    return {
      ...base,
      nota: 5,
      justificativa: 'Nenhuma competência técnica foi cadastrada no formulário para comparar.',
      recomendacoes: ['Cadastre suas competências técnicas na etapa de Competências.'],
    }
  }

  if (!texto) {
    return {
      ...base,
      nota: 4,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const presentes = tecnicas.filter((c) => termoNoTexto(textoNormalizado, c.nome))
  const ausentes = tecnicas.filter((c) => !presentes.includes(c))
  const nota = Math.round((presentes.length / tecnicas.length) * 10)

  return {
    ...base,
    nota,
    justificativa: `${presentes.length} de ${tecnicas.length} tecnologias cadastradas no formulário aparecem no texto do currículo.`,
    recomendacoes: ausentes.slice(0, 3).map((c) => `"${c.nome}" está no seu perfil, mas não aparece no currículo — considere incluir.`),
  }
}

// ---------------------------------------------------------------------------
// Categoria: Projetos — evidências de projetos reais no texto
// ---------------------------------------------------------------------------
function analisarProjetos(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'projetos', nome: 'Projetos' }
  const termosProjeto = ['projeto', 'desenvolvi', 'implementei', 'criei', 'github.com', 'repositorio', 'portfolio']
  const temLinkEvidencia = candidato.links.some(
    (l) => l.url.trim() && /github|portf|behance|dribbble/i.test(l.tipo + l.url),
  )

  if (!texto) {
    return {
      ...base,
      nota: temLinkEvidencia ? 5 : 3,
      justificativa: temLinkEvidencia
        ? 'Sem texto do currículo, mas há um link de evidência de projetos cadastrado (GitHub/portfólio).'
        : 'Sem conteúdo de texto e sem link de projetos cadastrado.',
      recomendacoes: temLinkEvidencia ? [] : ['Adicione um link de GitHub ou portfólio na etapa de Links.'],
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const ocorrencias = contarOcorrencias(textoNormalizado, termosProjeto)
  const nota = Math.min(10, ocorrencias * 2 + (temLinkEvidencia ? 3 : 0))

  return {
    ...base,
    nota,
    justificativa:
      ocorrencias > 0
        ? `O currículo menciona projetos ou trabalhos práticos (${ocorrencias} indício(s) encontrados).`
        : 'Não foram encontradas menções claras a projetos práticos no texto.',
    recomendacoes:
      ocorrencias === 0 ? ['Descreva ao menos um projeto real com o problema resolvido e as tecnologias usadas.'] : [],
  }
}

// ---------------------------------------------------------------------------
// Categoria: Formação — instituições/cursos do formulário aparecem no texto?
// ---------------------------------------------------------------------------
function analisarFormacao(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'formacao', nome: 'Formação' }

  if (candidato.escolaridades.length === 0) {
    return {
      ...base,
      nota: 5,
      justificativa: 'Nenhuma formação cadastrada no formulário para comparar.',
      recomendacoes: [],
    }
  }

  if (!texto) {
    return {
      ...base,
      nota: 4,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const presentes = candidato.escolaridades.filter(
    (e) => termoNoTexto(textoNormalizado, e.instituicao) || termoNoTexto(textoNormalizado, e.curso),
  )
  const nota = Math.round((presentes.length / candidato.escolaridades.length) * 10)

  return {
    ...base,
    nota,
    justificativa: `${presentes.length} de ${candidato.escolaridades.length} formação(ões) cadastradas aparecem no currículo.`,
    recomendacoes: nota < 10 ? ['Confirme se todas as formações relevantes estão descritas no currículo.'] : [],
  }
}

// ---------------------------------------------------------------------------
// Categoria: Idiomas — idiomas do formulário aparecem no texto?
// ---------------------------------------------------------------------------
function analisarIdiomas(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'idiomas', nome: 'Idiomas' }

  if (candidato.idiomas.length === 0) {
    return {
      ...base,
      nota: 5,
      justificativa: 'Nenhum idioma adicional cadastrado no formulário.',
      recomendacoes: [],
    }
  }

  if (!texto) {
    return {
      ...base,
      nota: 4,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const textoNormalizado = normalizarTexto(texto)
  const presentes = candidato.idiomas.filter((i) => termoNoTexto(textoNormalizado, i.nome))
  const nota = Math.round((presentes.length / candidato.idiomas.length) * 10)

  return {
    ...base,
    nota,
    justificativa: `${presentes.length} de ${candidato.idiomas.length} idioma(s) cadastrados aparecem no currículo.`,
    recomendacoes: nota < 10 ? ['Inclua uma seção de idiomas no currículo, com o nível de cada um.'] : [],
  }
}

// ---------------------------------------------------------------------------
// Categoria: Links — o currículo traz links/contato diretamente no texto?
// ---------------------------------------------------------------------------
function analisarLinks(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'links', nome: 'Links' }

  if (!texto) {
    return {
      ...base,
      nota: 3,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const temUrl = /https?:\/\/[^\s]+/i.test(texto)
  const temEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/i.test(texto)
  const linksCadastrados = candidato.links.filter((l) => l.url.trim()).length

  const pontos = (temUrl ? 5 : 0) + (temEmail ? 5 : 0)
  const recomendacoes: string[] = []
  if (!temEmail) recomendacoes.push('Inclua seu e-mail diretamente no currículo, não apenas no formulário.')
  if (!temUrl && linksCadastrados > 0) recomendacoes.push('Inclua seus links (LinkedIn/GitHub/portfólio) diretamente no texto do currículo.')

  return {
    ...base,
    nota: pontos,
    justificativa:
      temUrl && temEmail
        ? 'Currículo traz e-mail e ao menos um link diretamente no texto.'
        : 'Currículo não traz claramente e-mail e/ou link de contato no texto.',
    recomendacoes,
  }
}

// ---------------------------------------------------------------------------
// Categoria: Legibilidade — o texto extraído parece "limpo" (não corrompido)?
// ---------------------------------------------------------------------------
function analisarLegibilidade(texto: string | null): CategoriaAnalise {
  const base = { chave: 'legibilidade', nome: 'Legibilidade' }

  if (!texto) {
    return {
      ...base,
      nota: 5,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const totalCaracteres = texto.length
  const caracteresAlfabeticos = (texto.match(/[a-zA-ZÀ-ÿ]/g) ?? []).length
  const proporcaoAlfabetica = totalCaracteres > 0 ? caracteresAlfabeticos / totalCaracteres : 0
  const totalPalavras = texto.trim().split(/\s+/).filter(Boolean).length

  const recomendacoes: string[] = []
  let nota = 10

  if (proporcaoAlfabetica < 0.6) {
    nota -= 5
    recomendacoes.push('O texto extraído tem muitos símbolos/números soltos — layouts com tabelas ou colunas costumam causar isso e prejudicam a leitura por sistemas de ATS.')
  }
  if (totalPalavras < 80) {
    nota -= 3
    recomendacoes.push('Pouco texto foi extraído — verifique se o PDF não é uma imagem escaneada (texto não selecionável).')
  }

  return {
    ...base,
    nota: Math.max(0, nota),
    justificativa:
      proporcaoAlfabetica >= 0.6
        ? 'O texto extraído do currículo está bem formado, sem sinais de corrupção no layout.'
        : 'O texto extraído apresenta sinais de que o layout do PDF pode atrapalhar a leitura automática.',
    recomendacoes,
  }
}

// ---------------------------------------------------------------------------
// Categoria: Clareza — resumo/objetivo no início, baixo uso de 1ª pessoa
// ---------------------------------------------------------------------------
function analisarClareza(candidato: Candidato, texto: string | null): CategoriaAnalise {
  const base = { chave: 'clareza', nome: 'Clareza' }

  if (!texto) {
    return {
      ...base,
      nota: 5,
      justificativa: JUSTIFICATIVA_SEM_TEXTO_GENERICA,
      recomendacoes: [],
    }
  }

  const inicio = normalizarTexto(texto.slice(0, 300))
  const termosResumo = ['objetivo', 'resumo', 'sobre mim', 'perfil', normalizarTexto(candidato.areaInteresse.nome)]
  const temResumoNoInicio = termosResumo.some((termo) => inicio.includes(termo))

  const textoNormalizado = normalizarTexto(texto)
  const totalPalavras = texto.trim().split(/\s+/).filter(Boolean).length || 1
  const pronomes = (textoNormalizado.match(/\b(eu|meu|minha|meus|minhas)\b/g) ?? []).length
  const densidadePronomes = pronomes / totalPalavras

  const recomendacoes: string[] = []
  let nota = 5

  if (temResumoNoInicio) {
    nota += 3
  } else {
    recomendacoes.push('Adicione um resumo profissional de 2-3 linhas logo no início do currículo.')
  }

  if (densidadePronomes < 0.01) {
    nota += 2
  } else {
    nota -= 2
    recomendacoes.push('Evite escrever em primeira pessoa ("eu fiz", "meu projeto") — prefira frases diretas com verbos de ação.')
  }

  return {
    ...base,
    nota: Math.max(0, Math.min(10, nota)),
    justificativa: temResumoNoInicio
      ? 'O currículo apresenta um resumo/objetivo logo no início.'
      : 'Não foi identificado um resumo profissional claro no início do currículo.',
    recomendacoes,
  }
}

function gerarResumo(notaGeral: number, texto: string | null, motivo?: MotivoTextoIndisponivel): string {
  if (!texto) {
    return `${descreverMotivo(motivo)} A nota abaixo é uma estimativa baseada apenas nos dados do formulário — menos precisa do que uma análise com o conteúdo real do currículo.`
  }
  if (notaGeral >= 80) return 'Currículo bem estruturado e com boa compatibilidade com leitura automática (ATS).'
  if (notaGeral >= 60) return 'Currículo com boa base, mas com pontos específicos para ajustar antes de aplicar em vagas.'
  if (notaGeral >= 40) return 'Currículo com lacunas importantes de estrutura ou conteúdo para sistemas de ATS.'
  return 'Currículo precisa de ajustes significativos para ter boa leitura por sistemas de ATS.'
}

/**
 * Implementação heurística (v1) do CareerAnalyzer para compatibilidade com ATS.
 * Estratégia concreta do Strategy Pattern — pode ser substituída futuramente por
 * uma implementação com IA (ex: ClaudeAtsAnalyzer) sem que nenhum componente
 * ou fluxo precise mudar, pois ambos implementam a mesma interface CareerAnalyzer.
 */
export class HeuristicAtsAnalyzer implements CareerAnalyzer<AtsAnalyzerInput, AtsAnalysisResult> {
  readonly nome = 'ats-heuristico-v1'

  async analisar({ candidato, textoCurriculo, motivoTextoIndisponivel }: AtsAnalyzerInput): Promise<AtsAnalysisResult> {
    const categorias: CategoriaAnalise[] = [
      analisarEstrutura(candidato, textoCurriculo, motivoTextoIndisponivel),
      analisarOrganizacao(textoCurriculo),
      analisarPalavrasChave(candidato, textoCurriculo),
      analisarTecnologias(candidato, textoCurriculo),
      analisarProjetos(candidato, textoCurriculo),
      analisarFormacao(candidato, textoCurriculo),
      analisarIdiomas(candidato, textoCurriculo),
      analisarLinks(candidato, textoCurriculo),
      analisarLegibilidade(textoCurriculo),
      analisarClareza(candidato, textoCurriculo),
    ]

    const notaGeral = Math.round(
      (categorias.reduce((soma, categoria) => soma + categoria.nota, 0) / categorias.length) * 10,
    )

    return {
      notaGeral,
      categorias,
      resumo: gerarResumo(notaGeral, textoCurriculo, motivoTextoIndisponivel),
      fonte: 'heuristico',
      geradoEm: new Date().toISOString(),
      baseadoEmTexto: textoCurriculo !== null,
      motivoTextoIndisponivel: textoCurriculo === null ? motivoTextoIndisponivel : undefined,
    }
  }
}
