import type { VagaNormalizada } from '../types/vaga'
import { normalizarTexto } from '../utils/texto'

function chaveDeduplicacao(vaga: VagaNormalizada): string {
  if (vaga.urlOriginal) return `url:${vaga.urlOriginal}`
  if (vaga.idExterno) return `id:${vaga.fonte.id}:${vaga.idExterno}`
  return [
    'assinatura',
    normalizarTexto(vaga.empresa),
    normalizarTexto(vaga.titulo),
    normalizarTexto(vaga.localizacao.cidade ?? ''),
    normalizarTexto(vaga.localizacao.estado ?? ''),
  ].join(':')
}

/** Remove duplicatas simples entre vagas de diferentes providers (ou do mesmo). */
export function deduplicarVagas(vagas: VagaNormalizada[]): VagaNormalizada[] {
  const vistas = new Set<string>()
  const resultado: VagaNormalizada[] = []

  for (const vaga of vagas) {
    const chave = chaveDeduplicacao(vaga)
    if (vistas.has(chave)) continue
    vistas.add(chave)
    resultado.push(vaga)
  }

  return resultado
}
