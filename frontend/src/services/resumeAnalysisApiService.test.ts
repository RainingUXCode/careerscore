import { afterEach, describe, expect, it, vi } from 'vitest'
import { resumeAnalysisApiService, ResumeAnalysisApiError } from './resumeAnalysisApiService'

describe('resumeAnalysisApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia PDF para endpoint backend e valida resposta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      profile: { skills: [], preferredRoles: [], experience: [], education: [], languages: [] },
      searchedQueries: [],
      jobsFound: 0,
      matches: [],
      jobErrors: [],
    }), { status: 200 })))

    const resultado = await resumeAnalysisApiService.analisarPdf(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }), true)

    expect(resultado.profile.skills).toEqual([])
  })

  it('rejeita resposta invalida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))

    await expect(resumeAnalysisApiService.analisarPdf(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }), true))
      .rejects.toBeInstanceOf(ResumeAnalysisApiError)
  })
})
