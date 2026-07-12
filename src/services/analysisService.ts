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

function calcularPontuacaoExperiencia(candidato: Candidato): number {
  if (candidato.experiencias.length === 0) return 0
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
  const comportamentais = candidato.competencias.filter(
    (c) => c.tipo === TipoCompetencia.COMPORTAMENTAL,
  )
  const porTecnicas = Math.min(tecnicas.length * 3, 18)
  const porComportamentais = Math.min(comportamentais.length * 2, 7)
  return Math.round(porTecnicas + porComportamentais)
}

function calcularPontuacaoEscolaridade(candidato: Candidato): number {
  if (candidato.escolaridades.length === 0) return 0
  const concluidas = candidato.escolaridades.filter((e) => e.status === StatusCurso.CONCLUIDO).length
  const emAndamento = candidato.escolaridades.filter((e) => e.status === StatusCurso.CURSANDO).length
  return Math.min(concluidas * 8 + emAndamento * 5, 16)
}

function calcularPontuacaoIdiomas(candidato: Candidato): number {
  const pesoPorNivel: Record<string, number> = {
    'BÃ¡sico': 1,
    'IntermediÃ¡rio': 2,
    'AvanÃ§ado': 3,
    Fluente: 4,
    Nativo: 4,
  }
  const pontos = candidato.idiomas.reduce(
    (soma, idioma) => soma + (pesoPorNivel[idioma.nivelProficiencia] ?? 0),
    0,
  )
  return Math.min(pontos * 2, 12)
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
    return 'GitHub ou portfÃ³lio tÃ©cnico'
  }

  if (areaPareceDesign(candidato)) {
    return 'Behance, Dribbble ou portfÃ³lio visual'
  }

  return 'LinkedIn, portfÃ³lio ou link profissional relevante'
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

function calcularPontuacaoPresencaDigital(candidato: Candidato, github?: GithubAnalise): number {
  const linksValidos = candidato.links.filter((l) => l.url.trim().length > 0)
  const pontosBase = Math.min(linksValidos.length * 2, 6)
  const pontosLinkedin = linkTemTipoOuDominio(candidato, ['linkedin']) ? 3 : 0
  const pontosEvidenciaArea = temEvidenciaProjetos(candidato) ? 4 : 0

  let pontosGithub = 0
  if (github?.encontrado) {
    pontosGithub += Math.min(github.totalRepositoriosPublicos, 5) // atÃ© 5 pts, 1 por repo
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
  const nomesAtuais = new Set(candidato.competencias.map((c) => c.nome.toLowerCase()))

  contexto?.github?.linguagens.forEach((linguagem) => nomesAtuais.add(linguagem.toLowerCase()))
  Object.values(contexto?.competenciasPorCertificado ?? {}).forEach((lista) =>
    lista.forEach((competencia) => nomesAtuais.add(competencia.toLowerCase())),
  )

  return referencia.filter((c) => !nomesAtuais.has(c.toLowerCase())).slice(0, 5)
}

function gerarPontosFortes(candidato: Candidato, pontuacao: Pontuacao, contexto?: ContextoExterno): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.experiencia >= 12) {
    pontos.push('ExperiÃªncia profissional consistente para o nÃ­vel pretendido.')
  }
  if (pontuacao.detalhes.competencias >= 12) {
    pontos.push('Boa variedade de competÃªncias tÃ©cnicas e comportamentais cadastradas.')
  }
  if (pontuacao.detalhes.idiomas >= 6) {
    pontos.push('DomÃ­nio de idiomas que amplia as oportunidades disponÃ­veis.')
  }
  if (pontuacao.detalhes.presencaDigital >= 6) {
    pontos.push(`PresenÃ§a digital com evidÃªncias pÃºblicas adequadas Ã  Ã¡rea (${obterPlataformasEvidencia(candidato)}).`)
  }
  const github = contexto?.github
  if (github?.encontrado && github.totalRepositoriosPublicos > 0) {
    const linguagensTexto = github.linguagens.slice(0, 3).join(', ')
    pontos.push(
      `GitHub ativo com ${github.totalRepositoriosPublicos} repositÃ³rio(s) pÃºblico(s)${
        linguagensTexto ? `, usando principalmente ${linguagensTexto}` : ''
      }.`,
    )
    if (github.temReadmePerfil) {
      pontos.push('Possui README de perfil no GitHub, o que reforÃ§a a apresentaÃ§Ã£o profissional.')
    }
  }
  const totalCompetenciasDeCertificados = Object.values(contexto?.competenciasPorCertificado ?? {}).reduce(
    (soma, lista) => soma + lista.length,
    0,
  )
  if (totalCompetenciasDeCertificados > 0) {
    pontos.push('Certificados anexados confirmam, pelo conteÃºdo do arquivo, competÃªncias reais estudadas.')
  }
  if (pontuacao.detalhes.certificados >= 4) {
    pontos.push('Certificados e cursos cadastrados reforcam evidencias de aprendizado.')
  }
  if (candidato.escolaridades.some((e) => e.status === 'Cursando')) {
    pontos.push('FormaÃ§Ã£o acadÃªmica em andamento alinhada Ã  Ã¡rea de interesse.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil em construÃ§Ã£o, com potencial claro de evoluÃ§Ã£o rÃ¡pida.')
  }
  return pontos
}

function gerarPontosMelhorar(pontuacao: Pontuacao, candidato: Candidato, contexto?: ContextoExterno): string[] {
  const pontos: string[] = []
  if (pontuacao.detalhes.experiencia < 8) {
    pontos.push('ExperiÃªncia prÃ¡tica ainda limitada para as vagas monitoradas.')
  }
  if (pontuacao.detalhes.competencias < 10) {
    pontos.push('Poucas competÃªncias tÃ©cnicas cadastradas em relaÃ§Ã£o Ã  Ã¡rea escolhida.')
  }
  if (pontuacao.detalhes.presencaDigital < 6) {
    pontos.push('PresenÃ§a digital incompleta â€” faltam links profissionais importantes.')
  }
  if (!candidato.curriculo) {
    pontos.push('CurrÃ­culo nÃ£o anexado, o que reduz a qualidade da anÃ¡lise.')
  }
  const totalCertificados = candidato.certificados?.length ?? 0
  if (!temEvidenciaProjetos(candidato)) {
    pontos.push(`Falta um link de evidÃªncia pÃºblica da Ã¡rea (${obterPlataformasEvidencia(candidato)}).`)
  }
  if (!temEvidenciaProjetos(candidato) && totalCertificados === 0) {
    pontos.push('Sem projetos ou certificados cadastrados para comprovar aprendizado prÃ¡tico.')
  }
  if (pontuacao.detalhes.idiomas < 4) {
    pontos.push('Pouca pontuaÃ§Ã£o em idiomas, o que limita vagas internacionais.')
  }
  const github = contexto?.github
  if (github && !github.encontrado && candidato.areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS) {
    pontos.push(github.erro ?? 'NÃ£o foi possÃ­vel confirmar o perfil do GitHub informado.')
  }
  if (github?.encontrado && github.totalRepositoriosPublicos === 0) {
    pontos.push('GitHub encontrado, mas sem repositÃ³rios pÃºblicos ainda â€” nada para um recrutador avaliar.')
  }
  if (github?.encontrado && !github.temReadmePerfil) {
    pontos.push('Seu GitHub nÃ£o tem um README de perfil â€” Ã© o primeiro contato de quem visita seu usuÃ¡rio.')
  }
  if (github?.encontrado && github.diasDesdeUltimaAtividade !== null && github.diasDesdeUltimaAtividade > 180) {
    pontos.push('GitHub sem atividade recente â€” repositÃ³rios parados hÃ¡ mais de 6 meses passam a impressÃ£o de projeto abandonado.')
  }
  if (pontos.length === 0) {
    pontos.push('Perfil sÃ³lido â€” foco agora deve ser aprofundar especializaÃ§Ã£o.')
  }
  return pontos
}

function gerarSugestoesCurriculo(candidato: Candidato, pontuacao: Pontuacao): string[] {
  const sugestoes: string[] = []
  if (!candidato.curriculo) {
    sugestoes.push('Anexe um currÃ­culo em PDF para permitir uma anÃ¡lise mais precisa.')
  }
  if (pontuacao.detalhes.experiencia > 0 && pontuacao.detalhes.experiencia < 12) {
    sugestoes.push('Descreva resultados quantificÃ¡veis nas experiÃªncias (ex: â€œreduziu X em Y%â€).')
  }
  if (candidato.competencias.length < 6) {
    sugestoes.push('Liste mais competÃªncias tÃ©cnicas especÃ­ficas usadas no dia a dia.')
  }
  const totalCertificados = candidato.certificados?.length ?? 0
  if (!temEvidenciaProjetos(candidato) && totalCertificados > 0) {
    sugestoes.push('Use os certificados mais relevantes como apoio enquanto constrÃ³i evidÃªncias pÃºblicas de projeto.')
  }
  if (!temEvidenciaProjetos(candidato)) {
    sugestoes.push(`Inclua ${obterPlataformasEvidencia(candidato)} para reforÃ§ar sua aderÃªncia Ã  Ã¡rea.`)
  }
  sugestoes.push('Mantenha o currÃ­culo em uma pÃ¡gina, com hierarquia visual clara.')
  return sugestoes
}

function gerarResumoProfissional(candidato: Candidato, pontuacao: Pontuacao): string {
  const nivel = candidato.nivelExperiencia
  const area = candidato.areaInteresse.nome
  const objetivo = candidato.objetivoProfissional
  const faixa = pontuacao.total >= 80 ? 'muito competitivo' : pontuacao.total >= 60 ? 'competitivo' : pontuacao.total >= 40 ? 'em desenvolvimento' : 'inicial'
  if (objetivo?.modo === 'exploracao') {
    return `Perfil de nivel ${nivel} em fase de exploracao profissional, com base inicial em ${area}. A analise usa dados declarados para sugerir caminhos possiveis, sem definir uma carreira unica como certa.`
  }
  if (objetivo?.modo === 'multiplas_opcoes') {
    const principal = objetivo.opcoes.find((opcao) => opcao.principal) ?? objetivo.opcoes[0]
    return `Perfil de nivel ${nivel} avaliando multiplas opcoes profissionais, com foco principal em ${principal?.cargoOuArea ?? area}. A combinacao de experiencia, competencias e formacao ajuda a comparar caminhos sem substituir sua escolha principal.`
  }
  return `Perfil de nivel ${nivel} voltado para ${area}, atualmente em estagio ${faixa} de empregabilidade. A combinacao de experiencia, competencias e formacao indica um caminho claro de evolucao com ajustes pontuais no curriculo e na presenca digital.`
}

function gerarPlanoAcao(candidato: Candidato, pontuacao: Pontuacao, contexto?: ContextoExterno): PlanoAcao[] {
  const tarefas: PlanoAcao[] = []
  const objetivo = candidato.objetivoProfissional
  const hoje = new Date()
  const daqui = (dias: number) => {
    const data = new Date(hoje)
    data.setDate(data.getDate() + dias)
    return data.toISOString().slice(0, 10)
  }

  if (!candidato.curriculo) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Anexar currÃ­culo atualizado',
      descricao: 'Envie seu currÃ­culo em PDF ou DOCX para refinar a anÃ¡lise de empregabilidade.',
      prioridade: 'Alta',
      prazo: daqui(3),
    })
  }

  if (objetivo?.modo === 'exploracao') {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Testar caminhos profissionais por 30 dias',
      descricao: 'Pesquise rotinas de 3 areas sugeridas, converse com profissionais e compare vagas de entrada antes de escolher um objetivo principal.',
      prioridade: 'Alta',
      prazo: daqui(7),
    })
  } else if (objetivo?.modo === 'multiplas_opcoes') {
    const principal = objetivo.opcoes.find((opcao) => opcao.principal) ?? objetivo.opcoes[0]
    if (principal?.cargoOuArea) {
      tarefas.push({
        idPlano: gerarId('plano'),
        titulo: `Comparar vagas para ${principal.cargoOuArea}`,
        descricao: 'Compare as opcoes salvas, preserve a principal e escolha uma area para testar com candidaturas e atividades praticas curtas.',
        prioridade: 'Alta',
        prazo: daqui(10),
      })
    }
  } else if (objetivo?.cargoDesejado?.trim()) {
    const conhecimentos = objetivo.conhecimentosPrioritarios.slice(0, 2)
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: `Preparar candidatura para ${objetivo.cargoDesejado}`,
      descricao: conhecimentos.length > 0
        ? `Priorize evidencias de ${conhecimentos.join(' e ')} e adapte seu curriculo para vagas de ${objetivo.cargoDesejado}.`
        : `Adapte seu curriculo e busque vagas alinhadas ao objetivo ${objetivo.cargoDesejado}.`,
      prioridade: 'Alta',
      prazo: daqui(7),
    })
  }

  if (pontuacao.detalhes.competencias < 12) {
    const faltantes = identificarCompetenciasFaltantes(candidato, contexto)
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: `Estudar ${faltantes[0] ?? 'novas tecnologias da Ã¡rea'}`,
      descricao: `Aprofunde-se em ${faltantes.slice(0, 2).join(' e ') || 'competÃªncias centrais da Ã¡rea'} para se destacar nas vagas monitoradas.`,
      prioridade: 'Alta',
      prazo: daqui(30),
    })
  }

  if (pontuacao.detalhes.presencaDigital < 9) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Melhorar LinkedIn',
      descricao: 'Atualize resumo, experiÃªncias e adicione projetos recentes no LinkedIn.',
      prioridade: 'Média',
      prazo: daqui(14),
    })
  }

  const github = contexto?.github
  if (github?.encontrado && !github.temReadmePerfil) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Criar README de perfil no GitHub',
      descricao: `Crie um repositÃ³rio pÃºblico chamado "${github.usuario}" com um README apresentando quem vocÃª Ã© e seus principais projetos.`,
      prioridade: 'Média',
      prazo: daqui(10),
    })
  } else if (github?.encontrado && github.totalRepositoriosPublicos < 3) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Publicar mais projetos no GitHub',
      descricao: 'Tenha ao menos 3 repositÃ³rios pÃºblicos completos, com README explicando o problema resolvido.',
      prioridade: 'Média',
      prazo: daqui(21),
    })
  }

  if (!temEvidenciaProjetos(candidato)) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Adicionar evidÃªncias pÃºblicas da Ã¡rea',
      descricao: `Inclua ${obterPlataformasEvidencia(candidato)} para comprovar projetos, trabalhos ou estudos aplicados.`,
      prioridade: 'Média',
      prazo: daqui(21),
    })
  } else if (candidato.areaInteresse.nome === 'Tecnologia e Dados' && (!github || github.totalRepositoriosPublicos >= 3)) {
    tarefas.push({
      idPlano: gerarId('plano'),
      titulo: 'Adicionar projetos ao portfÃ³lio',
      descricao: 'Publique 1-2 projetos completos com README detalhado no GitHub.',
      prioridade: 'Média',
      prazo: daqui(21),
    })
  }

  tarefas.push({
    idPlano: gerarId('plano'),
    titulo: 'Aprofundar conhecimentos na Ã¡rea de interesse',
    descricao: 'Escolha um curso ou certificaÃ§Ã£o reconhecida na Ã¡rea e conclua nas prÃ³ximas semanas.',
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
