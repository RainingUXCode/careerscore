import type { CurriculoOtimizadoResult } from '../types/engine'
import { validationService } from './validationService'

export interface ErrosCurriculo {
  nome?: string
  /** Índices de habilidadesTecnicas com problema (vazia ou duplicada). */
  habilidadesInvalidas: number[]
  habilidadesResumo?: string
  /** índice do link -> mensagem */
  links: Record<number, string>
}

/**
 * Se a URL não tiver protocolo mas se tornar válida ao acrescentar "https://",
 * retorna a versão normalizada. Só marca como impossível de formar quando nem
 * assim resulta em uma URL válida.
 */
export function normalizarUrl(url: string): { url: string; normalizado: boolean } {
  const valor = url.trim()
  if (!valor || validationService.validarUrl(valor)) {
    return { url: valor, normalizado: false }
  }
  const comProtocolo = `https://${valor}`
  if (validationService.validarUrl(comProtocolo)) {
    return { url: comProtocolo, normalizado: true }
  }
  return { url: valor, normalizado: false }
}

/** true se a URL já é válida ou pode ser normalizada acrescentando "https://". */
function urlEhReconhecivel(url: string): boolean {
  const valor = url.trim()
  if (!valor) return true
  if (validationService.validarUrl(valor)) return true
  return validationService.validarUrl(`https://${valor}`)
}

/**
 * Valida apenas estrutura e formato do currículo editado — nunca a veracidade
 * do conteúdo. Usado para destacar campos incompletos antes da exportação,
 * sem impedir o usuário de exportar mesmo assim.
 */
export function validarCurriculo(curriculo: CurriculoOtimizadoResult): ErrosCurriculo {
  const erros: ErrosCurriculo = { habilidadesInvalidas: [], links: {} }

  if (!curriculo.contato.nome.trim()) {
    erros.nome = 'O nome não pode ficar vazio.'
  }

  const vistas = new Set<string>()
  curriculo.habilidadesTecnicas.forEach((habilidade, i) => {
    const normalizada = habilidade.trim().toLowerCase()
    if (!normalizada) {
      erros.habilidadesInvalidas.push(i)
    } else if (vistas.has(normalizada)) {
      erros.habilidadesInvalidas.push(i)
    } else {
      vistas.add(normalizada)
    }
  })
  if (erros.habilidadesInvalidas.length > 0) {
    erros.habilidadesResumo = 'Há habilidades vazias ou repetidas na lista.'
  }

  curriculo.links.forEach((link, i) => {
    if (link.url.trim() && !urlEhReconhecivel(link.url)) {
      erros.links[i] = 'Não foi possível reconhecer um endereço válido nesse link.'
    }
  })

  return erros
}

export function contarProblemas(erros: ErrosCurriculo): number {
  return (erros.nome ? 1 : 0) + erros.habilidadesInvalidas.length + Object.keys(erros.links).length
}
