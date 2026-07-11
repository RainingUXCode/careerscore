import type { AtsAnalysisResult } from '../../types/engine'
import { Badge } from '../ui/Badge'

function tomPorNota(nota: number): 'high' | 'mid' | 'low' {
  if (nota >= 7) return 'high'
  if (nota >= 4) return 'mid'
  return 'low'
}

export function AtsCompatibilityCard({ resultado }: { resultado: AtsAnalysisResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-ink-soft)]">{resultado.resumo}</p>
        <span className="whitespace-nowrap font-mono text-2xl font-semibold text-[var(--color-primary)]">
          {resultado.notaGeral}
        </span>
      </div>

      {!resultado.baseadoEmTexto && (
        <p className="rounded-lg bg-[var(--color-well)] p-3 text-xs text-[var(--color-muted)]">
          ⚠️ Nota estimada apenas com os dados do formulário, sem o conteúdo real do currículo — menos precisa que
          uma análise com texto. Veja a categoria "Estrutura" abaixo para o motivo específico.
        </p>
      )}

      <ul className="grid gap-3">
        {resultado.categorias.map((categoria) => (
          <li key={categoria.chave} className="rounded-lg border border-[var(--color-line)] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">{categoria.nome}</span>
              <Badge tone={tomPorNota(categoria.nota)}>{categoria.nota}/10</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{categoria.justificativa}</p>
            {categoria.recomendacoes.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {categoria.recomendacoes.map((recomendacao) => (
                  <li key={recomendacao} className="text-xs text-[var(--color-muted)]">
                    • {recomendacao}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
