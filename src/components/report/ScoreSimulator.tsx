import { useMemo, useState } from 'react'
import type { Candidato, Curriculo } from '../../types/models'
import { FormatoCurriculo, TipoCompetencia, TipoLink } from '../../types/enums'
import { analysisService } from '../../services/analysisService'
import { gerarId } from '../../utils/id'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

function temCompetencia(candidato: Candidato, nome: string): boolean {
  return candidato.competencias.some((competencia) => competencia.nome.toLowerCase() === nome.toLowerCase())
}

function montarCandidatoSimulado(
  candidato: Candidato,
  opcoes: { react: boolean; evidencia: boolean; curriculo: boolean; competenciaExtra: string },
): Candidato {
  const competencias = [...candidato.competencias]
  const adicionarCompetencia = (nome: string) => {
    if (!nome.trim() || competencias.some((competencia) => competencia.nome.toLowerCase() === nome.trim().toLowerCase())) return
    competencias.push({
      idCompetencia: gerarId('sim-comp'),
      nome: nome.trim(),
      tipo: TipoCompetencia.TECNICA,
    })
  }

  if (opcoes.react) adicionarCompetencia('React')
  adicionarCompetencia(opcoes.competenciaExtra)

  const links = [...candidato.links]
  if (opcoes.evidencia && !links.some((link) => /github|portfolio|portf|behance|dribbble/i.test(`${link.tipo} ${link.url}`))) {
    links.push({
      idLink: gerarId('sim-link'),
      tipo: TipoLink.PORTFOLIO,
      url: 'https://portfolio.example.com',
    })
  }

  const curriculo: Curriculo | undefined = opcoes.curriculo
    ? candidato.curriculo ?? {
        idCurriculo: gerarId('sim-curr'),
        nomeArquivo: 'Curriculo_simulado.pdf',
        formato: FormatoCurriculo.PDF,
        dataUpload: new Date().toISOString(),
      }
    : undefined

  return { ...candidato, competencias, links, curriculo }
}

export function ScoreSimulator({ candidato, scoreAtual }: { candidato: Candidato; scoreAtual: number }) {
  const [react, setReact] = useState(!temCompetencia(candidato, 'React'))
  const [evidencia, setEvidencia] = useState(!candidato.links.some((link) => /github|portfolio|portf|behance|dribbble/i.test(`${link.tipo} ${link.url}`)))
  const [curriculo, setCurriculo] = useState(true)
  const [competenciaExtra, setCompetenciaExtra] = useState('')

  const scoreSimulado = useMemo(() => {
    const simulado = montarCandidatoSimulado(candidato, { react, evidencia, curriculo, competenciaExtra })
    return analysisService.calcularScore(simulado)
  }, [candidato, competenciaExtra, curriculo, evidencia, react])

  const delta = scoreSimulado - scoreAtual

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={delta >= 0 ? 'high' : 'low'}>
          {delta >= 0 ? '+' : ''}
          {delta} pts
        </Badge>
        <span className="font-mono text-3xl font-semibold text-[var(--color-ink)]">{scoreSimulado}</span>
      </div>

      <div className="grid gap-3 text-sm text-[var(--color-ink-soft)]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={react} onChange={(e) => setReact(e.target.checked)} />
          React
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={evidencia} onChange={(e) => setEvidencia(e.target.checked)} />
          Evidência pública de projeto
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={curriculo} onChange={(e) => setCurriculo(e.target.checked)} />
          Currículo anexado
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            label="Competência extra"
            value={competenciaExtra}
            onChange={(e) => setCompetenciaExtra(e.target.value)}
          />
          <Button variant="secondary" className="self-end" onClick={() => setCompetenciaExtra('')}>
            Limpar
          </Button>
        </div>
      </div>
    </div>
  )
}
