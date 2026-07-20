import type { CareerAnalyzer, AtsAnalysisResult, CurriculoOtimizadoResult } from '../../types/engine'
import { HeuristicAtsAnalyzer, type AtsAnalyzerInput } from './atsAnalyzer'
import { HeuristicCurriculoGenerator, type CurriculoGeneratorInput } from './curriculoGenerator'

/**
 * Estratégias ativas do Career Analysis Engine.
 *
 * Trocar qualquer uma para uma implementação com IA no futuro (ex:
 * ClaudeAtsAnalyzer, ClaudeCurriculoGenerator) é questão de trocar a linha
 * correspondente por outra classe que implemente o mesmo contrato
 * CareerAnalyzer<TInput, TResult> — nenhum componente ou fluxo da aplicação
 * depende destas implementações concretas, apenas do objeto
 * `careerAnalysisEngine` abaixo.
 */
const atsAnalyzer: CareerAnalyzer<AtsAnalyzerInput, AtsAnalysisResult> = new HeuristicAtsAnalyzer()
const curriculoGenerator: CareerAnalyzer<CurriculoGeneratorInput, CurriculoOtimizadoResult> =
  new HeuristicCurriculoGenerator()

export const careerAnalysisEngine = {
  analisarAts(input: AtsAnalyzerInput): Promise<AtsAnalysisResult> {
    return atsAnalyzer.analisar(input)
  },

  gerarCurriculoOtimizado(input: CurriculoGeneratorInput): Promise<CurriculoOtimizadoResult> {
    return curriculoGenerator.analisar(input)
  },
}

export type { AtsAnalyzerInput, AtsAnalysisResult, CurriculoGeneratorInput, CurriculoOtimizadoResult }
