import type { Candidato } from '../types/models'
import { competenciasTransferiveisPorOrigem, type CompetenciaTransferivelOrigem } from '../data/competenciasTransferiveis'
import { encontrarAreaPorTexto } from './areaMatchService'

export interface OrigemTransferivel {
  origemId: string
  origemDescricao: string
  itens: CompetenciaTransferivelOrigem[]
}

/**
 * Detecta, a partir das experiências e formação do candidato, quais "origens"
 * (áreas anteriores) podem gerar competências transferíveis relevantes —
 * usado quando a área de interesse do candidato não é a mesma da vaga.
 */
export function detectarOrigensTransferiveis(candidato: Candidato): OrigemTransferivel[] {
  const origens: OrigemTransferivel[] = []
  const idsJaAdicionados = new Set<string>()

  for (const experiencia of candidato.experiencias) {
    const areaDetectada = encontrarAreaPorTexto(`${experiencia.cargo} ${experiencia.descricao}`)
    const origemId = areaDetectada?.id
    if (origemId && competenciasTransferiveisPorOrigem[origemId] && !idsJaAdicionados.has(origemId)) {
      idsJaAdicionados.add(origemId)
      origens.push({
        origemId,
        origemDescricao: `experiência como ${experiencia.cargo}`,
        itens: competenciasTransferiveisPorOrigem[origemId],
      })
    }
  }

  // Se o candidato tem formação mas pouca/nenhuma experiência profissional,
  // considera também as competências transferíveis da vida acadêmica.
  if (candidato.experiencias.length === 0 && candidato.escolaridades.length > 0 && !idsJaAdicionados.has('academica')) {
    origens.push({
      origemId: 'academica',
      origemDescricao: 'experiência acadêmica',
      itens: competenciasTransferiveisPorOrigem.academica,
    })
  }

  return origens
}
