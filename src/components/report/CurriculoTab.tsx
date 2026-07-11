import { useState } from 'react'
import type { ResultadoProcessamento } from '../../types/models'
import type { CurriculoOtimizadoResult } from '../../types/engine'
import { useCurriculoEditavel } from '../../hooks/useCurriculoEditavel'
import { CurriculoOtimizadoView } from './CurriculoOtimizadoView'
import { CurriculoOtimizadoEditor } from './CurriculoOtimizadoEditor'
import { CurriculoComparador } from './CurriculoComparador'
import { CurriculoResumoMelhorias } from './CurriculoResumoMelhorias'
import { ReportCard } from './ReportCard'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { exportService } from '../../services/exportService'
import { contarProblemas } from '../../services/curriculoValidacaoService'

interface Props {
  resultado: ResultadoProcessamento
  ativa: boolean
}

type ModoVisualizacao = 'visualizar' | 'comparar' | 'editar'

export function CurriculoTab({ resultado, ativa }: Props) {
  if (!resultado.curriculoOtimizado) {
    return (
      <div className="print-reveal curriculo-tab" data-active={ativa ? 'true' : 'false'}>
        <ReportCard title="Currículo ATS otimizado">
          <p className="text-sm text-[var(--color-muted)]">Currículo otimizado não disponível para este relatório.</p>
        </ReportCard>
      </div>
    )
  }

  return <CurriculoTabConteudo resultado={resultado} ativa={ativa} original={resultado.curriculoOtimizado} />
}

function CurriculoTabConteudo({
  resultado,
  ativa,
  original,
}: Props & { original: CurriculoOtimizadoResult }) {
  const { candidato, analise, atsAnalise } = resultado
  const { curriculo, foiEditado, atualizar, restaurar, comparacao, atsOtimizado, calculandoAts, erros, secaoFoiEditada } =
    useCurriculoEditavel(candidato, original, analise.idAnalise)
  const [modo, setModo] = useState<ModoVisualizacao>('visualizar')
  const [mostrarConfirmacaoExportacao, setMostrarConfirmacaoExportacao] = useState(false)
  const totalProblemas = contarProblemas(erros)

  function irParaPrimeiroErro() {
    requestAnimationFrame(() => {
      const primeiro = document.querySelector('[data-campo-invalido="true"]')
      primeiro?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (primeiro instanceof HTMLElement) primeiro.focus({ preventScroll: true })
    })
  }

  function handleExportarClick() {
    if (totalProblemas > 0) {
      setMostrarConfirmacaoExportacao(true)
      return
    }
    exportService.imprimirCurriculoOtimizado()
  }

  function handleRevisarPendencias() {
    setMostrarConfirmacaoExportacao(false)
    setModo('editar')
    irParaPrimeiroErro()
  }

  function handleExportarMesmoAssim() {
    setMostrarConfirmacaoExportacao(false)
    // Continua usando a versão atual (curriculo), sem alterar nenhum dado.
    exportService.imprimirCurriculoOtimizado()
  }

  return (
    <div className="print-reveal curriculo-tab" data-active={ativa ? 'true' : 'false'}>
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-[var(--color-ink-soft)]">
            {foiEditado
              ? 'As alterações manuais são de responsabilidade do usuário. Revise todas as informações antes de utilizar o currículo em uma candidatura.'
              : 'Gerado apenas com dados reais do formulário, do currículo enviado e do GitHub — nada é inventado.'}
          </p>
          <div className="flex items-center gap-3">
            {totalProblemas > 0 && (
              <span className="text-xs font-medium text-[var(--color-score-mid)]">
                ⚠ {totalProblemas} pendência(s) — veja em "Editar"
              </span>
            )}
            <Button variant="secondary" onClick={handleExportarClick}>
              Exportar currículo em PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant={modo === 'visualizar' ? 'primary' : 'secondary'} onClick={() => setModo('visualizar')}>
            Visualizar
          </Button>
          <Button variant={modo === 'comparar' ? 'primary' : 'secondary'} onClick={() => setModo('comparar')}>
            Perfil cadastrado × Currículo ATS
          </Button>
          <Button variant={modo === 'editar' ? 'primary' : 'secondary'} onClick={() => setModo('editar')}>
            Editar
          </Button>
        </div>

        {modo === 'comparar' && (
          <div className="grid gap-5 print:hidden">
            <p className="text-xs text-[var(--color-muted)]">
              Esta comparação usa os dados estruturados já cadastrados (formulário, GitHub e certificados) — não é uma
              leitura literal do arquivo de currículo enviado.
            </p>
            <ReportCard title="Resumo das melhorias">
              <CurriculoResumoMelhorias atsOriginal={atsAnalise} atsOtimizado={atsOtimizado} calculando={calculandoAts} />
            </ReportCard>
            <ReportCard title="Perfil cadastrado × Currículo ATS, seção por seção">
              <CurriculoComparador comparacao={comparacao} />
            </ReportCard>
          </div>
        )}

        {modo === 'editar' && (
          <div className="grid gap-3 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-muted)]">
                {foiEditado ? 'Você tem alterações manuais salvas neste navegador.' : 'Nenhuma alteração manual ainda.'}
              </p>
              <Button variant="ghost" onClick={restaurar} disabled={!foiEditado}>
                Restaurar versão gerada
              </Button>
            </div>
            <CurriculoOtimizadoEditor
              curriculo={curriculo}
              origens={original.origens}
              secaoFoiEditada={secaoFoiEditada}
              erros={erros}
              onAlterar={atualizar}
            />
          </div>
        )}

        {/*
          A pré-visualização fica sempre no DOM (visível só quando modo === 'visualizar'
          na tela), mas é sempre revelada na impressão via .print-reveal — assim a
          exportação em PDF (relatório completo ou só o currículo) sempre usa a versão
          atual (editada ou não), independentemente do modo em que a tela estava.
        */}
        <div className="print-reveal" data-active={modo === 'visualizar' ? 'true' : 'false'}>
          <CurriculoOtimizadoView curriculo={curriculo} />
        </div>
      </div>

      <ConfirmDialog
        aberto={mostrarConfirmacaoExportacao}
        titulo="Exportar mesmo com pendências?"
        mensagem={`Encontramos ${totalProblemas} pendência(s) de preenchimento (ex: nome vazio, link inválido ou habilidades repetidas). O currículo pode conter informações incompletas ou mal formatadas se exportado agora.`}
        acaoSecundaria={{ rotulo: 'Revisar pendências', onClick: handleRevisarPendencias }}
        acaoPrimaria={{ rotulo: 'Exportar mesmo assim', onClick: handleExportarMesmoAssim }}
        onFechar={() => setMostrarConfirmacaoExportacao(false)}
      />
    </div>
  )
}
