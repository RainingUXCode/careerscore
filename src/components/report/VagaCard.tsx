import { useState } from 'react'
import type { VagaRecomendada } from '../../types/compatibilidade'
import type { RecomendacaoCandidatura } from '../../types/compatibilidade'
import { Badge } from '../ui/Badge'
import { formatarSenioridadeVaga } from '../../services/senioridadeVagaService'

const labelRecomendacao: Record<RecomendacaoCandidatura, string> = {
  recomendada: '✅ Candidatura recomendada',
  recomendada_com_ressalvas: '👍 Recomendada com ressalvas',
  avaliar_com_cuidado: '🤔 Avaliar com cuidado',
  nao_recomendada: '⚠️ Não recomendada',
}

const tonePorRecomendacao: Record<RecomendacaoCandidatura, 'high' | 'primary' | 'mid' | 'low'> = {
  recomendada: 'high',
  recomendada_com_ressalvas: 'primary',
  avaliar_com_cuidado: 'mid',
  nao_recomendada: 'low',
}

function formatarDataPublicacao(data?: string): string {
  if (!data) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${data}T00:00:00`))
}

function formatarSalario(vaga: VagaRecomendada['vaga']): string {
  if (!vaga.salario) return 'Salário não informado'
  const { minimo, maximo, moeda } = vaga.salario
  if (minimo && maximo) return `${moeda} ${minimo.toLocaleString('pt-BR')} – ${maximo.toLocaleString('pt-BR')}`
  if (minimo) return `A partir de ${moeda} ${minimo.toLocaleString('pt-BR')}`
  if (maximo) return `Até ${moeda} ${maximo.toLocaleString('pt-BR')}`
  return 'Salário não informado'
}

function principaisMotivosBaixaAderencia(recomendacao: VagaRecomendada): string[] {
  const { vaga, compatibilidade } = recomendacao
  const motivos: string[] = []
  const dimensaoPorChave = new Map(compatibilidade.dimensoes.map((dimensao) => [dimensao.chave, dimensao]))
  const senioridade = dimensaoPorChave.get('senioridade')
  const cargo = dimensaoPorChave.get('cargo')
  const tecnicas = dimensaoPorChave.get('competencias_tecnicas')
  const localizacao = dimensaoPorChave.get('localizacao')
  const modalidade = dimensaoPorChave.get('modalidade')

  if (!vaga.senioridadeInformada || senioridade?.avaliada === false) {
    motivos.push('Senioridade não informada pela empresa.')
  }
  if (cargo?.avaliada && (cargo.nota ?? 10) < 7) {
    motivos.push('Cargo apenas parcialmente relacionado ao objetivo informado.')
  }
  if (tecnicas?.requisitosAusentes.length) {
    motivos.push(`Requisitos técnicos ausentes: ${tecnicas.requisitosAusentes.slice(0, 3).join(', ')}.`)
  }
  if (compatibilidade.confiabilidade.percentual < 60) {
    motivos.push('Poucos dados foram fornecidos pela empresa para avaliar a vaga com segurança.')
  }
  if (tecnicas?.requisitosParciais.length && !tecnicas.requisitosAusentes.length) {
    motivos.push('Tecnologias relacionadas aparecem como aderência parcial, não equivalência total.')
  }
  if (modalidade?.avaliada === false || localizacao?.avaliada === false) {
    motivos.push('Modalidade ou localização incertas na descrição da vaga.')
  }

  return motivos.slice(0, 4)
}

export function VagaCard({ recomendacao }: { recomendacao: VagaRecomendada }) {
  const { vaga, compatibilidade } = recomendacao
  const [expandida, setExpandida] = useState(false)
  const motivosBaixaAderencia = compatibilidade.compatibilidadeGeral < 60 ? principaisMotivosBaixaAderencia(recomendacao) : []

  return (
    <article
      className={`cursor-pointer rounded-xl border bg-[var(--color-canvas-raised)] p-5 transition-colors ${
        expandida ? 'border-[var(--color-primary)]' : 'border-[var(--color-line)] hover:border-[var(--color-primary)]'
      }`}
      onClick={() => setExpandida((atual) => !atual)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {vaga.fonte.tipo === 'demonstracao' && <Badge tone="mid">🧪 Demonstração</Badge>}            {vaga.publico === 'exclusiva_pcd' && <Badge tone="primary">Exclusiva para PcD</Badge>}

            <Badge tone={tonePorRecomendacao[compatibilidade.recomendacaoCandidatura]}>
              {labelRecomendacao[compatibilidade.recomendacaoCandidatura]}
            </Badge>
          </div>
          <h3 className="font-display text-base font-semibold text-[var(--color-ink)]">{vaga.empresa}</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{vaga.titulo}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Fonte: {vaga.fonte.nome} · Publicada em {formatarDataPublicacao(vaga.dataPublicacao)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-4xl font-black leading-none text-[var(--color-primary)]">
            {compatibilidade.compatibilidadeGeral}%
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">compatível</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">confiança {compatibilidade.confiabilidade.percentual}%</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {vaga.modalidadeInformada && vaga.modalidade ? (
          <Badge tone="neutral">{vaga.modalidade}</Badge>
        ) : (
          <Badge tone="neutral">Modalidade não informada</Badge>
        )}
        {vaga.tipoContrato && <Badge tone="neutral">{vaga.tipoContrato}</Badge>}
        <Badge tone="neutral">
          {vaga.localizacao.cidade
            ? `${vaga.localizacao.cidade}/${vaga.localizacao.estado ?? ''}`
            : vaga.localizacao.estado ?? vaga.localizacao.pais}
        </Badge>
      </div>

      <div
        className="print-reveal mt-5 border-t border-[var(--color-line)] pt-5"
        data-active={expandida ? 'true' : 'false'}
        onClick={(e) => e.stopPropagation()}
      >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[var(--color-well)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nível</p>
              <p className="text-sm text-[var(--color-ink)]">
                {formatarSenioridadeVaga(vaga)}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-well)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Salário</p>
              <p className="text-sm text-[var(--color-ink)]">{formatarSalario(vaga)}</p>
            </div>
          </div>

          {compatibilidade.impeditivos.length > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--color-score-low-soft)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-score-low)]">
                ⚠️ Possíveis impeditivos
              </p>
              <ul className="flex flex-col gap-1 text-sm text-[var(--color-ink-soft)]">
                {compatibilidade.impeditivos.map((imp) => (
                  <li key={imp.descricao}>{imp.descricao}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-lg bg-[var(--color-well)] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              Vale a pena se candidatar?
            </p>
            <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">
              {labelRecomendacao[compatibilidade.recomendacaoCandidatura]}
            </p>
            <ul className="flex flex-col gap-1 text-sm text-[var(--color-ink-soft)]">
              {compatibilidade.motivosRecomendacao.map((motivo) => (
                <li key={motivo}>• {motivo}</li>
              ))}
            </ul>
          </div>

          {motivosBaixaAderencia.length > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--color-well)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-score-mid)]">
                Por que a aderência ficou abaixo de 60%
              </p>
              <ul className="flex flex-col gap-1 text-sm text-[var(--color-ink-soft)]">
                {motivosBaixaAderencia.map((motivo) => (
                  <li key={motivo}>• {motivo}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Dimensões da compatibilidade</p>
            {compatibilidade.dimensoes.map((dim) => (
              <div key={dim.chave} className="rounded-lg border border-[var(--color-line)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">{dim.nome}</span>
                  {dim.avaliada ? (
                    <span className="font-mono text-sm text-[var(--color-primary)]">{dim.nota}/10</span>
                  ) : (
                    <Badge tone="neutral">Não avaliada</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{dim.justificativa}</p>
                {dim.requisitosAtendidos.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--color-score-high)]">✓ {dim.requisitosAtendidos.join(', ')}</p>
                )}
                {dim.requisitosParciais.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--color-score-mid)]">~ {dim.requisitosParciais.join(', ')}</p>
                )}
                {dim.requisitosAusentes.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--color-score-low)]">✗ {dim.requisitosAusentes.join(', ')}</p>
                )}
              </div>
            ))}
          </div>

          {compatibilidade.competenciasTransferiveis.length > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--color-well)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                Competências transferíveis
              </p>
              <ul className="flex flex-col gap-2">
                {compatibilidade.competenciasTransferiveis.map((item) => (
                  <li key={item.nome} className="text-sm text-[var(--color-ink-soft)]">
                    <span className="font-medium text-[var(--color-ink)]">{item.nome}:</span> {item.justificativa}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {compatibilidade.experienciasAnteriores.length > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--color-well)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                Experiência prévia e transição
              </p>
              <div className="grid gap-2">
                {compatibilidade.experienciasAnteriores.map((experiencia) => (
                  <div key={experiencia.experienciaId} className="rounded-lg border border-[var(--color-line)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {experiencia.cargo || 'Experiência anterior'}
                        {experiencia.empresa ? ` · ${experiencia.empresa}` : ''}
                      </p>
                      <Badge tone={experiencia.tipoRelacao === 'direta' ? 'high' : experiencia.tipoRelacao === 'relacionada' ? 'primary' : 'neutral'}>
                        {experiencia.tipoRelacao === 'direta'
                          ? 'Diretamente relacionada'
                          : experiencia.tipoRelacao === 'relacionada'
                            ? 'Relacionada'
                            : experiencia.tipoRelacao === 'transferivel'
                              ? 'Competências transferíveis'
                              : 'Evidência baixa'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{experiencia.justificativa}</p>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                      Confiança {Math.round(experiencia.confianca * 100)}%
                      {experiencia.areaDetectada ? ` · área detectada: ${experiencia.areaDetectada}` : ''}
                    </p>
                    {experiencia.competenciasTransferiveis.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {experiencia.competenciasTransferiveis.map((competencia) => (
                          <span key={`${experiencia.experienciaId}-${competencia.nome}`} className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary-bright)]">
                            {competencia.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {compatibilidade.confiabilidade.dimensoesSemDados.length > 0 && (
            <p className="mt-4 text-xs text-[var(--color-muted)]">
              Dados ausentes para: {compatibilidade.confiabilidade.dimensoesSemDados.join(', ')}.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {vaga.beneficios.map((beneficio) => (
                <span key={beneficio} className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
                  {beneficio}
                </span>
              ))}
            </div>
            {vaga.urlOriginal && vaga.fonte.tipo === 'real' && (
              <a
                href={vaga.urlOriginal}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-canvas)] hover:bg-[var(--color-primary-dark)] hover:text-white"
              >
                Ver vaga →
              </a>
            )}
          </div>
        </div>

      <p className="mt-4 text-right text-xs text-[var(--color-muted)]">
        {expandida ? '▲ Fechar detalhes' : '▼ Ver detalhes'}
      </p>
    </article>
  )
}
