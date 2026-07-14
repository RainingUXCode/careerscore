import type { TipoRequisitoVaga } from '../../types/vaga'
import { competenciasReferenciaVagas } from '../../data/competenciasReferenciaVagas'
import { normalizarTexto } from '../../utils/texto'

const LICENCAS_CONHECIDAS = ['oab', 'crea', 'crefito', 'crm', 'cnh', 'coren', 'crn', 'crc', 'cref']
const IDIOMAS_CONHECIDOS = ['ingles', 'espanhol', 'frances', 'alemao', 'italiano', 'mandarim', 'japones']

/**
 * Classifica um requisito de vaga em um dos tipos conhecidos, a partir do
 * nome. Compartilhado entre normalizadores (mock hoje; fontes reais no
 * futuro), para não duplicar a heurística em cada um.
 */
export function classificarTipoRequisito(nomeRequisito: string): TipoRequisitoVaga {
  const normalizado = normalizarTexto(nomeRequisito)

  if (LICENCAS_CONHECIDAS.some((licenca) => normalizado.includes(licenca))) return 'licenca'
  if (IDIOMAS_CONHECIDOS.some((idioma) => normalizado.includes(idioma))) return 'idioma'
  if (/certificad|certificacao/.test(normalizado)) return 'certificado'
  if (/graduac|ensino medio|ensino superior|tecnico em|pos[- ]graduac|mestrado|doutorado|formacao em/.test(normalizado)) {
    return 'formacao'
  }

  const referencia = competenciasReferenciaVagas.find(
    (competencia) =>
      normalizarTexto(competencia.nome) === normalizado ||
      competencia.sinonimos.some((sinonimo) => normalizarTexto(sinonimo) === normalizado),
  )
  if (referencia) {
    return referencia.tipo === 'comportamental' ? 'competencia_comportamental' : 'competencia_tecnica'
  }

  return 'competencia_tecnica'
}
