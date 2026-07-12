import { Modalidade } from '../types/enums'
import type { VagaNormalizada } from '../types/vaga'
import { normalizarTexto } from '../utils/texto'

export interface LocalizacaoCandidato {
  cidade?: string
  estado?: string
}

export interface ResultadoFiltroLocalizacao {
  manter: boolean
  /** true quando a vaga foi mantida por incerteza, não por confirmação real de compatibilidade. */
  confiancaReduzida: boolean
  motivo: string
}

function textoIgual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return normalizarTexto(a) === normalizarTexto(b)
}

/**
 * Avalia se uma vaga deve permanecer na lista, considerando a modalidade —
 * nunca só o estado. Regras:
 *
 * - Remoto: nunca exige cidade/estado do candidato.
 * - Híbrido/Presencial: exige cidade E estado compatíveis — bater só o
 *   estado não é suficiente (duas cidades do mesmo estado não são a mesma
 *   localização para efeito de presencial/híbrido).
 * - Modalidade desconhecida (não informada pela fonte): nunca descarta
 *   automaticamente — mantém, mas sinaliza confiança reduzida.
 */
export function avaliarLocalizacaoVaga(
  vaga: Pick<VagaNormalizada, 'modalidade' | 'modalidadeInformada' | 'localizacao'>,
  candidato: LocalizacaoCandidato,
): ResultadoFiltroLocalizacao {
  if (!vaga.modalidadeInformada || !vaga.modalidade) {
    return {
      manter: true,
      confiancaReduzida: true,
      motivo: 'Modalidade não informada pela fonte — confirme a localização no anúncio original.',
    }
  }

  if (vaga.modalidade === Modalidade.REMOTO) {
    return { manter: true, confiancaReduzida: false, motivo: 'Vaga remota — localização do candidato não se aplica.' }
  }

  if (!candidato.cidade || !candidato.estado) {
    return {
      manter: true,
      confiancaReduzida: true,
      motivo: 'Cidade/estado do candidato não preenchidos — não foi possível confirmar compatibilidade geográfica.',
    }
  }

  if (!vaga.localizacao.cidade || !vaga.localizacao.estado) {
    return {
      manter: true,
      confiancaReduzida: true,
      motivo: 'A vaga não informou cidade/estado — não foi possível confirmar compatibilidade geográfica.',
    }
  }

  const cidadeCompativel = textoIgual(vaga.localizacao.cidade, candidato.cidade)
  const estadoCompativel = textoIgual(vaga.localizacao.estado, candidato.estado)

  if (cidadeCompativel && estadoCompativel) {
    return { manter: true, confiancaReduzida: false, motivo: 'Cidade e estado compatíveis com a vaga presencial/híbrida.' }
  }

  return {
    manter: false,
    confiancaReduzida: false,
    motivo: 'Localização presencial/híbrida incompatível — cidade ou estado diferentes dos do candidato.',
  }
}
