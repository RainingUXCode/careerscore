import type { RecursoEstudo } from '../../data/recursosEstudo'

export function RecursosEstudoList({ recursos }: { recursos: RecursoEstudo[] }) {
  if (recursos.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Nenhuma lacuna crítica identificada no momento.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {recursos.map((recurso) => (
        <div key={recurso.competencia} className="rounded-lg bg-[var(--color-well)] p-3">
          <div className="flex flex-wrap items-start gap-3">
            <span className="whitespace-nowrap rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              {recurso.competencia}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-ink-soft)]">{recurso.descricao}</p>
              <a
                href={recurso.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                {recurso.url} ↗
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
