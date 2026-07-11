import { useRef, useState } from 'react'
import type { Candidato, ResultadoProcessamento } from './types/models'
import { LandingPage } from './pages/LandingPage'
import { FormPage } from './pages/FormPage'
import { ProcessingPage } from './pages/ProcessingPage'
import { ReportPage } from './pages/ReportPage'
import { analysisService } from './services/analysisService'
import type { ContextoExterno } from './types/externo'
import { vagaRecomendacaoService } from './services/vagaRecomendacaoService'
import { marketPatternService } from './services/marketPatternService'
import { historyService, type HistoricoScoreItem } from './services/historyService'
import { contextoExternoService } from './services/contextoExternoService'
import { documentTextService, type TextoExtraido } from './services/documentTextService'
import { careerAnalysisEngine } from './services/engine/careerAnalysisEngine'

type Etapa = 'landing' | 'formulario' | 'processamento' | 'relatorio'

function App() {
  const [etapa, setEtapa] = useState<Etapa>('landing')
  const [candidatoAtual, setCandidatoAtual] = useState<Candidato | null>(null)
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null)
  const [historico, setHistorico] = useState<HistoricoScoreItem[]>(() => historyService.listar())
  const contextoExternoRef = useRef<Promise<ContextoExterno> | null>(null)
  const textoCurriculoRef = useRef<Promise<TextoExtraido> | null>(null)

  function iniciarFormulario() {
    setEtapa('formulario')
  }

  function concluirFormulario(candidato: Candidato) {
    setCandidatoAtual(candidato)
    // Dispara em paralelo, durante a animação de processamento: análise real de
    // GitHub, leitura de certificados e leitura do currículo (para a análise de ATS).
    contextoExternoRef.current = contextoExternoService.coletar(candidato)
    textoCurriculoRef.current = documentTextService.extrairTextoCurriculo(candidato.curriculo)
    setEtapa('processamento')
  }

  async function finalizarProcessamento() {
    if (!candidatoAtual) return
    const [contexto, textoExtraido] = await Promise.all([
      contextoExternoRef.current ?? Promise.resolve({}),
      textoCurriculoRef.current ?? Promise.resolve({ texto: null } as TextoExtraido),
    ])
    const analise = analysisService.gerarAnalise(candidatoAtual, contexto)
    const { recomendacoes, fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm } =
      await vagaRecomendacaoService.gerarRecomendacoes(candidatoAtual)
    const padraoMercado = await marketPatternService.calcularPadraoMercado(candidatoAtual)
    const atsAnalise = await careerAnalysisEngine.analisarAts({
      candidato: candidatoAtual,
      textoCurriculo: textoExtraido.texto,
      motivoTextoIndisponivel: textoExtraido.motivo,
    })
    const curriculoOtimizado = await careerAnalysisEngine.gerarCurriculoOtimizado({
      candidato: candidatoAtual,
      contextoExterno: contexto,
    })
    const novoResultado = {
      candidato: candidatoAtual,
      analise,
      recomendacoes,
      contextoExterno: contexto,
      atsAnalise,
      curriculoOtimizado,
      padraoMercado,
      metaVagas: { fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm },
    }
    setResultado(novoResultado)
    setHistorico(historyService.salvarResultado(novoResultado))
    setEtapa('relatorio')
  }

  /** Busca vagas de novo, ignorando o cache — só disparado pelo clique explícito em "Atualizar vagas". */
  async function atualizarVagas() {
    if (!resultado) return
    const { recomendacoes, fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm } =
      await vagaRecomendacaoService.gerarRecomendacoes(resultado.candidato, { forcarAtualizacao: true })
    const padraoMercado = await marketPatternService.calcularPadraoMercado(resultado.candidato)
    setResultado({
      ...resultado,
      recomendacoes,
      padraoMercado,
      metaVagas: { fontesComFalha, codigosErro, usouFallback, deCache, consultadoEm },
    })
  }

  function reanalisar() {
    if (!resultado) return
    setCandidatoAtual(resultado.candidato)
    contextoExternoRef.current = contextoExternoService.coletar(resultado.candidato)
    textoCurriculoRef.current = documentTextService.extrairTextoCurriculo(resultado.candidato.curriculo)
    setResultado(null)
    setEtapa('processamento')
  }

  function reiniciar() {
    setCandidatoAtual(null)
    setResultado(null)
    setEtapa('landing')
  }

  if (etapa === 'landing') return <LandingPage onComecar={iniciarFormulario} />
  if (etapa === 'formulario') return <FormPage onConcluir={concluirFormulario} />
  if (etapa === 'processamento') return <ProcessingPage onFinalizado={finalizarProcessamento} />
  if (etapa === 'relatorio' && resultado) {
    return (
      <ReportPage
        resultado={resultado}
        historico={historico}
        onReanalisar={reanalisar}
        onReiniciar={reiniciar}
        onAtualizarVagas={atualizarVagas}
      />
    )
  }

  return null
}

export default App
