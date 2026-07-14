import type { Candidato } from '../types/models'
import { githubService } from './githubService'
import { documentTextService } from './documentTextService'
import type { ContextoExterno } from '../types/externo'

export const contextoExternoService = {
  /**
   * Roda em paralelo: análise real do GitHub (via API pública) e extração de
   * texto dos certificados em PDF, para enriquecer o score e os pontos de
   * melhoria com evidências reais, não apenas presença de campos preenchidos.
   */
  async coletar(candidato: Candidato): Promise<ContextoExterno> {
    const urlGithub = githubService.obterUrlGithub(candidato)

    const [github, competenciasPorCertificado] = await Promise.all([
      urlGithub ? githubService.analisar(urlGithub) : Promise.resolve(undefined),
      contextoExternoService.analisarCertificados(candidato),
    ])

    return { github, competenciasPorCertificado }
  },

  async analisarCertificados(candidato: Candidato): Promise<Record<string, string[]>> {
    const certificados = candidato.certificados ?? []
    const resultado: Record<string, string[]> = {}

    await Promise.all(
      certificados.map(async (certificado) => {
        if (!certificado.arquivo) return
        const texto = await documentTextService.extrairTexto(certificado.arquivo)
        if (!texto) return
        const competencias = documentTextService.detectarCompetencias(texto)
        if (competencias.length > 0) {
          resultado[certificado.idCertificado] = competencias
        }
      }),
    )

    return resultado
  },
}
