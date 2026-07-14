import type {
  Candidato,
  AnalisePerfil,
  CategoriaPontuacaoDetalhe,
  ChavePontuacaoDetalhes,
  ItemChecklistPerfil,
  PlanoAcao,
  PontuacaoDetalhes,
} from '../types/models'
import { NomeArea, StatusCurso, TipoCompetencia } from '../types/enums'
import { competenciasReferenciaPorArea } from '../data/competenciasReferencia'
import { calcularDuracaoMeses } from '../utils/formatters'
import { gerarId } from '../utils/id'
import type { GithubAnalise, ContextoExterno } from '../types/externo'
import { categoriasPontuacao } from './benchmarkService'
import { inferirNivelAtual, rotuloNivelAtual } from './nivelAtualService'
import { inferirMaiorNivelEscolaridade, rotuloMaiorNivelEscolaridade } from './escolaridadeService'
import { modalidadePreferidaAtiva, modalidadesAceitasAtivas } from './modalidadePreferenciaService'

export type { ContextoExterno }

interface Pontuacao {
  total: number
  detalhes: PontuacaoDetalhes
}

type AreaEvidencia = 'tecnologia' | 'design' | 'saude' | 'gestao' | 'outra'

const MAXIMOS: Record<ChavePontuacaoDetalhes, number> = {
  competenciasRelevantes: 30,
  experienciaEvidencias: 25,
  projetosEntregas: 20,
  consistenciaPerfil: 15,
  curriculoApresentacao: 10,
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function deduplicarTextos(valores: string[]): string[] {
  const vistos = new Set<string>()
  return valores.filter((valor) => {
    const chave = normalizar(valor.trim())
    if (!chave || vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })
}

function limitar(pontos: number, maximo: number): number {
  return Math.max(0, Math.min(maximo, Math.round(pontos)))
}

function categoria(
  chave: ChavePontuacaoDetalhes,
  titulo: string,
  pontos: number,
  justificativa: string,
  evidencias: string[],
  comoMelhorar: string[],
): CategoriaPontuacaoDetalhe {
  return {
    chave,
    titulo,
    pontos: limitar(pontos, MAXIMOS[chave]),
    maximo: MAXIMOS[chave],
    justificativa,
    evidencias: deduplicarTextos(evidencias).slice(0, 6),
    comoMelhorar: deduplicarTextos(comoMelhorar).slice(0, 4),
  }
}

function textoObjetivo(candidato: Candidato): string {
  if (candidato.objetivoProfissional.modo === 'definido') {
    return candidato.objetivoProfissional.opcoes.map((opcao) => opcao.cargoOuArea).join(' ')
  }
  return candidato.objetivoProfissional.preferenciasExploracao.interesses.join(' ')
}

function areaEvidencia(candidato: Candidato): AreaEvidencia {
  const texto = normalizar(`${candidato.areaInteresse.nome} ${candidato.areaInteresse.nomePersonalizado ?? ''} ${textoObjetivo(candidato)}`)
  if (candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS || /tecnologia|dados|desenvolv|software|front|back|dev/.test(texto)) return 'tecnologia'
  if (/design|ux|ui|produto visual|visual/.test(texto)) return 'design'
  if (candidato.areaInteresse.nome === NomeArea.SAUDE || /saude|saúde|clinica|clínica|paciente|fisioterapia|enfermagem/.test(texto)) return 'saude'
  if (candidato.areaInteresse.nome === NomeArea.GESTAO_NEGOCIOS || /rh|recurso|administra|gestao|gestão|negocio|negócio|financeiro/.test(texto)) return 'gestao'
  return 'outra'
}

function linkTemTipoOuDominio(candidato: Candidato, termos: string[]): boolean {
  return candidato.links.some((link) => {
    const tipo = normalizar(link.tipo)
    const url = normalizar(link.url)
    return Boolean(link.url.trim()) && termos.some((termo) => tipo.includes(termo) || url.includes(termo))
  })
}

function temLinkedIn(candidato: Candidato): boolean {
  return linkTemTipoOuDominio(candidato, ['linkedin'])
}

function temGithub(candidato: Candidato): boolean {
  return linkTemTipoOuDominio(candidato, ['github'])
}

function temPortfolio(candidato: Candidato): boolean {
  return linkTemTipoOuDominio(candidato, ['portfolio', 'portf', 'behance', 'dribbble'])
}

function obterPlataformasEvidencia(candidato: Candidato): string {
  const area = areaEvidencia(candidato)
  if (area === 'tecnologia') return 'GitHub, deploy ou portfólio técnico'
  if (area === 'design') return 'Behance, Dribbble ou portfólio visual'
  if (area === 'saude') return 'atividades práticas, extensão, registro ou formação aplicada'
  if (area === 'gestao') return 'LinkedIn, projetos, cases ou estudos aplicados'
  return 'portfólio, projetos ou links profissionais relevantes'
}

function temEvidenciaPublicaAdequada(candidato: Candidato, github?: GithubAnalise): boolean {
  const area = areaEvidencia(candidato)
  if (area === 'tecnologia') return temGithub(candidato) || temPortfolio(candidato) || Boolean(github?.encontrado && github.totalRepositoriosPublicos > 0)
  if (area === 'design') return temPortfolio(candidato)
  if (area === 'saude') return candidato.escolaridades.length > 0 || candidato.experiencias.length > 0 || temPortfolio(candidato)
  if (area === 'gestao') return temLinkedIn(candidato) || temPortfolio(candidato) || candidato.experiencias.length > 0
  return temPortfolio(candidato) || temLinkedIn(candidato) || candidato.experiencias.length > 0
}

function candidatoEmInicioDeCarreira(candidato: Candidato): boolean {
  const nivelAtual = inferirNivelAtual(candidato)
  return candidato.escolaridades.some((e) => e.status === StatusCurso.CURSANDO)
    || nivelAtual === 'estagiario'
    || nivelAtual === 'aprendiz'
    || nivelAtual === 'primeiro_emprego'
    || candidato.objetivoProfissional.modo === 'exploracao'
}

function referenciasDaArea(candidato: Candidato): string[] {
  const referencia = competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []
  const objetivo = textoObjetivo(candidato)
    .split(/[\s,;/|-]+/)
    .filter((parte) => parte.trim().length > 2)
  return deduplicarTextos([...referencia, ...objetivo])
}

function competenciaEhRelevante(nome: string, referencias: string[], contexto?: ContextoExterno): boolean {
  const competencia = normalizar(nome)
  if (referencias.some((ref) => {
    const normalizada = normalizar(ref)
    return competencia.includes(normalizada) || normalizada.includes(competencia)
  })) return true
  if (contexto?.github?.linguagens.some((linguagem) => normalizar(linguagem) === competencia)) return true
  return Object.values(contexto?.competenciasPorCertificado ?? {}).some((lista) =>
    lista.some((item) => normalizar(item) === competencia),
  )
}

function calcularCompetenciasRelevantes(candidato: Candidato, contexto?: ContextoExterno): CategoriaPontuacaoDetalhe {
  const referencias = referenciasDaArea(candidato)
  const competencias = deduplicarTextos(candidato.competencias.map((competencia) => competencia.nome))
  const tecnicas = competencias.filter((nome) =>
    candidato.competencias.some((competencia) => normalizar(competencia.nome) === normalizar(nome) && competencia.tipo === TipoCompetencia.TECNICA),
  )
  const comportamentais = competencias.filter((nome) =>
    candidato.competencias.some((competencia) => normalizar(competencia.nome) === normalizar(nome) && competencia.tipo === TipoCompetencia.COMPORTAMENTAL),
  )
  const relevantes = competencias.filter((nome) => competenciaEhRelevante(nome, referencias, contexto))
  const evidencias = [
    relevantes.length > 0 ? `${relevantes.length} competência(s) alinhada(s) ao objetivo ou área.` : '',
    tecnicas.length > 0 ? `${tecnicas.length} competência(s) técnica(s) declarada(s).` : '',
    comportamentais.length > 0 ? `${comportamentais.length} competência(s) comportamental(is) declarada(s).` : '',
    contexto?.github?.linguagens.length ? `GitHub reforça: ${contexto.github.linguagens.slice(0, 3).join(', ')}.` : '',
  ].filter(Boolean)

  const pontos = Math.min(relevantes.length * 4, 18)
    + Math.min(tecnicas.length * 1.5, 5)
    + Math.min(comportamentais.length * 1.5, 4)
    + (tecnicas.length > 0 && comportamentais.length > 0 ? 2 : 0)
    + (contexto?.github?.linguagens.length || Object.keys(contexto?.competenciasPorCertificado ?? {}).length ? 1 : 0)

  return categoria(
    'competenciasRelevantes',
    'Competências relevantes',
    pontos,
    competencias.length === 0
      ? 'Ainda há poucas competências declaradas para avaliar aderência com segurança.'
      : 'A nota considera relevância, variedade e evidências; duplicatas e habilidades sem relação não inflam o score.',
    evidencias,
    ['Priorizar competências centrais do objetivo.', 'Evitar listas longas sem evidência prática.', 'Conectar habilidades a projetos, experiências ou certificados relevantes.'],
  )
}

function experienciaRelacionada(expTexto: string, candidato: Candidato): boolean {
  const texto = normalizar(expTexto)
  return referenciasDaArea(candidato).some((ref) => {
    const normalizada = normalizar(ref)
    return normalizada.length > 3 && texto.includes(normalizada)
  })
}

function experienciaTemTransferiveis(expTexto: string): boolean {
  const texto = normalizar(expTexto)
  return /atendimento|cliente|comunic|lideran|organiz|planej|negocia|conflito|document|meta|treinamento|equipe|analise|análise|resolver|projeto/.test(texto)
}

function mencionaProjeto(texto: string): boolean {
  return /projeto|portfolio|portfólio|case|campanha|extensao|extensão|prototipo|protótipo|publicado|deploy|github|behance|dribbble/.test(normalizar(texto))
}

function calcularExperienciaEvidencias(candidato: Candidato, contexto?: ContextoExterno): CategoriaPontuacaoDetalhe {
  const inicio = candidatoEmInicioDeCarreira(candidato)
  const evidencias: string[] = []
  let pontos = 0

  if (candidato.experiencias.length > 0) {
    const meses = candidato.experiencias.reduce(
      (soma, exp) => soma + calcularDuracaoMeses(exp.dataInicio, exp.empregoAtual ? undefined : exp.dataFim || exp.dataInicio),
      0,
    )
    const diretas = candidato.experiencias.filter((exp) => experienciaRelacionada(`${exp.cargo} ${exp.descricao}`, candidato))
    const transferiveis = candidato.experiencias.filter((exp) => !experienciaRelacionada(`${exp.cargo} ${exp.descricao}`, candidato) && experienciaTemTransferiveis(`${exp.cargo} ${exp.descricao}`))
    pontos += Math.min(diretas.length * 7, 14)
    pontos += Math.min(transferiveis.length * 3, 6)
    pontos += Math.min(meses / 6, 5)
    evidencias.push(`${candidato.experiencias.length} experiência(s) cadastrada(s).`)
    if (diretas.length > 0) evidencias.push(`${diretas.length} experiência(s) com relação direta ou textual com a área.`)
    if (transferiveis.length > 0) evidencias.push(`${transferiveis.length} experiência(s) com competências transferíveis identificáveis.`)
  } else if (inicio) {
    pontos += 8
    evidencias.push('Perfil de início de carreira não foi tratado como ausência total de evidência.')
  }

  if (candidato.escolaridades.some((e) => e.status === StatusCurso.CURSANDO)) {
    pontos += 4
    evidencias.push('Formação em andamento pode substituir parcialmente a falta de vínculo formal.')
  }
  if (temEvidenciaPublicaAdequada(candidato, contexto?.github)) {
    pontos += inicio ? 5 : 3
    evidencias.push(`Há evidência prática adequada à área (${obterPlataformasEvidencia(candidato)}).`)
  }

  return categoria(
    'experienciaEvidencias',
    'Experiência e evidências práticas',
    pontos,
    'A dimensão pondera experiência direta, relacionada e transferível; não pontua apenas por meses ou quantidade de cargos.',
    evidencias,
    ['Descrever responsabilidades e resultados nas experiências.', 'Adicionar projetos acadêmicos, voluntários ou autônomos quando não houver experiência formal.', 'Explicar competências transferíveis na transição de carreira.'],
  )
}

function calcularProjetosEntregas(candidato: Candidato, contexto?: ContextoExterno): CategoriaPontuacaoDetalhe {
  const area = areaEvidencia(candidato)
  const evidencias: string[] = []
  let pontos = 0

  if (temPortfolio(candidato)) {
    pontos += area === 'design' ? 10 : 7
    evidencias.push(area === 'design' ? 'Portfólio/Behance/Dribbble reconhecido como evidência principal para Design.' : 'Portfólio ou link profissional cadastrado.')
  }
  if (area === 'tecnologia' && (temGithub(candidato) || contexto?.github?.encontrado)) {
    pontos += 5
    evidencias.push('GitHub considerado como evidência relevante para Tecnologia.')
    if (contexto?.github?.totalRepositoriosPublicos) {
      pontos += Math.min(contexto.github.totalRepositoriosPublicos, 4)
      evidencias.push(`${contexto.github.totalRepositoriosPublicos} repositório(s) público(s) no GitHub.`)
    }
    if (contexto?.github?.temReadmePerfil) {
      pontos += 1
      evidencias.push('README de perfil no GitHub.')
    }
  }
  if (candidato.experiencias.some((exp) => mencionaProjeto(`${exp.cargo} ${exp.descricao}`))) {
    pontos += 4
    evidencias.push('Experiências mencionam projetos, cases ou entregas.')
  }
  if (candidato.escolaridades.some((e) => e.status === StatusCurso.CURSANDO)) {
    pontos += 2
    evidencias.push('Formação em andamento pode gerar projetos acadêmicos ou de extensão.')
  }
  return categoria(
    'projetosEntregas',
    'Projetos e entregas demonstráveis',
    pontos,
    area === 'tecnologia'
      ? 'Para tecnologia, GitHub e portfólio técnico contam como evidências fortes.'
      : 'A evidência foi adaptada à área; GitHub não é exigido fora de contextos técnicos.',
    evidencias,
    ['Publicar pelo menos uma entrega revisável.', 'Documentar objetivo, ferramentas, resultados e contribuição individual.', `Usar evidências adequadas à área: ${obterPlataformasEvidencia(candidato)}.`],
  )
}

function calcularConsistenciaPerfil(candidato: Candidato, contexto?: ContextoExterno): CategoriaPontuacaoDetalhe {
  const evidencias: string[] = []
  let pontos = candidato.objetivoProfissional.modo === 'exploracao' ? 5 : 0

  if (candidato.objetivoProfissional.modo === 'definido' && candidato.objetivoProfissional.opcoes.some((opcao) => opcao.cargoOuArea.trim())) {
    pontos += 4
    evidencias.push('Objetivo profissional definido sem repetir localização.')
  } else if (candidato.objetivoProfissional.modo === 'exploracao') {
    evidencias.push('Modo exploração avaliado pela consistência interna dos dados, não pela ausência de cargo.')
  }
  if (calcularCompetenciasRelevantes(candidato, contexto).pontos >= 12) {
    pontos += 4
    evidencias.push('Competências têm relação perceptível com área ou objetivo.')
  }
  if (calcularExperienciaEvidencias(candidato, contexto).pontos >= 10 || calcularProjetosEntregas(candidato, contexto).pontos >= 8) {
    pontos += 4
    evidencias.push('Experiências ou projetos sustentam a direção profissional.')
  }
  if (temLinkedIn(candidato) || temPortfolio(candidato) || temGithub(candidato)) {
    pontos += 2
    evidencias.push('Links profissionais ajudam a confirmar a narrativa do perfil.')
  }

  return categoria(
    'consistenciaPerfil',
    'Consistência do perfil profissional',
    pontos,
    'A dimensão observa coerência entre objetivo, competências, experiências, formação, projetos e links.',
    evidencias,
    ['Alinhar o resumo profissional ao objetivo.', 'Remover sinais contraditórios ou explicar transição de carreira.', 'Conectar formação, experiências e projetos à mesma narrativa.'],
  )
}

function calcularCurriculoApresentacao(candidato: Candidato): CategoriaPontuacaoDetalhe {
  const evidencias: string[] = []
  let pontos = 1

  if (candidato.nome.trim() && candidato.email.trim() && candidato.telefone.trim()) {
    pontos += 2
    evidencias.push('Contato principal preenchido.')
  }
  if (candidato.cidade.trim() && candidato.estado.trim()) {
    pontos += 1
    evidencias.push('Cidade e estado estruturados no cadastro.')
  }
  if (candidato.competencias.length > 0) {
    pontos += 2
    evidencias.push('Dados estruturados de competências disponíveis.')
  }
  if (candidato.experiencias.length > 0 || candidato.escolaridades.length > 0) {
    pontos += 2
    evidencias.push('Formação ou experiência estruturada disponível.')
  }
  if (candidato.links.some((link) => link.url.trim())) {
    pontos += 1
    evidencias.push('Links profissionais cadastrados.')
  }
  if (candidato.curriculo) {
    pontos += 1
    evidencias.push('Currículo anexado melhora a confiança da análise.')
  } else {
    evidencias.push('Sem currículo anexado; o score usa dados estruturados do formulário.')
  }

  return categoria(
    'curriculoApresentacao',
    'Currículo e apresentação profissional',
    pontos,
    'Currículo anexado não é binário: dados estruturados suficientes mantêm a dimensão avaliada.',
    evidencias,
    ['Anexar currículo quando quiser refinar a análise.', 'Manter contato, formação, experiências e links coerentes.', 'Evitar divergência entre formulário e currículo.'],
  )
}

function calcularPontuacao(candidato: Candidato, contexto?: ContextoExterno): Pontuacao {
  const detalhes: PontuacaoDetalhes = {
    competenciasRelevantes: calcularCompetenciasRelevantes(candidato, contexto),
    experienciaEvidencias: calcularExperienciaEvidencias(candidato, contexto),
    projetosEntregas: calcularProjetosEntregas(candidato, contexto),
    consistenciaPerfil: calcularConsistenciaPerfil(candidato, contexto),
    curriculoApresentacao: calcularCurriculoApresentacao(candidato),
  }
  const totalPossivel = categoriasPontuacao.reduce((soma, categoriaPontuacao) => soma + categoriaPontuacao.maximo, 0)
  const total = categoriasPontuacao.reduce((soma, categoriaPontuacao) => soma + detalhes[categoriaPontuacao.chave].pontos, 0)
  if (totalPossivel !== 100) {
    throw new Error(`Modelo de pontuação inválido: esperado 100 pontos, recebido ${totalPossivel}.`)
  }
  return { total: limitar(total, 100), detalhes }
}

function identificarCompetenciasFaltantes(candidato: Candidato, contexto?: ContextoExterno): string[] {
  const referencia = competenciasReferenciaPorArea[candidato.areaInteresse.nome] ?? []
  const nomesAtuais = new Set(candidato.competencias.map((c) => normalizar(c.nome)))

  contexto?.github?.linguagens.forEach((linguagem) => nomesAtuais.add(normalizar(linguagem)))
  Object.values(contexto?.competenciasPorCertificado ?? {}).forEach((lista) =>
    lista.forEach((competencia) => nomesAtuais.add(normalizar(competencia))),
  )

  return referencia.filter((c) => !nomesAtuais.has(normalizar(c))).slice(0, 5)
}

function certificadoRelevante(candidato: Candidato, contexto?: ContextoExterno): boolean {
  const referencias = referenciasDaArea(candidato)
  return candidato.certificados.some((certificado) =>
    referencias.some((ref) => normalizar(certificado.titulo).includes(normalizar(ref)))
      || (contexto?.competenciasPorCertificado?.[certificado.idCertificado]?.length ?? 0) > 0,
  )
}

function gerarChecklistPerfil(candidato: Candidato, contexto?: ContextoExterno): ItemChecklistPerfil[] {
  const area = areaEvidencia(candidato)
  const objetivoEstagio = candidato.objetivoProfissional.modo === 'definido'
    && candidato.objetivoProfissional.opcoes.some((opcao) => normalizar(opcao.nivelAlvo ?? '').includes('estagio'))
  const temFormacao = candidato.escolaridades.length > 0
  const maiorNivel = inferirMaiorNivelEscolaridade(candidato.escolaridades)
  const maiorNivelRotulo = rotuloMaiorNivelEscolaridade(maiorNivel)
  const temCertificadoRelevante = certificadoRelevante(candidato, contexto)
  const temIdiomaEstrangeiro = candidato.idiomas.some((idioma) => !/portugu[eê]s/i.test(idioma.nome))
  const githubAplicavel = area === 'tecnologia'
  const portfolioRecomendado = area === 'tecnologia' || area === 'design'
  const registroObrigatorio = area === 'saude'
  const preferida = modalidadePreferidaAtiva(candidato)
  const aceitas = modalidadesAceitasAtivas(candidato)

  return [
    {
      id: 'escolaridade',
      titulo: 'Escolaridade',
      importancia: temFormacao ? 'recomendado' : 'opcional',
      status: temFormacao ? 'atendido' : 'opcional',
      explicacao: maiorNivel === 'nao_informado'
        ? 'Não informado; não reduz o score, mas pode limitar a precisão da compatibilidade.'
        : maiorNivel === 'superior_em_andamento' && objetivoEstagio
          ? 'Ensino Superior em andamento; adequado para vagas de estágio.'
          : `${maiorNivelRotulo}; compatível como informação factual do perfil, sem nota parcial de escolaridade.`,
    },
    {
      id: 'certificados',
      titulo: 'Certificados',
      importancia: 'opcional',
      status: temCertificadoRelevante ? 'atendido' : 'opcional',
      explicacao: temCertificadoRelevante
        ? 'Certificado relevante aparece como diferencial de aprendizado, sem substituir experiência ou projeto.'
        : 'Certificados podem fortalecer seu perfil, mas não são obrigatórios para uma boa avaliação.',
    },
    {
      id: 'idiomas',
      titulo: 'Idiomas',
      importancia: area === 'tecnologia' || area === 'gestao' ? 'recomendado' : 'opcional',
      status: temIdiomaEstrangeiro ? 'atendido' : 'opcional',
      explicacao: temIdiomaEstrangeiro
        ? 'Idioma informado pode ampliar oportunidades quando a vaga exigir ou valorizar esse requisito.'
        : 'Ausência de segundo idioma não reduz o score global automaticamente; vagas específicas ainda podem exigir idioma.',
    },
    {
      id: 'curriculo',
      titulo: 'Currículo',
      importancia: 'recomendado',
      status: candidato.curriculo ? 'atendido' : 'opcional',
      explicacao: candidato.curriculo
        ? 'Currículo anexado melhora a confiança e permite cruzar dados com o formulário.'
        : 'O formulário contém dados estruturados suficientes; anexar currículo melhora a análise, mas não zera a dimensão.',
    },
    {
      id: 'linkedin',
      titulo: 'LinkedIn',
      importancia: area === 'tecnologia' || area === 'gestao' ? 'recomendado' : 'opcional',
      status: temLinkedIn(candidato) ? 'atendido' : 'opcional',
      explicacao: temLinkedIn(candidato)
        ? 'LinkedIn cadastrado como apoio de apresentação profissional.'
        : 'Pode ajudar na visibilidade, mas não é tratado como requisito universal.',
    },
    {
      id: 'github',
      titulo: 'GitHub',
      importancia: githubAplicavel ? 'recomendado' : 'nao_aplicavel',
      status: githubAplicavel ? (temGithub(candidato) || contexto?.github?.encontrado ? 'atendido' : 'opcional') : 'nao_aplicavel',
      explicacao: githubAplicavel
        ? 'GitHub é recomendado para tecnologia quando há projetos técnicos revisáveis.'
        : 'Esta evidência não é esperada para sua área e não gera ponto negativo.',
    },
    {
      id: 'portfolio',
      titulo: 'Portfólio',
      importancia: portfolioRecomendado ? 'recomendado' : 'opcional',
      status: temPortfolio(candidato) ? 'atendido' : 'opcional',
      explicacao: temPortfolio(candidato)
        ? 'Portfólio reconhecido como evidência pública adequada ao perfil.'
        : portfolioRecomendado
          ? `Recomendado para comprovar entregas: ${obterPlataformasEvidencia(candidato)}.`
          : 'Opcional para esta área, mas pode reforçar cases ou resultados.',
    },
    {
      id: 'registro_profissional',
      titulo: 'Registro profissional/licença',
      importancia: registroObrigatorio ? 'obrigatorio' : 'nao_aplicavel',
      status: registroObrigatorio ? 'pendente' : 'nao_aplicavel',
      explicacao: registroObrigatorio
        ? 'Pode ser obrigatório em determinadas vagas de saúde; a exigência continua sendo avaliada na compatibilidade da vaga.'
        : 'Não aplicável como requisito geral para o objetivo informado.',
    },
    {
      id: 'formacao_complementar',
      titulo: 'Formação complementar',
      importancia: 'opcional',
      status: candidato.certificados.length > 0 ? 'atendido' : 'opcional',
      explicacao: 'Cursos complementares reforçam aprendizado, mas quantidade de certificados não mede empregabilidade por si só.',
    },
    {
      id: 'projetos_evidencias',
      titulo: 'Projetos/evidências',
      importancia: 'recomendado',
      status: temEvidenciaPublicaAdequada(candidato, contexto?.github) ? 'atendido' : 'opcional',
      explicacao: temEvidenciaPublicaAdequada(candidato, contexto?.github)
        ? 'Há evidência prática compatível com a área.'
        : `Adicionar evidências ajuda recrutadores a avaliar entregas reais: ${obterPlataformasEvidencia(candidato)}.`,
    },
    {
      id: 'modalidade_localizacao',
      titulo: 'Modalidade/localização',
      importancia: 'recomendado',
      status: 'atendido',
      explicacao: [
        preferida ? `Modalidade preferida: ${preferida}.` : `Modalidades aceitas: ${aceitas.join(', ') || 'não informadas'}.`,
        candidato.disponibilidadeMudanca === 'sim'
          ? 'Disponibilidade para mudança informada.'
          : candidato.disponibilidadeMudanca === 'depende'
            ? 'Disponibilidade para mudança depende da oportunidade.'
            : candidato.disponibilidadeMudanca === 'nao'
              ? 'Aceita vagas presenciais/híbridas apenas compatíveis com sua cidade.'
              : 'Disponibilidade para mudança não informada.',
      ].join(' '),
    },
  ]
}
function gerarPontosFortes(candidato: Candidato, pontuacao: Pontuacao, contexto?: ContextoExterno): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.competenciasRelevantes.pontos >= 18) {
    pontos.push('Competências declaradas têm boa relação com o objetivo profissional.')
  }
  if (pontuacao.detalhes.experienciaEvidencias.pontos >= 14) {
    pontos.push('Experiências ou evidências práticas sustentam a candidatura sem depender apenas de tempo de carreira.')
  } else if (candidatoEmInicioDeCarreira(candidato) && pontuacao.detalhes.experienciaEvidencias.pontos >= 10) {
    pontos.push('Perfil de início de carreira avaliado com peso justo para formação, projetos e evidências práticas.')
  }
  if (pontuacao.detalhes.projetosEntregas.pontos >= 10) {
    pontos.push(`Há entregas demonstráveis adequadas à área (${obterPlataformasEvidencia(candidato)}).`)
  }
  const github = contexto?.github
  if (areaEvidencia(candidato) === 'tecnologia' && github?.encontrado && github.totalRepositoriosPublicos > 0) {
    pontos.push(`GitHub com ${github.totalRepositoriosPublicos} repositório(s) público(s) reforça evidências técnicas.`)
  }
  if (certificadoRelevante(candidato, contexto)) {
    pontos.push('Certificado relevante aparece como diferencial, sem substituir experiência ou projetos.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil em construção, com potencial claro de evolução rápida.')
  }
  return pontos
}

function gerarPontosMelhorar(pontuacao: Pontuacao, candidato: Candidato): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.competenciasRelevantes.pontos < 12) {
    pontos.push('Declarar competências mais específicas e relacionadas ao objetivo profissional.')
  }
  if (pontuacao.detalhes.projetosEntregas.pontos < 8) {
    pontos.push(`Adicionar evidências públicas adequadas à área (${obterPlataformasEvidencia(candidato)}).`)
  }
  if (pontuacao.detalhes.experienciaEvidencias.pontos < 10 && !candidatoEmInicioDeCarreira(candidato)) {
    pontos.push('Descrever melhor responsabilidades, entregas e resultados das experiências.')
  }
  if (!candidato.curriculo) {
    pontos.push('Anexar currículo pode aumentar a confiança da análise, mas não é obrigatório para boa pontuação.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil sólido: foco agora deve ser aprofundar especialização e evidências de resultado.')
  }
  return pontos
}

function gerarSugestoesCurriculo(candidato: Candidato, pontuacao: Pontuacao): string[] {
  const sugestoes: string[] = []
  if (!candidato.curriculo) {
    sugestoes.push('Anexe um currículo em PDF quando quiser aumentar a confiança da análise.')
  }
  if (pontuacao.detalhes.experienciaEvidencias.pontos > 0 && pontuacao.detalhes.experienciaEvidencias.pontos < 14) {
    sugestoes.push('Descreva resultados quantificáveis nas experiências, como redução de tempo, volume atendido ou entregas concluídas.')
  }
  if (pontuacao.detalhes.competenciasRelevantes.pontos < 12) {
    sugestoes.push('Liste competências específicas usadas no dia a dia e conecte-as a experiências ou projetos.')
  }
  if (pontuacao.detalhes.projetosEntregas.pontos < 8) {
    sugestoes.push(`Inclua ${obterPlataformasEvidencia(candidato)} para reforçar evidências práticas.`)
  }
  sugestoes.push('Mantenha o currículo em uma página, com hierarquia visual clara.')
  return sugestoes
}

function gerarResumoProfissional(candidato: Candidato, pontuacao: Pontuacao): string {
  const nivel = rotuloNivelAtual(candidato)
  const area = candidato.areaInteresse.nome
  const objetivo = candidato.objetivoProfissional
  const opcao = objetivo.modo === 'definido' ? objetivo.opcoes[0] : undefined
  const faixa = pontuacao.total >= 80 ? 'muito competitivo' : pontuacao.total >= 60 ? 'competitivo' : pontuacao.total >= 40 ? 'em desenvolvimento' : 'inicial'

  if (objetivo.modo === 'exploracao') {
    return `Perfil de nível ${nivel} em fase de exploração profissional, com base inicial em ${area}. A análise usa dados declarados para sugerir caminhos possíveis, sem definir uma carreira única como certa.`
  }

  return `Perfil de nível ${nivel} voltado para ${opcao?.cargoOuArea ?? area}, atualmente em estágio ${faixa} de empregabilidade. A avaliação separa preparo profissional real de itens opcionais do checklist.`
}

function gerarPlanoAcao(candidato: Candidato, pontuacao: Pontuacao, contexto?: ContextoExterno): PlanoAcao[] {
  const tarefas: PlanoAcao[] = []
  const objetivo = candidato.objetivoProfissional
  const opcao = objetivo.modo === 'definido' ? objetivo.opcoes[0] : undefined
  const hoje = new Date()
  const daqui = (dias: number) => {
    const data = new Date(hoje)
    data.setDate(data.getDate() + dias)
    return data.toISOString().slice(0, 10)
  }

  if (objetivo.modo === 'exploracao') {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Testar caminhos profissionais por 30 dias',
      descricao: 'Pesquise rotinas de 3 áreas sugeridas, converse com profissionais e compare vagas de entrada antes de escolher um objetivo principal.',
      prioridade: 'Alta',
      prazo: daqui(7),
    })
  } else if (opcao?.cargoOuArea.trim()) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: `Preparar candidatura para ${opcao.cargoOuArea}`,
      descricao: `Adapte seu currículo e busque vagas alinhadas ao objetivo ${opcao.cargoOuArea}, usando as competências já cadastradas como base.`,
      prioridade: 'Alta',
      prazo: daqui(7),
    })
  }

  if (pontuacao.detalhes.competenciasRelevantes.pontos < 12) {
    const faltantes = identificarCompetenciasFaltantes(candidato, contexto)
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: `Estudar ${faltantes[0] ?? 'competências centrais da área'}`,
      descricao: `Aprofunde-se em ${faltantes.slice(0, 2).join(' e ') || 'competências centrais da área'} para se destacar nas vagas monitoradas.`,
      prioridade: 'Alta',
      prazo: daqui(30),
    })
  }

  if (pontuacao.detalhes.projetosEntregas.pontos < 8) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Adicionar evidências públicas da área',
      descricao: `Inclua ${obterPlataformasEvidencia(candidato)} para comprovar projetos, trabalhos ou estudos aplicados.`,
      prioridade: 'Média',
      prazo: daqui(21),
    })
  }

  if (pontuacao.detalhes.curriculoApresentacao.pontos < 8) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Organizar apresentação profissional',
      descricao: 'Complete dados estruturados, revise links e anexe currículo se quiser aumentar a confiança da análise.',
      prioridade: 'Média',
      prazo: daqui(14),
    })
  }

  tarefas.push({
    idPlano: gerarId('plano'),
    titulo: 'Aprofundar conhecimentos na área de interesse',
    descricao: 'Escolha um curso, projeto ou entrega prática reconhecida na área e conclua nas próximas semanas.',
    prioridade: 'Baixa',
    prazo: daqui(45),
  })

  return tarefas
}

export const analysisService = {
  calcularScore(candidato: Candidato, contexto?: ContextoExterno): number {
    return calcularPontuacao(candidato, contexto).total
  },

  gerarAnalise(candidato: Candidato, contexto?: ContextoExterno): AnalisePerfil {
    const pontuacao = calcularPontuacao(candidato, contexto)
    return {
      idAnalise: gerarId('analise'),
      versaoScore: 'v2',
      scoreEmpregabilidade: pontuacao.total,
      pontuacaoDetalhes: pontuacao.detalhes,
      checklistPerfil: gerarChecklistPerfil(candidato, contexto),
      resumoProfissional: gerarResumoProfissional(candidato, pontuacao),
      pontosFortes: gerarPontosFortes(candidato, pontuacao, contexto),
      pontosMelhorar: gerarPontosMelhorar(pontuacao, candidato),
      competenciasFaltantes: identificarCompetenciasFaltantes(candidato, contexto),
      sugestoesCurriculo: gerarSugestoesCurriculo(candidato, pontuacao),
      dataAnalise: new Date().toISOString(),
      planoAcao: gerarPlanoAcao(candidato, pontuacao, contexto),
    }
  },
}
