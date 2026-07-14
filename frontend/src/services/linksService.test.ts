import { describe, expect, it } from 'vitest'
import { TipoLink } from '../types/enums'
import type { LinkProfissional } from '../types/models'
import { sanitizarLinks, substituirLink } from './linksService'

function link(id: string, tipo: TipoLink, url: string): LinkProfissional {
  return { idLink: id, tipo, url }
}

describe('linksService', () => {
  it('remove links duplicados por tipo e url ao sanear dados antigos', () => {
    const links = sanitizarLinks([
      link('1', TipoLink.LINKEDIN, ' https://linkedin.com/in/pessoa '),
      link('2', TipoLink.LINKEDIN, 'https://linkedin.com/in/pessoa/'),
      link('3', TipoLink.GITHUB, 'https://github.com/pessoa'),
    ])

    expect(links).toHaveLength(2)
    expect(links.map((item) => item.tipo)).toEqual([TipoLink.LINKEDIN, TipoLink.GITHUB])
    expect(links[0].url).toBe('https://linkedin.com/in/pessoa')
  })

  it('editar tipo de link substitui o item existente em vez de duplicar', () => {
    const links = substituirLink(
      [
        link('1', TipoLink.LINKEDIN, 'https://linkedin.com/in/antigo'),
        link('2', TipoLink.GITHUB, 'https://github.com/pessoa'),
      ],
      '2',
      { tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/novo' },
    )

    expect(links).toHaveLength(1)
    expect(links[0]).toMatchObject({ idLink: '2', tipo: TipoLink.LINKEDIN, url: 'https://linkedin.com/in/novo' })
  })
})
