import type { Candidato } from '../types/models'
import type { PublicoVaga, VagaNormalizada } from '../types/vaga'
import { normalizarTexto } from '../utils/texto'

const PADROES_EXCLUSIVA_PCD = [
  /\bexclusiv[ao]s?\s+para\s+(pcd|pessoas?\s+com\s+deficiencia|profissionais?\s+com\s+deficiencia)\b/,
  /\bvaga\s+exclusiva\s+(pcd|para\s+pessoas?\s+com\s+deficiencia)\b/,
  /\boportunidade\s+exclusiva\s+para\s+(pcd|pessoas?\s+com\s+deficiencia)\b/,
  /\bdestinad[ao]\s+exclusivamente\s+a\s+pessoas?\s+com\s+deficiencia\b/,
]

const PADROES_AFIRMATIVA = [
  /\bpessoas?\s+com\s+deficiencia\s+sao\s+bem-vindas\b/,
  /\bcandidaturas?\s+pcd\s+sao\s+incentivadas\b/,
  /\bvalorizamos\s+a\s+diversidade\b/,
  /\bempresa\s+inclusiva\b/,
  /\bprograma\s+de\s+diversidade\b/,
  /\boportunidade\s+afirmativa\b/,
]

export function classificarPublicoVaga(titulo: string, descricao: string): PublicoVaga {
  const texto = normalizarTexto(`${titulo} ${descricao}`)
  if (PADROES_EXCLUSIVA_PCD.some((padrao) => padrao.test(texto))) return 'exclusiva_pcd'
  if (PADROES_AFIRMATIVA.some((padrao) => padrao.test(texto))) return 'afirmativa_nao_exclusiva'
  return texto.trim() ? 'geral' : 'nao_identificado'
}

export function candidatoElegivelParaPublicoDaVaga(candidato: Candidato, vaga: Pick<VagaNormalizada, 'publico'>): boolean {
  if (vaga.publico !== 'exclusiva_pcd') return true
  return candidato.preferenciaVagasPcd === 'sim'
}
