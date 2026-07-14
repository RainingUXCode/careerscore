import type { LinkProfissional } from '../types/models'
import { TipoLink } from '../types/enums'

type LinkBasico = { tipo: string; url: string }

function limparUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function chaveLink(link: LinkBasico): string {
  const url = limparUrl(link.url).toLowerCase()
  return `${link.tipo}:${url}`
}

export function sanitizarLinksPorTipoUrl<T extends LinkBasico>(links: T[]): T[] {
  const porChave = new Map<string, T>()
  const porTipo = new Map<string, string>()

  for (const link of links) {
    const url = limparUrl(link.url)
    if (!url) continue
    const normalizado = { ...link, url }
    const chave = chaveLink(normalizado)
    porChave.set(chave, normalizado)
    porTipo.set(normalizado.tipo, chave)
  }

  return Array.from(porTipo.values())
    .map((chave) => porChave.get(chave))
    .filter((link): link is T => Boolean(link))
}

export function sanitizarLinks(links: LinkProfissional[]): LinkProfissional[] {
  return sanitizarLinksPorTipoUrl(links)
}

export function substituirLink(links: LinkProfissional[], id: string, patch: Partial<LinkProfissional>): LinkProfissional[] {
  const atualizados = links.map((link) => (link.idLink === id ? { ...link, ...patch } : link))
  const editado = atualizados.find((link) => link.idLink === id)
  if (!editado) return atualizados

  return atualizados.filter((link) => {
    if (link.idLink === id) return true
    if (link.tipo === editado.tipo) return false
    if (editado.url.trim() && link.url.trim()) return chaveLink(link) !== chaveLink(editado)
    return true
  })
}

export function proximoTipoLinkDisponivel(links: LinkProfissional[]): TipoLink | undefined {
  const usados = new Set(links.map((link) => link.tipo))
  return Object.values(TipoLink).find((tipo) => !usados.has(tipo))
}
