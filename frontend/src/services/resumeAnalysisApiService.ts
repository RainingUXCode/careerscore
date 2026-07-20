import type { ApiErrorEnvelope, ResumeAnalysisResponse } from '../types/api'

interface ApiErrorBody {
  error?: ApiErrorEnvelope['error']
  erro?: string
  mensagem?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function isResumeAnalysisResult(valor: unknown): valor is ResumeAnalysisResponse {
  return Boolean(valor)
    && typeof valor === 'object'
    && Boolean((valor as ResumeAnalysisResponse).profile)
    && Array.isArray((valor as ResumeAnalysisResponse).searchedQueries)
    && Array.isArray((valor as ResumeAnalysisResponse).matches)
}

export class ResumeAnalysisApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'ResumeAnalysisApiError'
  }
}

export const resumeAnalysisApiService = {
  async analisarPdf(arquivo: File, consentimentoEnvioIa: boolean): Promise<ResumeAnalysisResponse> {
    if (!consentimentoEnvioIa) {
      throw new ResumeAnalysisApiError('consentimento_ausente', 'Confirme o envio do currículo para análise por IA.')
    }
    const formData = new FormData()
    formData.set('resume', arquivo)
    formData.set('consent', String(consentimentoEnvioIa))

    const resposta = await fetch(`${API_BASE_URL}/v1/resumes/analyze`, {
      method: 'POST',
      body: formData,
    })

    const corpo: unknown = await resposta.json().catch(() => null)
    if (!resposta.ok) {
      const erro = corpo as ApiErrorBody | null
      throw new ResumeAnalysisApiError(
        erro?.error?.code ?? erro?.erro ?? `status_${resposta.status}`,
        erro?.error?.message ?? erro?.mensagem ?? 'Falha ao analisar currículo.',
      )
    }

    if (!isResumeAnalysisResult(corpo)) {
      throw new ResumeAnalysisApiError('resposta_invalida', 'A análise retornou um formato inválido.')
    }

    return corpo
  },
}
