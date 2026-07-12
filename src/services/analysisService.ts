import type { Candidato, AnalisePerfil, PlanoAcao, PontuacaoDetalhes } from '../types/models'
import { NomeArea, StatusCurso, TipoCompetencia } from '../types/enums'
import { competenciasReferenciaPorArea } from '../data/competenciasReferencia'
import { calcularDuracaoMeses } from '../utils/formatters'
import { gerarId } from '../utils/id'
import type { GithubAnalise, ContextoExterno } from '../types/externo'
import { categoriasPontuacao } from './benchmarkService'

export type { ContextoExterno }

interface Pontuacao {
  total: number
  detalhes: PontuacaoDetalhes
}

function candidatoEmInicioDeCarreira(candidato: Candidato): boolean {
  return candidato.escolaridades.some((e) => e.status === StatusCurso.CURSANDO)
    || candidato.nivelExperiencia === 'Estagiário'
    || candidato.objetivoProfissional.modo === 'exploracao'
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function areaPareceDesign(candidato: Candidato): boolean {
  const area = normalizar(`${candidato.areaInteresse.nome} ${candidato.areaInteresse.nomePersonalizado ?? ''}`)
  return area.includes('design') || area.includes('ux') || area.includes('ui')
}

function linkTemTipoOuDominio(candidato: Candidato, termos: string[]): boolean {
  return candidato.links.some((link) => {
    const tipo = normalizar(link.tipo)
    const url = normalizar(link.url)
    return Boolean(link.url.trim()) && termos.some((termo) => tipo.includes(termo) || url.includes(termo))
  })
}

function obterPlataformasEvidencia(candidato: Candidato): string {
  if (candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS) {
    return 'GitHub ou portfólio técnico'
  }

  if (areaPareceDesign(candidato)) {
    return 'Behance, Dribbble ou portfólio visual'
  }

  return 'LinkedIn, portfólio ou link profissional relevante'
}

function temEvidenciaProjetos(candidato: Candidato): boolean {
  if (candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS) {
    return linkTemTipoOuDominio(candidato, ['github', 'portf'])
  }

  if (areaPareceDesign(candidato)) {
    return linkTemTipoOuDominio(candidato, ['behance', 'dribbble', 'portf'])
  }

  return linkTemTipoOuDominio(candidato, ['linkedin', 'portf', 'behance', 'dribbble'])
}

function calcularPontuacaoExperiencia(candidato: Candidato): number {
  if (candidato.experiencias.length === 0) {
    const baseInicio = candidatoEmInicioDeCarreira(candidato) ? 4 : 0
    const bonusProjeto = temEvidenciaProjetos(candidato) ? 2 : 0
    return Math.min(baseInicio + bonusProjeto, 6)
  }

  const mesesTotais = candidato.experiencias.reduce(
    (soma, exp) => soma + calcularDuracaoMeses(exp.dataInicio, exp.empregoAtual ? undefined : exp.dataFim || exp.dataInicio),
    0,
  )
  const porQuantidade = Math.min(candidato.experiencias.length * 6, 18)
  const porDuracao = Math.min(mesesTotais * 0.4, 12)
  return Math.round(porQuantidade + porDuracao)
}

function calcularPontuacaoCompetencias(candidato: Candidato): number {
  const tecnicas = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.TECNICA)
  const comportamentais = candidato.competencias.filter((c) => c.tipo === TipoCompetencia.COMPORTAMENTAL)
  const porTecnicas = Math.min(tecnicas.length * 3, 18)
  const porComportamentais = Math.min(comportamentais.length * 2, 7)
  return Math.round(porTecnicas + porComportamentais)
}

function calcularPontuacaoEscolaridade(candidato: Candidato): number {
  if (candidato.escolaridades.length === 0) return 0
  const concluidas = candidato.escolaridades.filter((e) => e.status === StatusCurso.CONCLUIDO).length
  const emAndamento = candidato.escolaridades.filter((e) => e.status === StatusCurso.CURSANDO).length
  return Math.min(concluidas * 8 + emAndamento * 6, 16)
}

function calcularPontuacaoIdiomas(candidato: Candidato): number {
  const pesoPorNivel: Record<string, number> = {
    Básico: 1,
    Intermediário: 2,
    Avançado: 3,
    Fluente: 4,
    Nativo: 4,
  }
  const pontos = candidato.idiomas.reduce(
    (soma, idioma) => soma + (pesoPorNivel[idioma.nivelProficiencia] ?? 0),
    0,
  )
  return Math.min(pontos * 2, 12)
}

function calcularPontuacaoPresencaDigital(candidato: Candidato, github?: GithubAnalise): number {
  const linksValidos = candidato.links.filter((l) => l.url.trim().length > 0)
  const pontosBase = Math.min(linksValidos.length * 2, 6)
  const pontosLinkedin = linkTemTipoOuDominio(candidato, ['linkedin']) ? 3 : 0
  const pontosEvidenciaArea = temEvidenciaProjetos(candidato) ? 4 : 0

  let pontosGithub = 0
  if (github?.encontrado) {
    pontosGithub += Math.min(github.totalRepositoriosPublicos, 5)
    if (github.temReadmePerfil) pontosGithub += 2
    if (github.diasDesdeUltimaAtividade !== null && github.diasDesdeUltimaAtividade <= 90) pontosGithub += 2
    if (github.linguagens.length >= 2) pontosGithub += 1
  }

  return Math.min(pontosBase + pontosLinkedin + pontosEvidenciaArea + pontosGithub, 18)
}

function calcularPontuacaoCertificados(
  candidato: Candidato,
  competenciasPorCertificado?: Record<string, string[]>,
): number {
  const certificados = candidato.certificados ?? []
  if (certificados.length === 0) return 0

  const certificadosPreenchidos = certificados.filter(
    (certificado) => certificado.titulo.trim() || certificado.instituicao.trim(),
  )
  const comArquivo = certificadosPreenchidos.filter((certificado) => certificado.nomeArquivo || certificado.arquivo)
  const pontosBase = certificadosPreenchidos.length * 2 + comArquivo.length

  const totalCompetenciasDetectadas = Object.values(competenciasPorCertificado ?? {}).reduce(
    (soma, lista) => soma + lista.length,
    0,
  )
  const pontosTextoDetectado = Math.min(totalCompetenciasDetectadas, 4)
  const limite = temEvidenciaProjetos(candidato) ? 8 : 14
  return Math.min(pontosBase + pontosTextoDetectado, limite)
}

function calcularPontuacaoCurriculo(candidato: Candidato): number {
  return candidato.curriculo ? 15 : 0
}

function calcularPontuacao(candidato: Candidato, contexto?: ContextoExterno): Pontuacao {
  const detalhes = {
    experiencia: calcularPontuacaoExperiencia(candidato),
    competencias: calcularPontuacaoCompetencias(candidato),
    escolaridade: calcularPontuacaoEscolaridade(candidato),
    idiomas: calcularPontuacaoIdiomas(candidato),
    presencaDigital: calcularPontuacaoPresencaDigital(candidato, contexto?.github),
    certificados: calcularPontuacaoCertificados(candidato, contexto?.competenciasPorCertificado),
    curriculo: calcularPontuacaoCurriculo(candidato),
  }
  const totalBruto = Object.values(detalhes).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
  const totalPossivel = categoriasPontuacao.reduce((soma, categoria) => soma + categoria.maximo, 0)
  const total = totalPossivel > 0 ? Math.min(100, Math.round((totalBruto / totalPossivel) * 100)) : 0
  return { total, detalhes }
}

function identificarCompetenciasFaltantes(candidato: Candidato, contexto?: ContextoExterno): string[] {
  const area = candidato.areaInteresse.nome
  const referencia = competenciasReferenciaPorArea[area] ?? []
  const nomesAtuais = new Set(candidato.competencias.map((c) => normalizar(c.nome)))

  contexto?.github?.linguagens.forEach((linguagem) => nomesAtuais.add(normalizar(linguagem)))
  Object.values(contexto?.competenciasPorCertificado ?? {}).forEach((lista) =>
    lista.forEach((competencia) => nomesAtuais.add(normalizar(competencia))),
  )

  return referencia.filter((c) => !nomesAtuais.has(normalizar(c))).slice(0, 5)
}

function gerarPontosFortes(candidato: Candidato, pontuacao: Pontuacao, contexto?: ContextoExterno): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.experiencia >= 12) {
    pontos.push('Experiência profissional consistente para o nível pretendido.')
  } else if (candidatoEmInicioDeCarreira(candidato) && pontuacao.detalhes.experiencia > 0) {
    pontos.push('Perfil de início de carreira avaliado sem penalização excessiva por ausência de experiência formal.')
  }
  if (pontuacao.detalhes.competencias >= 12) {
    pontos.push('Boa variedade de competências técnicas e comportamentais cadastradas.')
  }
  if (pontuacao.detalhes.idiomas >= 6) {
    pontos.push('Domínio de idiomas que amplia as oportunidades disponíveis.')
  }
  if (pontuacao.detalhes.presencaDigital >= 6) {
    pontos.push(`Presença digital com evidências públicas adequadas à área (${obterPlataformasEvidencia(candidato)}).`)
  }
  const github = contexto?.github
  if (github?.encontrado && github.totalRepositoriosPublicos > 0) {
    const linguagensTexto = github.linguagens.slice(0, 3).join(', ')
    pontos.push(
      `GitHub ativo com ${github.totalRepositoriosPublicos} repositório(s) público(s)${
        linguagensTexto ? `, usando principalmente ${linguagensTexto}` : ''
      }.`,
    )
    if (github.temReadmePerfil) {
      pontos.push('Possui README de perfil no GitHub, o que reforça a apresentação profissional.')
    }
  }
  const totalCompetenciasDeCertificados = Object.values(contexto?.competenciasPorCertificado ?? {}).reduce(
    (soma, lista) => soma + lista.length,
    0,
  )
  if (totalCompetenciasDeCertificados > 0) {
    pontos.push('Certificados anexados confirmam, pelo conteúdo do arquivo, competências reais estudadas.')
  }
  if (pontuacao.detalhes.certificados >= 4) {
    pontos.push('Certificados e cursos cadastrados reforçam evidências de aprendizado.')
  }
  if (candidato.escolaridades.some((e) => e.status === StatusCurso.CURSANDO)) {
    pontos.push('Formação acadêmica em andamento alinhada à área de interesse.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil em construção, com potencial claro de evolução rápida.')
  }
  return pontos
}

function gerarPontosMelhorar(pontuacao: Pontuacao, candidato: Candidato, contexto?: ContextoExterno): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.experiencia < 8 && !candidatoEmInicioDeCarreira(candidato)) {
    pontos.push('Experiência prática ainda limitada para as vagas monitoradas.')
  }
  if (pontuacao.detalhes.competencias < 10) {
    pontos.push('Poucas competências técnicas cadastradas em relação à área escolhida.')
  }
  if (pontuacao.detalhes.presencaDigital < 6) {
    pontos.push('Presença digital incompleta: faltam links profissionais importantes.')
  }
  if (!candidato.curriculo) {
    pontos.push('Currículo não anexado, o que reduz a qualidade da análise.')
  }
  const totalCertificados = candidato.certificados?.length ?? 0
  if (!temEvidenciaProjetos(candidato)) {
    pontos.push(`Falta um link de evidência pública da área (${obterPlataformasEvidencia(candidato)}).`)
  }
  if (!temEvidenciaProjetos(candidato) && totalCertificados === 0) {
    pontos.push('Sem projetos ou certificados cadastrados para comprovar aprendizado prático.')
  }
  if (pontuacao.detalhes.idiomas < 4) {
    pontos.push('Pouca pontuação em idiomas, o que limita vagas internacionais.')
  }
  const github = contexto?.github
  if (github && !github.encontrado && candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS) {
    pontos.push(github.erro ?? 'Não foi possível confirmar o perfil do GitHub informado.')
  }
  if (github?.encontrado && github.totalRepositoriosPublicos === 0) {
    pontos.push('GitHub encontrado, mas sem repositórios públicos ainda: não há material para um recrutador avaliar.')
  }
  if (github?.encontrado && !github.temReadmePerfil) {
    pontos.push('Seu GitHub não tem um README de perfil; esse é o primeiro contato de quem visita seu usuário.')
  }
  if (github?.encontrado && github.diasDesdeUltimaAtividade !== null && github.diasDesdeUltimaAtividade > 180) {
    pontos.push('GitHub sem atividade recente; repositórios parados há mais de 6 meses passam a impressão de projeto abandonado.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil sólido: foco agora deve ser aprofundar especialização.')
  }
  return pontos
}

function gerarSugestoesCurriculo(candidato: Candidato, pontuacao: Pontuacao): string[] {
  const sugestoes: string[] = []
  if (!candidato.curriculo) {
    sugestoes.push('Anexe um currículo em PDF para permitir uma análise mais precisa.')
  }
  if (pontuacao.detalhes.experiencia > 0 && pontuacao.detalhes.experiencia < 12) {
    sugestoes.push('Descreva resultados quantificáveis nas experiências, como redução de tempo, volume atendido ou entregas concluídas.')
  }
  if (candidato.competencias.length < 6) {
    sugestoes.push('Liste mais competências técnicas específicas usadas no dia a dia.')
  }
  const totalCertificados = candidato.certificados?.length ?? 0
  if (!temEvidenciaProjetos(candidato) && totalCertificados > 0) {
    sugestoes.push('Use os certificados mais relevantes como apoio enquanto constrói evidências públicas de projeto.')
  }
  if (!temEvidenciaProjetos(candidato)) {
    sugestoes.push(`Inclua ${obterPlataformasEvidencia(candidato)} para reforçar sua aderência à área.`)
  }
  sugestoes.push('Mantenha o currículo em uma página, com hierarquia visual clara.')
  return sugestoes
}

function gerarResumoProfissional(candidato: Candidato, pontuacao: Pontuacao): string {
  const nivel = candidato.nivelExperiencia
  const area = candidato.areaInteresse.nome
  const objetivo = candidato.objetivoProfissional
  const opcao = objetivo.modo === 'definido' ? objetivo.opcoes[0] : undefined
  const faixa = pontuacao.total >= 80 ? 'muito competitivo' : pontuacao.total >= 60 ? 'competitivo' : pontuacao.total >= 40 ? 'em desenvolvimento' : 'inicial'

  if (objetivo.modo === 'exploracao') {
    return `Perfil de nível ${nivel} em fase de exploração profissional, com base inicial em ${area}. A análise usa dados declarados para sugerir caminhos possíveis, sem definir uma carreira única como certa.`
  }

  return `Perfil de nível ${nivel} voltado para ${opcao?.cargoOuArea ?? area}, atualmente em estágio ${faixa} de empregabilidade. A combinação de experiência, competências e formação indica um caminho claro de evolução com ajustes pontuais no currículo e na presença digital.`
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

  if (!candidato.curriculo) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Anexar currículo atualizado',
      descricao: 'Envie seu currículo em PDF ou DOCX para refinar a análise de empregabilidade.',
      prioridade: 'Alta',
      prazo: daqui(3),
    })
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

  if (pontuacao.detalhes.competencias < 12) {
    const faltantes = identificarCompetenciasFaltantes(candidato, contexto)
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: `Estudar ${faltantes[0] ?? 'novas tecnologias da área'}`,
      descricao: `Aprofunde-se em ${faltantes.slice(0, 2).join(' e ') || 'competências centrais da área'} para se destacar nas vagas monitoradas.`,
      prioridade: 'Alta',
      prazo: daqui(30),
    })
  }

  if (pontuacao.detalhes.presencaDigital < 9) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Melhorar LinkedIn',
      descricao: 'Atualize resumo, experiências e adicione projetos recentes no LinkedIn.',
      prioridade: 'Média',
      prazo: daqui(14),
    })
  }

  const github = contexto?.github
  if (github?.encontrado && !github.temReadmePerfil) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Criar README de perfil no GitHub',
      descricao: `Crie um repositório público chamado "${github.usuario}" com um README apresentando quem você é e seus principais projetos.`,
      prioridade: 'Média',
      prazo: daqui(10),
    })
  } else if (github?.encontrado && github.totalRepositoriosPublicos < 3) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Publicar mais projetos no GitHub',
      descricao: 'Tenha ao menos 3 repositórios públicos completos, com README explicando o problema resolvido.',
      prioridade: 'Média',
      prazo: daqui(21),
    })
  }

  if (!temEvidenciaProjetos(candidato)) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Adicionar evidências públicas da área',
      descricao: `Inclua ${obterPlataformasEvidencia(candidato)} para comprovar projetos, trabalhos ou estudos aplicados.`,
      prioridade: 'Média',
      prazo: daqui(21),
    })
  } else if (candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS && (!github || github.totalRepositoriosPublicos >= 3)) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Adicionar projetos ao portfólio',
      descricao: 'Publique 1-2 projetos completos com README detalhado no GitHub.',
      prioridade: 'Média',
      prazo: daqui(21),
    })
  }

  tarefas.push({
    idPlano: gerarId('plano'),
    titulo: 'Aprofundar conhecimentos na área de interesse',
    descricao: 'Escolha um curso ou certificação reconhecida na área e conclua nas próximas semanas.',
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
      scoreEmpregabilidade: pontuacao.total,
      pontuacaoDetalhes: pontuacao.detalhes,
      resumoProfissional: gerarResumoProfissional(candidato, pontuacao),
      pontosFortes: gerarPontosFortes(candidato, pontuacao, contexto),
      pontosMelhorar: gerarPontosMelhorar(pontuacao, candidato, contexto),
      competenciasFaltantes: identificarCompetenciasFaltantes(candidato, contexto),
      sugestoesCurriculo: gerarSugestoesCurriculo(candidato, pontuacao),
      dataAnalise: new Date().toISOString(),
      planoAcao: gerarPlanoAcao(candidato, pontuacao, contexto),
    }
  },
}
