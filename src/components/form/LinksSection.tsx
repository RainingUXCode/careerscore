import type { Candidato, LinkProfissional } from '../../types/models'
import { NomeArea, TipoLink } from '../../types/enums'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { ErrosValidacao } from '../../services/validationService'

interface Props {
  areaInteresse: Candidato['areaInteresse']
  links: LinkProfissional[]
  adicionar: () => void
  atualizar: (id: string, patch: Partial<LinkProfissional>) => void
  remover: (id: string) => void
  erros: ErrosValidacao
}

const opcoesTipo = Object.values(TipoLink).map((v) => ({ value: v, label: v }))

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function obterOrientacaoLinks(areaInteresse: Candidato['areaInteresse']): string {
  const area = normalizar(`${areaInteresse.nome} ${areaInteresse.nomePersonalizado ?? ''}`)

  if (areaInteresse.nome === NomeArea.TECNOLOGIA_DADOS) {
    return 'Para Tecnologia e Dados, adicione GitHub e/ou portfólio com projetos públicos.'
  }

  if (area.includes('design') || area.includes('ux') || area.includes('ui')) {
    return 'Para Design, adicione Behance, Dribbble ou portfólio visual com trabalhos publicados.'
  }

  return 'Adicione LinkedIn e um portfólio/link profissional que comprove sua trajetória na área.'
}

export function LinksSection({ areaInteresse, links, adicionar, atualizar, remover, erros }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {links.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          {obterOrientacaoLinks(areaInteresse)}
        </p>
      )}
      {links.map((link, i) => (
        <div key={link.idLink} className="flex items-end gap-3">
          <Select
            label="Tipo"
            options={opcoesTipo}
            value={link.tipo}
            onChange={(e) => atualizar(link.idLink, { tipo: e.target.value as TipoLink })}
            className="w-40"
          />
          <Input
            label="URL"
            placeholder="https://..."
            value={link.url}
            onChange={(e) => atualizar(link.idLink, { url: e.target.value })}
            error={erros[`link_${i}`]}
            className="flex-1"
          />
          <button
            onClick={() => remover(link.idLink)}
            className="mb-2.5 text-xs font-medium text-[var(--color-score-low)] hover:underline"
          >
            Remover
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={adicionar} className="self-start">
        + Adicionar link
      </Button>
    </div>
  )
}
