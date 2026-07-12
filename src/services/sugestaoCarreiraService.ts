import type { Candidato, OpcaoObjetivoProfissional, SugestaoCarreira } from '../types/models'
import { Modalidade, TipoCompetencia } from '../types/enums'
import { normalizarTexto } from '../utils/texto'

interface CaminhoExploracao {
  id: string
  area: string
  cargosEntrada: string[]
  sinais: string[]
  lacunas: string[]
  acaoPraticaInicial: string
}

const caminhos: CaminhoExploracao[] = [
  {
    id: 'atendimento',
    area: 'Atendimento',
    cargosEntrada: ['Atendente', 'Assistente de atendimento', 'Suporte ao cliente'],
    sinais: ['pessoas', 'atendimento', 'cliente', 'comunicacao', 'empatia', 'resolver problemas', 'negociacao'],
    lacunas: ['ferramentas de CRM', 'registro de atendimentos', 'indicadores de satisfação'],
    acaoPraticaInicial: 'Comparar 5 vagas de atendimento de entrada e listar as rotinas mais repetidas.',
  },
  {
    id: 'administracao',
    area: 'Administração',
    cargosEntrada: ['Auxiliar Administrativo', 'Assistente Administrativo', 'Recepcionista Administrativo'],
    sinais: ['processos', 'organizacao', 'documentacao', 'excel', 'rotina', 'planejamento', 'administrativo'],
    lacunas: ['Excel aplicado', 'rotinas administrativas', 'organização de documentos'],
    acaoPraticaInicial: 'Fazer uma atividade prática curta organizando uma planilha simples de controle.',
  },
  {
    id: 'recursos-humanos',
    area: 'Recursos Humanos',
    cargosEntrada: ['Assistente de RH', 'Auxiliar de RH', 'Assistente de Departamento Pessoal'],
    sinais: ['pessoas', 'recrutamento', 'treinamento', 'comunicacao', 'conflitos', 'escuta', 'documentacao'],
    lacunas: ['triagem de currículos', 'rotinas de recrutamento', 'noções de departamento pessoal'],
    acaoPraticaInicial: 'Pesquisar a rotina de 3 vagas de Assistente de RH e montar uma lista de requisitos comuns.',
  },
  {
    id: 'tecnologia',
    area: 'Tecnologia',
    cargosEntrada: ['Estágio em Tecnologia', 'Suporte Técnico', 'Assistente de Dados'],
    sinais: ['tecnologia', 'dados', 'programacao', 'excel', 'power bi', 'python', 'react', 'sistemas'],
    lacunas: ['projeto prático', 'ferramentas técnicas da área', 'portfólio simples'],
    acaoPraticaInicial: 'Testar um projeto introdutório curto e documentar o resultado em uma página simples.',
  },
  {
    id: 'comercial-vendas',
    area: 'Comercial e Vendas',
    cargosEntrada: ['Vendedor', 'Assistente Comercial', 'Consultor de Vendas Júnior'],
    sinais: ['pessoas', 'vendas', 'negociacao', 'cliente', 'metas', 'comercial', 'comunicacao'],
    lacunas: ['funil de vendas', 'abordagem comercial', 'registro de oportunidades'],
    acaoPraticaInicial: 'Observar 5 vagas comerciais de entrada e comparar metas, rotina e modelo de remuneração.',
  },
  {
    id: 'design',
    area: 'Design',
    cargosEntrada: ['Assistente de Design', 'Designer Júnior', 'Estágio em Design'],
    sinais: ['criatividade', 'design', 'figma', 'visual', 'detalhes', 'produto', 'pesquisa'],
    lacunas: ['portfólio visual', 'ferramenta de design', 'processo de criação'],
    acaoPraticaInicial: 'Criar uma peça simples ou estudo visual e registrar o processo em portfólio.',
  },
  {
    id: 'logistica',
    area: 'Logística',
    cargosEntrada: ['Auxiliar de Logística', 'Assistente de Operações', 'Conferente'],
    sinais: ['processos', 'operacoes', 'logistica', 'estoque', 'tarefas praticas', 'organizacao', 'planejamento'],
    lacunas: ['controle de estoque', 'rotinas de expedição', 'indicadores operacionais'],
    acaoPraticaInicial: 'Comparar vagas de auxiliar de logística e anotar ferramentas e turnos mais pedidos.',
  },
]

function textosDoCandidato(candidato: Candidato): string[] {
  const objetivo = candidato.objetivoProfissional
  return [
    candidato.areaInteresse.nome,
    candidato.areaInteresse.nomePersonalizado ?? '',
    ...objetivo.preferenciasExploracao.atividadesPreferidas,
    ...objetivo.preferenciasExploracao.interesses,
    ...objetivo.preferenciasExploracao.prefereTrabalharCom,
    ...objetivo.preferenciasExploracao.ambientesPreferidos,
    ...candidato.competencias.map((competencia) => competencia.nome),
    ...candidato.experiencias.flatMap((experiencia) => [experiencia.cargo, experiencia.descricao]),
    ...candidato.escolaridades.map((escolaridade) => escolaridade.curso),
    ...candidato.certificados.map((certificado) => certificado.titulo),
    ...candidato.idiomas.map((idioma) => idioma.nome),
  ].filter(Boolean)
}

function competenciasTecnicas(candidato: Candidato): string[] {
  return candidato.competencias
    .filter((competencia) => competencia.tipo === TipoCompetencia.TECNICA)
    .map((competencia) => competencia.nome)
}

function competenciasComportamentais(candidato: Candidato): string[] {
  return candidato.competencias
    .filter((competencia) => competencia.tipo === TipoCompetencia.COMPORTAMENTAL)
    .map((competencia) => competencia.nome)
}

function calcularEvidencias(candidato: Candidato, caminho: CaminhoExploracao): string[] {
  const texto = normalizarTexto(textosDoCandidato(candidato).join(' '))
  return caminho.sinais
    .filter((sinal) => texto.includes(normalizarTexto(sinal)))
    .map((sinal) => `Há evidência declarada relacionada a ${sinal}.`)
}

export function gerarSugestoesCarreira(candidato: Candidato): SugestaoCarreira[] {
  const tecnicas = competenciasTecnicas(candidato)
  const comportamentais = competenciasComportamentais(candidato)
  const preferenciasDeclaradas = textosDoCandidato(candidato).length

  return caminhos
    .map((caminho) => {
      const evidencias = calcularEvidencias(candidato, caminho)
      const afinidade = Math.min(95, Math.round((evidencias.length / Math.max(caminho.sinais.length, 1)) * 100))
      const confiancaBase = preferenciasDeclaradas >= 8 ? 0.65 : preferenciasDeclaradas >= 4 ? 0.5 : 0.35
      const confianca = evidencias.length === 0 ? 0.2 : Math.min(0.8, confiancaBase + evidencias.length * 0.03)
      return {
        id: caminho.id,
        area: caminho.area,
        cargosEntrada: caminho.cargosEntrada,
        afinidadeEstimada: afinidade,
        confianca,
        evidencias,
        competenciasAtuaisRelacionadas: tecnicas.filter((competencia) =>
          caminho.sinais.some((sinal) => normalizarTexto(competencia).includes(normalizarTexto(sinal))),
        ),
        competenciasTransferiveis: comportamentais.filter((competencia) =>
          normalizarTexto(caminho.sinais.join(' ')).includes(normalizarTexto(competencia)),
        ),
        lacunas: caminho.lacunas,
        pontosFavoraveis: evidencias.slice(0, 3),
        pontosAtencao: evidencias.length === 0
          ? ['Ainda há pouca evidência declarada para estimar aderência com segurança.']
          : ['A sugestão indica afinidade inicial, mas não substitui teste prático da rotina.'],
        acaoPraticaInicial: caminho.acaoPraticaInicial,
        mensagemCautelosa: 'Esta área pode combinar com seu perfil atual.',
      } satisfies SugestaoCarreira
    })
    .filter((sugestao) => sugestao.evidencias.length > 0)
    .sort((a, b) => b.afinidadeEstimada - a.afinidadeEstimada || b.confianca - a.confianca)
    .slice(0, 5)
}

export function sugestaoParaObjetivo(candidato: Candidato, sugestao: SugestaoCarreira): Candidato {
  const objetivo = candidato.objetivoProfissional
  const cargoDesejado = sugestao.cargosEntrada[0] ?? sugestao.area
  return {
    ...candidato,
    objetivoProfissional: {
      ...objetivo,
      modo: 'definido',
      cargoDesejado,
      nivelAlvo: objetivo.nivelAlvo === 'Indiferente' ? 'Auxiliar' : objetivo.nivelAlvo,
      areasSecundarias: objetivo.areasSecundarias,
      tiposContratoAceitos: objetivo.tiposContratoAceitos.length ? objetivo.tiposContratoAceitos : ['Indiferente'],
      modalidadesAceitas: objetivo.modalidadesAceitas.length ? objetivo.modalidadesAceitas : [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
      conhecimentosPrioritarios: [...new Set([...objetivo.conhecimentosPrioritarios, ...sugestao.lacunas.slice(0, 2)])],
    },
  }
}

export function sugestoesParaOpcoes(sugestoes: SugestaoCarreira[]): OpcaoObjetivoProfissional[] {
  return sugestoes.slice(0, 3).map((sugestao, indice) => ({
    id: `sugestao-${sugestao.id}`,
    cargoOuArea: sugestao.cargosEntrada[0] ?? sugestao.area,
    nivelAlvo: 'Auxiliar',
    prioridade: indice + 1,
    principal: indice === 0,
    tiposContratoAceitos: ['Indiferente'],
    modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
  }))
}
