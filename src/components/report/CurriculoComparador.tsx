import type { ComparacaoCurriculo, TipoMudancaSecao } from '../../types/engine'
import { Badge } from '../ui/Badge'

const labelPorTipo: Record<TipoMudancaSecao, string> = {
  reorganizado: '↕ Reorganizado',
  destacado: '⭐ Destacado',
  adicionado: '➕ Adicionado',
  ausente: '– Ausente',
  sem_alteracao: 'Sem alteração',
}

const tonePorTipo: Record<TipoMudancaSecao, 'primary' | 'high' | 'mid' | 'neutral'> = {
  reorganizado: 'primary',
  destacado: 'high',
  adicionado: 'high',
  ausente: 'mid',
  sem_alteracao: 'neutral',
}

export function CurriculoComparador({ comparacao }: { comparacao: ComparacaoCurriculo }) {
  return (
    <div className="flex flex-col gap-4">
      {comparacao.secoes.map((secao) => {
        const semAlteracao = secao.tipos.length === 1 && secao.tipos[0] === 'sem_alteracao'
        return (
          <div key={secao.chave} className="rounded-lg border border-[var(--color-line)] p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-[var(--color-ink)]">{secao.nome}</h4>
              {secao.tipos.map((tipo) => (
                <Badge key={tipo} tone={tonePorTipo[tipo]}>
                  {labelPorTipo[tipo]}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-[var(--color-ink-soft)]">{secao.resumoMudanca}</p>
            {!semAlteracao && <p className="mt-1 text-xs text-[var(--color-muted)]">💡 {secao.motivoAts}</p>}

            {(secao.conteudoOriginal.length > 0 || secao.conteudoOtimizado.length > 0) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[var(--color-well)] p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-[var(--color-muted)]">Perfil cadastrado</p>
                  {secao.conteudoOriginal.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">— não havia nesta seção —</p>
                  ) : (
                    <ul className="flex flex-col gap-1 text-xs text-[var(--color-ink-soft)]">
                      {secao.conteudoOriginal.map((linha, i) => (
                        <li key={i}>{linha}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-md bg-[var(--color-well)] p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-[var(--color-muted)]">Currículo ATS</p>
                  {secao.conteudoOtimizado.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">— vazio —</p>
                  ) : (
                    <ul className="flex flex-col gap-1 text-xs text-[var(--color-ink-soft)]">
                      {secao.conteudoOtimizado.map((linha, i) => (
                        <li key={i}>{linha}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
