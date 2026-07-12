import { useState } from 'react'
import type { Candidato } from '../types/models'
import { useCandidatoForm } from '../hooks/useCandidatoForm'
import { validationService, type ErrosValidacao } from '../services/validationService'
import { StepIndicator } from '../components/form/StepIndicator'
import { DadosPessoaisSection } from '../components/form/DadosPessoaisSection'
import { AreaInteresseSection } from '../components/form/AreaInteresseSection'
import { ObjetivoProfissionalSection } from '../components/form/ObjetivoProfissionalSection'
import { EscolaridadeSection } from '../components/form/EscolaridadeSection'
import { ExperienciaSection } from '../components/form/ExperienciaSection'
import { CompetenciasSection } from '../components/form/CompetenciasSection'
import { CertificadosSection } from '../components/form/CertificadosSection'
import { IdiomasSection } from '../components/form/IdiomasSection'
import { LinksSection } from '../components/form/LinksSection'
import { CurriculoSection } from '../components/form/CurriculoSection'
import { Button } from '../components/ui/Button'

interface FormPageProps {
  onConcluir: (candidato: Candidato) => void
}

const etapas = [
  'Perfil e área de interesse',
  'Objetivo profissional',
  'Escolaridade',
  'Experiência',
  'Competências',
  'Certificados',
  'Idiomas',
  'Links profissionais',
  'Currículo',
]

export function FormPage({ onConcluir }: FormPageProps) {
  const form = useCandidatoForm()
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [erros, setErros] = useState<ErrosValidacao>({})
  const [erroCurriculo, setErroCurriculo] = useState<string | null>(null)

  function validarEtapaAtual(): boolean {
    if (etapaAtual === 0) {
      const novosErros = {
        ...validationService.validarDadosPessoais(form.candidato),
        ...validationService.validarAreaInteresse(form.candidato),
      }
      setErros(novosErros)
      return Object.keys(novosErros).length === 0
    }
    if (etapaAtual === 1) {
      const novosErros = validationService.validarObjetivoProfissional(form.candidato)
      setErros(novosErros)
      return Object.keys(novosErros).length === 0
    }
    if (etapaAtual === 7) {
      const novosErros = validationService.validarLinks(form.candidato.links)
      setErros(novosErros)
      return Object.keys(novosErros).length === 0
    }
    if (etapaAtual === 8) {
      const erro = validationService.validarCurriculo(form.candidato.curriculo?.arquivo)
      setErroCurriculo(erro)
      return erro === null
    }
    return true
  }

  function avancar() {
    if (!validarEtapaAtual()) return
    if (etapaAtual === etapas.length - 1) {
      onConcluir(form.candidato)
      return
    }
    setEtapaAtual((e) => Math.min(e + 1, etapas.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function voltar() {
    setEtapaAtual((e) => Math.max(e - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              const confirmado = window.confirm(
                'Isso vai apagar todos os dados preenchidos neste navegador e recomeçar o formulário do zero. Deseja continuar?',
              )
              if (!confirmado) return
              form.limparRascunho()
              setEtapaAtual(0)
              setErros({})
              setErroCurriculo(null)
            }}
            className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-score-low)] hover:underline"
          >
            Limpar rascunho e recomeçar
          </button>
        </div>
        <StepIndicator etapas={etapas} etapaAtual={etapaAtual} />

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-8">
          {etapaAtual === 0 && (
            <div className="flex flex-col gap-8">
              <DadosPessoaisSection candidato={form.candidato} atualizarCampo={form.atualizarCampo} erros={erros} />
              <div className="border-t border-[var(--color-line)] pt-6">
                <AreaInteresseSection
                  candidato={form.candidato}
                  atualizarAreaInteresse={form.atualizarAreaInteresse}
                  erros={erros}
                />
              </div>
            </div>
          )}
          {etapaAtual === 1 && (
            <ObjetivoProfissionalSection
              candidato={form.candidato}
              atualizarCampo={form.atualizarCampo}
              erros={erros}
            />
          )}
          {etapaAtual === 2 && (
            <EscolaridadeSection
              escolaridades={form.candidato.escolaridades}
              adicionar={form.adicionarEscolaridade}
              atualizar={form.atualizarEscolaridade}
              remover={form.removerEscolaridade}
            />
          )}
          {etapaAtual === 3 && (
            <ExperienciaSection
              experiencias={form.candidato.experiencias}
              adicionar={form.adicionarExperiencia}
              atualizar={form.atualizarExperiencia}
              remover={form.removerExperiencia}
            />
          )}
          {etapaAtual === 4 && (
            <CompetenciasSection
              competencias={form.candidato.competencias}
              areaInteresse={form.candidato.areaInteresse.nome}
              adicionar={form.adicionarCompetencia}
              remover={form.removerCompetencia}
            />
          )}
          {etapaAtual === 5 && (
            <CertificadosSection
              certificados={form.candidato.certificados}
              adicionar={form.adicionarCertificado}
              atualizar={form.atualizarCertificado}
              remover={form.removerCertificado}
              definirArquivo={form.definirArquivoCertificado}
              removerArquivo={form.removerArquivoCertificado}
            />
          )}
          {etapaAtual === 6 && (
            <IdiomasSection
              idiomas={form.candidato.idiomas}
              adicionar={form.adicionarIdioma}
              atualizar={form.atualizarIdioma}
              remover={form.removerIdioma}
            />
          )}
          {etapaAtual === 7 && (
            <LinksSection
              areaInteresse={form.candidato.areaInteresse}
              links={form.candidato.links}
              adicionar={form.adicionarLink}
              atualizar={form.atualizarLink}
              remover={form.removerLink}
              erros={erros}
            />
          )}
          {etapaAtual === 8 && (
            <CurriculoSection
              curriculo={form.candidato.curriculo}
              definirCurriculo={form.definirCurriculo}
              removerCurriculo={form.removerCurriculo}
              erro={erroCurriculo}
            />
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={voltar} disabled={etapaAtual === 0}>
            Voltar
          </Button>
          <Button onClick={avancar}>
            {etapaAtual === etapas.length - 1 ? 'Gerar minha análise' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
