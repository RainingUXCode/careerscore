import { useState } from 'react'
import type { ResultadoProcessamento, SugestaoCarreira } from '../types/models'
import type { HistoricoScoreItem } from '../services/historyService'
import { Card } from '../components/ui/Card'
import { ReportCard } from '../components/report/ReportCard'
import { SmallStat } from '../components/report/SmallStat'
import { VagaCard } from '../components/report/VagaCard'
import { PlanoAcaoList } from '../components/report/PlanoAcaoList'
import { ExportarPdfButton } from '../components/report/ExportarPdfButton'
import { Button } from '../components/ui/Button'
import { ScoreBreakdownChart } from '../components/report/ScoreBreakdownChart'
import { ScoreHistoryChart } from '../components/report/ScoreHistoryChart'
import { BenchmarkCard } from '../components/report/BenchmarkCard'
import { ScoreSimulator } from '../components/report/ScoreSimulator'
import { AtsCompatibilityCard } from '../components/report/AtsCompatibilityCard'
import { PrivacyNotice } from '../components/report/PrivacyNotice'
import { MarketPatternChart } from '../components/report/MarketPatternChart'
import { RecursosEstudoList } from '../components/report/RecursosEstudoList'
import { CurriculoTab } from '../components/report/CurriculoTab'
import { obterRecursosEstudo } from '../data/recursosEstudo'
import { obterPlataformasRecomendadas } from '../data/plataformasPorArea'
import { resolverAreaDoCandidato } from '../services/areaBridgeService'
import { mensagemFallbackJSearch } from '../services/vagasMensagemService'
import { rotuloNivelAtual } from '../services/nivelAtualService'

type AbaRelatorio = 'perfil' | 'vagas' | 'plano' | 'curriculo'

interface ReportPageProps {
  resultado: ResultadoProcessamento
  historico: HistoricoScoreItem[]
  onReanalisar: () => void
  onReiniciar: () => void
  onAtualizarVagas: () => void | Promise<void>
  onEscolherSugestao: (sugestao: SugestaoCarreira) => void
}

const abas: Array<{ id: AbaRelatorio; label: string }> = [
  { id: 'perfil', label: 'Análise de perfil' },
  { id: 'vagas', label: 'Vagas' },
  { id: 'plano', label: 'Plano de ação' },
  { id: 'curriculo', label: 'Currículo ATS' },
]

function carregarConclusoes(idAnalise: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}

  try {
    const bruto = window.localStorage.getItem(`careerscore:plano:${idAnalise}`)
    return bruto ? JSON.parse(bruto) : {}
  } catch {
    return {}
  }
}

function obterLink(candidato: ResultadoProcessamento['candidato'], tipo: string): string | undefined {
  return candidato.links.find((link) => link.tipo.toLowerCase().includes(tipo.toLowerCase()))?.url
}

function formatarDataAnalise(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function ReportPage({ resultado, historico, onReanalisar, onReiniciar, onAtualizarVagas, onEscolherSugestao }: ReportPageProps) {
  const { candidato, analise, recomendacoes } = resultado
  const [abaAtiva, setAbaAtiva] = useState<AbaRelatorio>('perfil')
  const [tarefasConcluidas, setTarefasConcluidas] = useState<Record<string, boolean>>(() =>
    carregarConclusoes(analise.idAnalise),
  )
  const totalConcluidas = Object.values(tarefasConcluidas).filter(Boolean).length
  const linkedin = obterLink(candidato, 'LinkedIn')
  const github = obterLink(candidato, 'GitHub')
  const portfolio = obterLink(candidato, 'portf')
  const certificados = candidato.certificados ?? []
  const nivelAtual = rotuloNivelAtual(candidato)

  function alternarConclusao(idPlano: string) {
    setTarefasConcluidas((atuais) => {
      const proximas = { ...atuais, [idPlano]: !atuais[idPlano] }
      window.localStorage.setItem(`careerscore:plano:${analise.idAnalise}`, JSON.stringify(proximas))
      return proximas
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="border-b border-[var(--color-line)] bg-[linear-gradient(135deg,#0F172A_0%,#1E3A5F_52%,#0F172A_100%)] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-[var(--color-line)] bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-bright)]">
              Agente de carreira - relatório personalizado
            </span>
            <div className="flex flex-wrap gap-3 print:hidden">
              <ExportarPdfButton />
              <Button variant="secondary" onClick={onReanalisar}>
                Recalcular análise
              </Button>
              <Button variant="ghost" onClick={onReiniciar}>
                Nova análise
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Relatório de {candidato.nome || 'candidato'} · gerado em {formatarDataAnalise(analise.dataAnalise)}
              </p>
              <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
                Sua análise de carreira
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {analise.resumoProfissional}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-1.5 text-xs text-[var(--color-muted)]">
                  {candidato.areaInteresse.nome}
                </span>
                <span className="rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-1.5 text-xs text-[var(--color-muted)]">
                  {nivelAtual}
                </span>
                <span className="rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-1.5 text-xs text-[var(--color-muted)]">
                  {candidato.cidade}, {candidato.estado}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {github && <a className="text-xs font-medium text-[var(--color-primary-bright)] hover:underline" href={github} target="_blank" rel="noreferrer">GitHub</a>}
                {linkedin && <a className="text-xs font-medium text-[var(--color-primary-bright)] hover:underline" href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                {portfolio && <a className="text-xs font-medium text-[var(--color-primary-bright)] hover:underline" href={portfolio} target="_blank" rel="noreferrer">Portfolio</a>}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-well)]/80 p-5">
              <div className="flex items-center gap-5">
                <div>
                  <p className="font-mono text-6xl font-black leading-none text-[var(--color-primary)]">
                    {analise.scoreEmpregabilidade}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Pontuação global</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {recomendacoes.length} vaga{recomendacoes.length === 1 ? '' : 's'} recomendada{recomendacoes.length === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                    Apenas oportunidades abertas, recentes, na modalidade escolhida e coerentes com seu nível.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-well)]/95 px-6 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto">
          {abas.map((aba) => (
            <button
              key={aba.id}
              className={`border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${
                abaAtiva === aba.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary-bright)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="print-reveal" data-active={abaAtiva === 'perfil' ? 'true' : 'false'}>
          <div className="grid gap-5">
            <PrivacyNotice />

            {resultado.sugestoesCarreira && resultado.sugestoesCarreira.length > 0 && (
              <ReportCard title="Caminhos profissionais para explorar">
                <div className="grid gap-4">
                  <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    Como você ainda não definiu um objetivo profissional, estas sugestões são mais amplas e usam apenas evidências declaradas no seu perfil.
                  </p>
                  {resultado.sugestoesCarreira.map((sugestao) => (
                    <div key={sugestao.id} className="rounded-lg border border-[var(--color-line)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[var(--color-ink)]">{sugestao.area}</h3>
                          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{sugestao.mensagemCautelosa}</p>
                          <p className="mt-2 text-xs text-[var(--color-muted)]">
                            Afinidade estimada: {sugestao.afinidadeEstimada}% · confiança: {Math.round(sugestao.confianca * 100)}%
                          </p>
                        </div>
                        <Button variant="secondary" onClick={() => onEscolherSugestao(sugestao)}>
                          Usar como objetivo
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-[var(--color-ink-soft)]">
                        <p><strong>Cargos de entrada:</strong> {sugestao.cargosEntrada.join(', ')}</p>
                        <p><strong>Evidências:</strong> {sugestao.evidencias.slice(0, 3).join(' ')}</p>
                        <p><strong>Lacunas:</strong> {sugestao.lacunas.slice(0, 3).join(', ')}</p>
                        <p><strong>Primeiro passo:</strong> {sugestao.acaoPraticaInicial}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            <section className="grid items-start gap-5 lg:grid-cols-2">
              <ReportCard title="Como o score foi montado">
                <ScoreBreakdownChart detalhes={analise.pontuacaoDetalhes} />
              </ReportCard>
              <ReportCard title="Histórico do score">
                <ScoreHistoryChart historico={historico} />
              </ReportCard>
              <ReportCard title="Benchmark da área">
                <BenchmarkCard analise={analise} area={candidato.areaInteresse.nome} />
              </ReportCard>
              <ReportCard title="Simulador e se" className="print:hidden">
                <ScoreSimulator candidato={candidato} scoreAtual={analise.scoreEmpregabilidade} />
              </ReportCard>
            </section>

            {resultado.contextoExterno?.github && (
              <ReportCard title="Análise real do GitHub">
                {(() => {
                  const github = resultado.contextoExterno!.github!
                  if (!github.encontrado) {
                    return (
                      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        {github.erro ?? 'Não foi possível analisar este perfil do GitHub agora.'}
                      </p>
                    )
                  }
                  return (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <SmallStat label="Repositórios públicos" value={github.totalRepositoriosPublicos} />
                      <SmallStat
                        label="README de perfil"
                        value={github.temReadmePerfil ? 'Sim' : 'Não encontrado'}
                      />
                      <SmallStat
                        label="Última atividade"
                        value={
                          github.diasDesdeUltimaAtividade === null
                            ? 'Sem dados'
                            : github.diasDesdeUltimaAtividade <= 1
                              ? 'Hoje'
                              : `Há ${github.diasDesdeUltimaAtividade} dias`
                        }
                      />
                      <div className="sm:col-span-3">
                        <p className="mb-1.5 text-xs text-[var(--color-muted)]">Linguagens mais usadas</p>
                        {github.linguagens.length === 0 ? (
                          <p className="text-sm text-[var(--color-muted)]">Nenhuma linguagem identificada nos repositórios públicos.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {github.linguagens.map((linguagem) => (
                              <span key={linguagem} className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary-bright)]">
                                {linguagem}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Dados obtidos em tempo real via API pública do GitHub (github.com/{resultado.contextoExterno.github.usuario || '...'}).
                </p>
              </ReportCard>
            )}

            <section className="grid items-start gap-5 lg:grid-cols-2">
              <ReportCard title="Pontos fortes">
                <ul className="grid gap-3">
                  {analise.pontosFortes.map((ponto) => (
                    <li key={ponto} className="rounded-lg bg-[var(--color-well)] p-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      <span className="mr-2 font-semibold text-[var(--color-score-high)]">OK</span>
                      {ponto}
                    </li>
                  ))}
                </ul>
              </ReportCard>
              <ReportCard title="Pontos de melhoria">
                <ul className="grid gap-3">
                  {analise.pontosMelhorar.map((ponto) => (
                    <li key={ponto} className="rounded-lg bg-[var(--color-well)] p-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      <span className="mr-2 font-semibold text-[var(--color-score-mid)]">!</span>
                      {ponto}
                    </li>
                  ))}
                </ul>
              </ReportCard>
            </section>

            <section className="grid items-start gap-5 lg:grid-cols-2">
              <ReportCard title="Competências faltantes">
                {analise.competenciasFaltantes.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">Nenhuma lacuna crítica identificada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analise.competenciasFaltantes.map((competencia) => (
                      <span key={competencia} className="rounded-full bg-[var(--color-score-mid-soft)] px-3 py-1 text-xs font-medium text-[var(--color-score-mid)]">
                        {competencia}
                      </span>
                    ))}
                  </div>
                )}
              </ReportCard>
              <ReportCard title="Compatibilidade com ATS">
                {resultado.atsAnalise ? (
                  <AtsCompatibilityCard resultado={resultado.atsAnalise} />
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">Análise de ATS não disponível para este relatório.</p>
                )}
              </ReportCard>
            </section>

            {certificados.length > 0 && (
              <ReportCard title="Certificados e cursos">
                <div className="grid gap-3 lg:grid-cols-2">
                  {certificados.map((certificado) => {
                    const competenciasDetectadas =
                      resultado.contextoExterno?.competenciasPorCertificado?.[certificado.idCertificado] ?? []
                    return (
                      <div key={certificado.idCertificado} className="rounded-lg bg-[var(--color-well)] p-4">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {certificado.titulo || 'Certificado sem título'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {certificado.instituicao || 'Instituição não informada'}
                          {certificado.cargaHoraria ? ` - ${certificado.cargaHoraria}` : ''}
                        </p>
                        {certificado.nomeArquivo && (
                          <p className="mt-2 text-xs text-[var(--color-primary-bright)]">
                            Evidência anexada: {certificado.nomeArquivo}
                          </p>
                        )}
                        {competenciasDetectadas.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 text-[11px] text-[var(--color-muted)]">
                              Competências identificadas no conteúdo do arquivo:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {competenciasDetectadas.map((competencia) => (
                                <span key={competencia} className="rounded-full bg-[var(--color-score-high-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-score-high)]">
                                  {competencia}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ReportCard>
            )}

            <ReportCard title="Sugestões para o currículo">
              <ul className="grid gap-2">
                {analise.sugestoesCurriculo.map((sugestao) => (
                  <li key={sugestao} className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {sugestao}
                  </li>
                ))}
              </ul>
            </ReportCard>
          </div>
        </div>

        <div className="print-reveal" data-active={abaAtiva === 'vagas' ? 'true' : 'false'}>
          <div className="grid gap-5">
            {(() => {
              const vagasAgora = recomendacoes.filter((r) => r.compatibilidade.compatibilidadeGeral >= 80)
              const vagasMonitorar = recomendacoes.filter((r) => r.compatibilidade.compatibilidadeGeral < 80)
              const padraoMercado = resultado.padraoMercado ?? []
              const recursos = obterRecursosEstudo(analise.competenciasFaltantes)
              const areaCandidato = resolverAreaDoCandidato(candidato)
              const plataformas = obterPlataformasRecomendadas(areaCandidato?.id)
              const temVagasDemonstracao = recomendacoes.some((r) => r.vaga.fonte.tipo === 'demonstracao')
              const temVagasReais = recomendacoes.some((r) => r.vaga.fonte.tipo === 'real')
              const meta = resultado.metaVagas
              const totalVagasEncontradas = meta?.totalVagasEncontradas ?? recomendacoes.length
              const totalVagasRecentes = meta?.totalVagasRecentes ?? recomendacoes.length
              const fonteRealFalhou = Boolean(meta?.codigosErro.length)

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-4 py-3 print:hidden">
                    <div className="text-xs text-[var(--color-muted)]">
                      {meta ? (
                        <>
                          {meta.usouFallback || temVagasDemonstracao ? (
                            <span>Fonte: vagas de demonstração</span>
                          ) : fonteRealFalhou ? (
                            <span>Fonte real indisponível nesta consulta</span>
                          ) : (
                            <span>Fonte: JSearch</span>
                          )}
                          {' · '}
                          {totalVagasEncontradas} vaga{totalVagasEncontradas === 1 ? '' : 's'} encontrada{totalVagasEncontradas === 1 ? '' : 's'}
                          {' · '}
                          {totalVagasRecentes} recente{totalVagasRecentes === 1 ? '' : 's'}
                          {' · '}
                          {recomendacoes.length} recomendada{recomendacoes.length === 1 ? '' : 's'}
                          {' · '}
                          Resultados consultados em {new Date(meta.consultadoEm).toLocaleString('pt-BR')}
                          {meta.deCache ? ' (em cache)' : ''}
                          {temVagasReais
                            ? '. Confirme disponibilidade no link original antes de se candidatar.'
                            : '. Resultados de demonstracao nao devem ser usados para candidatura.'}
                        </>
                      ) : (
                        'Buscando vagas...'
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => onAtualizarVagas()}
                      title="Atualizar consulta novamente a fonte de vagas e pode consumir parte da cota gratuita."
                    >
                      Atualizar vagas
                    </Button>
                  </div>

                  {candidato.objetivoProfissional.modo === 'exploracao' && (
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] px-4 py-3 text-sm leading-relaxed text-[var(--color-muted)]">
                      Como você ainda não definiu um objetivo profissional, estas recomendações são mais amplas. Escolher uma área ou cargo aumentará a precisão.
                    </div>
                  )}

                  {meta && meta.codigosErro.length > 0 && (
                    <div className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[var(--color-score-low)]">
                      {mensagemFallbackJSearch(meta.codigosErro)}
                    </div>
                  )}

                  {temVagasDemonstracao && (
                    <div className="rounded-xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--color-score-mid)]">
                      <strong>Vagas de demonstração:</strong> nenhuma fonte real de vagas está conectada ainda; as vagas
                      abaixo servem para validar a análise de compatibilidade, não para candidatura real.
                    </div>
                  )}

                  {temVagasReais ? (
                    <div className="rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-sm text-[var(--color-score-high)]">
                      <strong>Alta aderencia para candidatura:</strong> vagas reais recentes, dentro da sua modalidade e com alta aderencia ao seu perfil.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-sm text-[var(--color-score-high)]">
                      <strong>Alta aderencia em demonstracao:</strong> exemplos usados para validar compatibilidade. Nao sao oportunidades para candidatura real.
                    </div>
                  )}
                  {vagasAgora.length === 0 ? (
                    <ReportCard title="Nenhuma vaga de alta aderência ainda">
                      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        {recomendacoes.length === 0 && totalVagasRecentes > 0 ? (
                          `${totalVagasRecentes} vaga${totalVagasRecentes === 1 ? '' : 's'} recente${totalVagasRecentes === 1 ? '' : 's'} foram avaliadas, mas nenhuma atingiu o corte de 70% de compatibilidade para recomendacao.`
                        ) : totalVagasEncontradas === 0 ? (
                          'A fonte de vagas nao retornou oportunidades para os filtros atuais nesta consulta.'
                        ) : (
                          <>
                        Nenhuma vaga atingiu 80% de compatibilidade ainda. Veja abaixo as que valem monitorar enquanto seu perfil evolui.
                          </>
                        )}
                      </p>
                    </ReportCard>
                  ) : (
                    vagasAgora.map((recomendacao) => <VagaCard key={recomendacao.vaga.id} recomendacao={recomendacao} />)
                  )}

                  <div className="mt-2 rounded-xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--color-score-mid)]">
                    <strong>Fique de olho:</strong> boa aderência, mas vale reforçar algum requisito antes ou acompanhar a vaga.
                  </div>
                  {vagasMonitorar.length === 0 ? (
                    <ReportCard title="Nada para monitorar no momento">
                      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        {recomendacoes.length === 0 ? (
                          'Nenhuma vaga ficou na faixa de monitoramento desta consulta.'
                        ) : (
                          <>
                        Todas as vagas encontradas já estão na faixa de candidatura imediata.
                          </>
                        )}
                      </p>
                    </ReportCard>
                  ) : (
                    vagasMonitorar.map((recomendacao) => <VagaCard key={recomendacao.vaga.id} recomendacao={recomendacao} />)
                  )}

                  <ReportCard title="Onde monitorar vagas agora">
                    <div className="flex flex-col gap-2">
                      {plataformas.map((plataforma) => (
                        <div key={plataforma.nome} className="rounded-lg bg-[var(--color-well)] p-3">
                          {plataforma.url ? (
                            <a
                              href={plataforma.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                            >
                              {plataforma.nome} ↗
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{plataforma.nome}</p>
                          )}
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{plataforma.nota}</p>
                        </div>
                      ))}
                    </div>
                  </ReportCard>

                  <ReportCard title="Padrões do mercado para seu perfil">
                    <MarketPatternChart itens={padraoMercado} />
                  </ReportCard>

                  <ReportCard title="Recursos para desenvolver o que falta (gratuitos)">
                    <RecursosEstudoList recursos={recursos} />
                  </ReportCard>

                  <ReportCard title="Resumo dos filtros usados">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <SmallStat label="Recência" value="Até 45 dias" />
                      <SmallStat label="Modalidade" value={candidato.modalidadesPreferidas.join(', ') || 'Sem preferência informada'} />
                      <SmallStat label="Nível" value={nivelAtual} />
                      <SmallStat label="Área considerada" value={areaCandidato?.nome ?? 'Não identificada'} />
                    </div>
                  </ReportCard>
                </>
              )
            })()}
          </div>
        </div>

        <div className="print-reveal" data-active={abaAtiva === 'plano' ? 'true' : 'false'}>
          <div className="grid gap-5">
            {(() => {
              const hoje = new Date()
              const diasAte = (prazo: string) => {
                const alvo = new Date(`${prazo}T00:00:00`)
                return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
              }
              const fases: Array<{ titulo: string; cor: string; tarefas: typeof analise.planoAcao }> = [
                { titulo: 'Esta semana', cor: 'var(--color-score-low)', tarefas: [] },
                { titulo: 'Próximas semanas', cor: 'var(--color-score-mid)', tarefas: [] },
                { titulo: 'Este mês e além', cor: 'var(--color-primary)', tarefas: [] },
              ]
              analise.planoAcao.forEach((tarefa) => {
                const dias = diasAte(tarefa.prazo)
                if (dias <= 7) fases[0].tarefas.push(tarefa)
                else if (dias <= 21) fases[1].tarefas.push(tarefa)
                else fases[2].tarefas.push(tarefa)
              })

              return (
                <>
                  <ReportCard title="Plano de ação com progresso">
                    <p className="text-sm text-[var(--color-muted)]">
                      {totalConcluidas} de {analise.planoAcao.length} tarefas concluídas neste navegador.
                    </p>
                  </ReportCard>

                  {fases
                    .filter((fase) => fase.tarefas.length > 0)
                    .map((fase) => (
                      <Card
                        key={fase.titulo}
                        className="rounded-xl p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]"
                        style={{ borderLeft: `3px solid ${fase.cor}` }}
                      >
                        <h2 className="mb-4 font-display text-base font-semibold" style={{ color: fase.cor }}>
                          {fase.titulo}
                        </h2>
                        <PlanoAcaoList
                          tarefas={fase.tarefas}
                          concluidas={tarefasConcluidas}
                          onAlternarConclusao={alternarConclusao}
                        />
                      </Card>
                    ))}
                </>
              )
            })()}

            <ReportCard title="Prioridade prática">
              <div className="grid gap-3 lg:grid-cols-3">
                <SmallStat label="Agora" value="Executar tarefas de alta prioridade e candidatar nas vagas elegíveis." />
                <SmallStat label="Próximas semanas" value="Fechar competências faltantes que aparecem no relatório." />
                <SmallStat label="Retorno" value="Refazer a análise e comparar a evolução no histórico do score." />
              </div>
            </ReportCard>
          </div>
        </div>

        <CurriculoTab resultado={resultado} ativa={abaAtiva === 'curriculo'} />
      </main>
    </div>
  )
}
