import { useState } from 'react'
import type { Competencia } from '../../types/models'
import { NomeArea, TipoCompetencia } from '../../types/enums'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { competenciasReferenciaPorArea } from '../../data/competenciasReferencia'

interface Props {
  competencias: Competencia[]
  areaInteresse: NomeArea
  adicionar: (nome: string, tipo: TipoCompetencia) => void
  remover: (id: string) => void
}

const sugestoesComportamentais = [
  'Comunicação',
  'Trabalho em equipe',
  'Proatividade',
  'Resolução de problemas',
  'Adaptabilidade',
  'Pensamento crítico',
  'Organização',
  'Gestão do tempo',
]

function SugestoesChips({
  sugestoes,
  jaAdicionadas,
  onSelecionar,
}: {
  sugestoes: string[]
  jaAdicionadas: Set<string>
  onSelecionar: (nome: string) => void
}) {
  const disponiveis = sugestoes.filter((s) => !jaAdicionadas.has(s.toLowerCase()))
  if (disponiveis.length === 0) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-[var(--color-muted)]">Sugestões:</span>
      {disponiveis.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelecionar(s)}
          className="rounded-full border border-dashed border-[var(--color-line)] px-2.5 py-1 text-xs
            text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          + {s}
        </button>
      ))}
    </div>
  )
}

function ListaTags({
  competencias,
  tipo,
  remover,
}: {
  competencias: Competencia[]
  tipo: TipoCompetencia
  remover: (id: string) => void
}) {
  const filtradas = competencias.filter((c) => c.tipo === tipo)
  if (filtradas.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Nenhuma competência adicionada.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {filtradas.map((c) => (
        <span
          key={c.idCompetencia}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm text-[var(--color-primary-dark)]"
        >
          {c.nome}
          <button onClick={() => remover(c.idCompetencia)} aria-label={`Remover ${c.nome}`} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </span>
      ))}
    </div>
  )
}

export function CompetenciasSection({ competencias, areaInteresse, adicionar, remover }: Props) {
  const [tecnica, setTecnica] = useState('')
  const [comportamental, setComportamental] = useState('')

  const nomesAtuais = new Set(competencias.map((c) => c.nome.toLowerCase()))
  const sugestoesTecnicas = competenciasReferenciaPorArea[areaInteresse] ?? []

  function submeterTecnica(nomeForcado?: string) {
    const nome = nomeForcado ?? tecnica
    adicionar(nome, TipoCompetencia.TECNICA)
    if (!nomeForcado) setTecnica('')
  }
  function submeterComportamental(nomeForcado?: string) {
    const nome = nomeForcado ?? comportamental
    adicionar(nome, TipoCompetencia.COMPORTAMENTAL)
    if (!nomeForcado) setComportamental('')
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--color-ink)]">Competências técnicas</h3>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Clique nas sugestões abaixo ou escreva qualquer tecnologia ou ferramenta que você domina.
        </p>
        <SugestoesChips
          sugestoes={sugestoesTecnicas}
          jaAdicionadas={nomesAtuais}
          onSelecionar={(s) => submeterTecnica(s)}
        />
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="Ex: React, SQL, Excel, Photoshop..."
            value={tecnica}
            onChange={(e) => setTecnica(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submeterTecnica())}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => submeterTecnica()}>Adicionar</Button>
        </div>
        <ListaTags competencias={competencias} tipo={TipoCompetencia.TECNICA} remover={remover} />
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--color-ink)]">Competências comportamentais</h3>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Clique nas sugestões abaixo ou escreva a sua própria — não precisa se limitar à lista.
        </p>
        <SugestoesChips
          sugestoes={sugestoesComportamentais}
          jaAdicionadas={nomesAtuais}
          onSelecionar={(s) => submeterComportamental(s)}
        />
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="Ex: Comunicação, Trabalho em equipe..."
            value={comportamental}
            onChange={(e) => setComportamental(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submeterComportamental())}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => submeterComportamental()}>Adicionar</Button>
        </div>
        <ListaTags competencias={competencias} tipo={TipoCompetencia.COMPORTAMENTAL} remover={remover} />
      </div>
    </div>
  )
}
