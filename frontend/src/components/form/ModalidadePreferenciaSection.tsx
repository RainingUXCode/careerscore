import { Modalidade } from '../../types/enums'

interface Props {
  modalidadesPreferidas: Modalidade[]
  atualizar: (modalidades: Modalidade[]) => void
}

const opcoes = Object.values(Modalidade)

export function ModalidadePreferenciaSection({ modalidadesPreferidas, atualizar }: Props) {
  function alternar(modalidade: Modalidade) {
    const selecionada = modalidadesPreferidas.includes(modalidade)
    if (selecionada && modalidadesPreferidas.length === 1) return

    atualizar(
      selecionada
        ? modalidadesPreferidas.filter((item) => item !== modalidade)
        : [...modalidadesPreferidas, modalidade],
    )
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-[var(--color-ink)]">Preferencia de modalidade</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {opcoes.map((modalidade) => {
          const checked = modalidadesPreferidas.includes(modalidade)
          const bloqueada = checked && modalidadesPreferidas.length === 1

          return (
            <label
              key={modalidade}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-3 text-sm transition-colors ${
                checked
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                  : 'border-[var(--color-line)] bg-[var(--color-canvas-raised)] text-[var(--color-ink-soft)]'
              } ${bloqueada ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={bloqueada}
                onChange={() => alternar(modalidade)}
              />
              {modalidade}
            </label>
          )
        })}
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        As vagas recomendadas vao priorizar apenas as modalidades marcadas.
      </p>
    </fieldset>
  )
}
