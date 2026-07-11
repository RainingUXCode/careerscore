import { useEffect, useMemo, useState } from 'react'
import type { Candidato } from '../types/models'
import type { CurriculoOtimizadoResult, ComparacaoCurriculo, AtsAnalysisResult } from '../types/engine'
import { curriculoEdicaoService } from '../services/curriculoEdicaoService'
import { compararCurriculo } from '../services/curriculoComparadorService'
import { serializarCurriculoParaTexto } from '../services/engine/curriculoGenerator'
import { careerAnalysisEngine } from '../services/engine/careerAnalysisEngine'
import { validarCurriculo, type ErrosCurriculo } from '../services/curriculoValidacaoService'

const ATRASO_RECALCULO_MS = 400

export function useCurriculoEditavel(candidato: Candidato, original: CurriculoOtimizadoResult, idAnalise: string) {
  const [curriculo, setCurriculo] = useState<CurriculoOtimizadoResult>(
    () => curriculoEdicaoService.carregar(idAnalise) ?? original,
  )
  const [atsOtimizado, setAtsOtimizado] = useState<AtsAnalysisResult | null>(null)
  const [calculandoAts, setCalculandoAts] = useState(true)

  const foiEditado = useMemo(() => JSON.stringify(curriculo) !== JSON.stringify(original), [curriculo, original])

  const erros: ErrosCurriculo = useMemo(() => validarCurriculo(curriculo), [curriculo])

  /** Diz se uma seção específica diverge da versão gerada — usado para marcar "editado manualmente" na origem. */
  function secaoFoiEditada(chave: keyof CurriculoOtimizadoResult): boolean {
    return JSON.stringify(curriculo[chave]) !== JSON.stringify(original[chave])
  }

  // A comparação descreve o que o MOTOR mudou (currículo original do formulário
  // vs. versão recém-gerada) — não é afetada por edições manuais posteriores,
  // já que essas são de responsabilidade do usuário, não do sistema.
  const comparacao: ComparacaoCurriculo = useMemo(() => compararCurriculo(candidato, original), [candidato, original])

  function atualizar(novo: CurriculoOtimizadoResult) {
    setCurriculo(novo)
    curriculoEdicaoService.salvar(idAnalise, novo)
  }

  function restaurar() {
    setCurriculo(original)
    curriculoEdicaoService.limpar(idAnalise)
  }

  // Reestima a nota de ATS com o mesmo motor heurístico já existente,
  // analisando o texto serializado da versão atual (editada ou não) —
  // nenhum valor artificial ou bônus fixo é aplicado.
  useEffect(() => {
    let cancelado = false
    setCalculandoAts(true)

    const timer = setTimeout(() => {
      const texto = serializarCurriculoParaTexto(curriculo)
      careerAnalysisEngine
        .analisarAts({ candidato, textoCurriculo: texto })
        .then((resultado) => {
          if (!cancelado) {
            setAtsOtimizado(resultado)
            setCalculandoAts(false)
          }
        })
        .catch(() => {
          if (!cancelado) setCalculandoAts(false)
        })
    }, ATRASO_RECALCULO_MS)

    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [curriculo, candidato])

  return {
    curriculo,
    foiEditado,
    atualizar,
    restaurar,
    comparacao,
    atsOtimizado,
    calculandoAts,
    erros,
    secaoFoiEditada,
  }
}
