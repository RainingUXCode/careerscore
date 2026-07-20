import type { Curriculo } from '../types/models'
import { FormatoCurriculo } from '../types/enums'
import type { MotivoTextoIndisponivel } from '../types/engine'
import { normalizarTexto } from '../utils/texto'

// Serviço genérico de leitura de documentos no navegador (PDF via pdfjs-dist,
// DOCX via mammoth — ambos carregados sob demanda). Usado para certificados e
// para o currículo, compartilhando a mesma lógica de extração e detecção de
// competências.

const PAGINAS_MAXIMAS_PADRAO = 3
const PAGINAS_MAXIMAS_CURRICULO = 5
/** Abaixo disso, tratamos como "documento sem texto" (provável PDF escaneado ou arquivo vazio). */
const TAMANHO_MINIMO_TEXTO_VALIDO = 20

// Palavras-chave conhecidas de competências técnicas e comportamentais,
// usadas para detectar o que um documento (certificado, currículo) provavelmente
// menciona.
const PALAVRAS_CHAVE_COMPETENCIAS = [
  'react', 'typescript', 'javascript', 'node.js', 'node', 'python', 'java', 'php',
  'sql', 'mysql', 'postgresql', 'mongodb', 'git', 'github', 'docker', 'kubernetes',
  'aws', 'azure', 'gcp', 'cloud', 'html', 'css', 'tailwind', 'sass', 'figma',
  'ux', 'ui', 'photoshop', 'illustrator', 'excel', 'power bi', 'scrum', 'kanban',
  'agile', 'ágil', 'gestão de projetos', 'uml', 'testes automatizados', 'qa',
  'inglês', 'english', 'espanhol', 'marketing digital', 'seo', 'vendas',
  'atendimento ao cliente', 'liderança', 'comunicação', 'excel avançado',
]

let workerConfigurado = false

async function carregarPdfjs() {
  const [pdfjsLib, workerUrlModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ])
  if (!workerConfigurado) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlModule.default
    workerConfigurado = true
  }
  return pdfjsLib
}

export interface OpcoesExtracaoPdf {
  /** Quantas páginas ler no máximo (padrão: 3, suficiente para certificados de 1 página). */
  paginasMaximas?: number
}

/** Extrai o texto de um PDF. Lança erro se a leitura falhar (arquivo corrompido, etc.). */
async function extrairTextoPdf(arquivo: File, opcoes: OpcoesExtracaoPdf = {}): Promise<string> {
  const paginasMaximas = opcoes.paginasMaximas ?? PAGINAS_MAXIMAS_PADRAO
  const pdfjsLib = await carregarPdfjs()
  const bufer = await arquivo.arrayBuffer()
  const documento = await pdfjsLib.getDocument({ data: bufer }).promise
  const totalPaginas = Math.min(documento.numPages, paginasMaximas)
  const textos: string[] = []

  for (let numero = 1; numero <= totalPaginas; numero += 1) {
    const pagina = await documento.getPage(numero)
    const conteudo = await pagina.getTextContent()
    const textoPagina = conteudo.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    textos.push(textoPagina)
  }

  return textos.join('\n').trim()
}

/** Extrai o texto de um DOCX via mammoth. Lança erro se a leitura falhar. */
async function extrairTextoDocx(arquivo: File): Promise<string> {
  const mammoth = await import('mammoth')
  const bufer = await arquivo.arrayBuffer()
  const resultado = await mammoth.extractRawText({ arrayBuffer: bufer })
  return resultado.value.trim()
}

export interface TextoExtraido {
  texto: string | null
  /** Presente apenas quando `texto` é null, explicando o motivo. */
  motivo?: MotivoTextoIndisponivel
}

export const documentTextService = {
  /**
   * Extrai o texto de um PDF avulso (usado hoje para certificados).
   * Retorna null se não for PDF ou se a leitura falhar — contrato inalterado
   * em relação à versão anterior deste serviço.
   */
  async extrairTexto(arquivo: File, opcoes: OpcoesExtracaoPdf = {}): Promise<string | null> {
    const ehPdf = arquivo.type === 'application/pdf' || arquivo.name.toLowerCase().endsWith('.pdf')
    if (!ehPdf) return null

    try {
      const texto = await extrairTextoPdf(arquivo, opcoes)
      return texto || null
    } catch {
      return null
    }
  },

  /**
   * Extrai o texto do currículo do candidato, despachando por formato (PDF ou
   * DOCX). Ao contrário de `extrairTexto`, retorna também o motivo quando o
   * texto não pôde ser obtido, para que a análise de ATS explique com clareza
   * ao usuário por que a nota ficou menos precisa.
   *
   * Ponto único de extensão: um novo formato só exige um novo branch aqui —
   * nenhum consumidor (App.tsx, motor de análise) precisa mudar.
   */
  async extrairTextoCurriculo(curriculo?: Curriculo): Promise<TextoExtraido> {
    if (!curriculo?.arquivo) {
      return { texto: null, motivo: 'sem_arquivo' }
    }

    try {
      let textoBruto: string

      if (curriculo.formato === FormatoCurriculo.PDF) {
        textoBruto = await extrairTextoPdf(curriculo.arquivo, { paginasMaximas: PAGINAS_MAXIMAS_CURRICULO })
      } else if (curriculo.formato === FormatoCurriculo.DOCX) {
        textoBruto = await extrairTextoDocx(curriculo.arquivo)
      } else {
        return { texto: null, motivo: 'formato_nao_suportado' }
      }

      if (textoBruto.length < TAMANHO_MINIMO_TEXTO_VALIDO) {
        return { texto: null, motivo: 'documento_sem_texto' }
      }

      return { texto: textoBruto }
    } catch {
      return { texto: null, motivo: 'falha_na_leitura' }
    }
  },

  /** Detecta competências mencionadas em um texto extraído (certificado, currículo, etc.). */
  detectarCompetencias(texto: string): string[] {
    const textoNormalizado = normalizarTexto(texto)
    const encontradas = PALAVRAS_CHAVE_COMPETENCIAS.filter((palavra) =>
      textoNormalizado.includes(normalizarTexto(palavra)),
    )
    if (encontradas.includes('node.js')) {
      return encontradas.filter((p) => p !== 'node')
    }
    return encontradas
  },
}
