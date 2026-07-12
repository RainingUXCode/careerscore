import { useState } from 'react'
import type { CurriculoOtimizadoResult, OrigemDado, OrigensCurriculo } from '../../types/engine'
import type { ErrosCurriculo } from '../../services/curriculoValidacaoService'
import { normalizarUrl } from '../../services/curriculoValidacaoService'
import { sanitizarLinksPorTipoUrl } from '../../services/linksService'
import { NivelProficiencia } from '../../types/enums'

interface Props {
  curriculo: CurriculoOtimizadoResult
  origens: OrigensCurriculo
  secaoFoiEditada: (secao: keyof CurriculoOtimizadoResult) => boolean
  erros: ErrosCurriculo
  onAlterar: (novo: CurriculoOtimizadoResult) => void
}

const estiloInput =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-500'
const estiloInputErro = estiloInput.replace('border-neutral-300', 'border-red-400')
const estiloTextArea = `${estiloInput} resize-y`
const estiloLabel = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500'

const labelOrigem: Record<OrigemDado, string> = {
  formulario: '📋 Formulário',
  curriculo_enviado: '📄 Currículo enviado',
  github: '🐙 GitHub',
  certificado: '🎓 Certificado',
  gerado_pelo_sistema: '🤖 Gerado pelo sistema',
  editado_manualmente: '✏️ Editado manualmente',
}

/** Badge discreto indicando de onde veio o conteúdo desta seção — some do PDF exportado. */
function OrigemBadge({ origem }: { origem: OrigemDado }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
      {labelOrigem[origem]}
    </span>
  )
}

function CabecalhoSecao({ titulo, origem }: { titulo: string; origem: OrigemDado }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className={estiloLabel + ' mb-0'}>{titulo}</span>
      <OrigemBadge origem={origem} />
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  area = false,
  linhas = 3,
  erro,
}: {
  label: string
  value: string
  onChange: (valor: string) => void
  area?: boolean
  linhas?: number
  erro?: string
}) {
  return (
    <label className="block">
      <span className={estiloLabel}>{label}</span>
      {area ? (
        <textarea
          className={erro ? estiloTextArea.replace('border-neutral-300', 'border-red-400') : estiloTextArea}
          rows={linhas}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-campo-invalido={erro ? 'true' : undefined}
        />
      ) : (
        <input
          className={erro ? estiloInputErro : estiloInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-campo-invalido={erro ? 'true' : undefined}
        />
      )}
      {erro && <span className="mt-1 block text-xs text-red-600">{erro}</span>}
    </label>
  )
}

/**
 * Editor manual do currículo otimizado. Todo campo aqui é texto livre editado
 * pelo próprio usuário — o sistema nunca preenche ou sugere conteúdo novo
 * neste componente; ele só grava exatamente o que a pessoa digitar. A origem
 * de cada seção (formulário, GitHub, certificado, gerado pelo sistema) fica
 * indicada discretamente ao lado do título — e passa a mostrar "Editado
 * manualmente" assim que a seção é alterada aqui.
 */
export function CurriculoOtimizadoEditor({ curriculo, origens, secaoFoiEditada, erros, onAlterar }: Props) {
  const [avisoAjusteLink, setAvisoAjusteLink] = useState<Record<number, string>>({})

  function origemDe(secao: keyof CurriculoOtimizadoResult, origemBase: OrigemDado): OrigemDado {
    return secaoFoiEditada(secao) ? 'editado_manualmente' : origemBase
  }

  function atualizarCampo<K extends keyof CurriculoOtimizadoResult>(campo: K, valor: CurriculoOtimizadoResult[K]) {
    onAlterar({ ...curriculo, [campo]: valor })
  }

  function atualizarHabilidade(indice: number, valor: string) {
    const novas = [...curriculo.habilidadesTecnicas]
    novas[indice] = valor
    atualizarCampo('habilidadesTecnicas', novas)
  }

  function removerHabilidade(indice: number) {
    atualizarCampo(
      'habilidadesTecnicas',
      curriculo.habilidadesTecnicas.filter((_, i) => i !== indice),
    )
  }

  function adicionarHabilidade() {
    atualizarCampo('habilidadesTecnicas', [...curriculo.habilidadesTecnicas, ''])
  }

  function atualizarProjeto(indice: number, descricao: string) {
    const novos = curriculo.projetos.map((p, i) => (i === indice ? { ...p, descricao } : p))
    atualizarCampo('projetos', novos)
  }

  function atualizarExperiencia(indice: number, textoPontos: string) {
    const novas = curriculo.experiencias.map((exp, i) =>
      i === indice ? { ...exp, pontos: textoPontos.split('\n').map((linha) => linha.trim()).filter(Boolean) } : exp,
    )
    atualizarCampo('experiencias', novas)
  }

  function atualizarFormacao(indice: number, campo: 'curso' | 'instituicao', valor: string) {
    const novas = curriculo.formacao.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f))
    atualizarCampo('formacao', novas)
  }

  function atualizarCertificado(indice: number, campo: 'titulo' | 'instituicao', valor: string) {
    const novos = curriculo.certificados.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c))
    atualizarCampo('certificados', novos)
  }

  function atualizarIdioma(indice: number, campo: 'nome' | 'nivel', valor: string) {
    const novos = curriculo.idiomas.map((idioma, i) => (i === indice ? { ...idioma, [campo]: valor } : idioma))
    atualizarCampo('idiomas', novos)
  }

  function atualizarLink(indice: number, url: string) {
    const novos = curriculo.links.map((link, i) => (i === indice ? { ...link, url } : link))
    atualizarCampo('links', url.trim() ? sanitizarLinksPorTipoUrl(novos) : novos)
    if (avisoAjusteLink[indice]) {
      setAvisoAjusteLink((atual) => {
        const { [indice]: _removido, ...resto } = atual
        return resto
      })
    }
  }

  /**
   * Ao sair do campo, se a URL não tiver protocolo mas puder ser normalizada
   * (ex: "linkedin.com/in/nome" -> "https://linkedin.com/in/nome"), ajusta o
   * valor salvo e avisa o usuário do que mudou — nunca silenciosamente.
   */
  function tratarBlurLink(indice: number) {
    const atual = curriculo.links[indice]
    const { url: normalizada, normalizado } = normalizarUrl(atual.url)
    if (normalizado && normalizada !== atual.url) {
      const novos = curriculo.links.map((link, i) => (i === indice ? { ...link, url: normalizada } : link))
      atualizarCampo('links', sanitizarLinksPorTipoUrl(novos))
      setAvisoAjusteLink((atual2) => ({ ...atual2, [indice]: `Ajustado para ${normalizada}` }))
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.3)] sm:p-10">
      <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
        As alterações manuais são de responsabilidade do usuário. Revise todas as informações antes de utilizar o
        currículo em uma candidatura.
      </p>

      <div>
        <CabecalhoSecao titulo="Nome" origem={origemDe('contato', origens.contato)} />
        <Campo
          label="Nome completo"
          value={curriculo.contato.nome}
          onChange={(v) => atualizarCampo('contato', { ...curriculo.contato, nome: v })}
          erro={erros.nome}
        />
      </div>

      <div>
        <CabecalhoSecao titulo="Resumo profissional" origem={origemDe('resumoProfissional', origens.resumoProfissional)} />
        <Campo
          label="Texto do resumo"
          value={curriculo.resumoProfissional}
          onChange={(v) => atualizarCampo('resumoProfissional', v)}
          area
          linhas={4}
        />
      </div>

      <div>
        <CabecalhoSecao titulo="Habilidades técnicas" origem={origemDe('habilidadesTecnicas', origens.habilidadesTecnicas)} />
        {erros.habilidadesResumo && <p className="mb-2 text-xs text-red-600">{erros.habilidadesResumo}</p>}
        <div className="flex flex-col gap-2">
          {curriculo.habilidadesTecnicas.map((habilidade, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={erros.habilidadesInvalidas.includes(i) ? estiloInputErro : estiloInput}
                value={habilidade}
                onChange={(e) => atualizarHabilidade(i, e.target.value)}
                data-campo-invalido={erros.habilidadesInvalidas.includes(i) ? 'true' : undefined}
              />
              <button
                type="button"
                onClick={() => removerHabilidade(i)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={adicionarHabilidade}
            className="self-start text-xs font-medium text-neutral-600 hover:underline"
          >
            + Adicionar habilidade
          </button>
        </div>
      </div>

      {curriculo.projetos.length > 0 && (
        <div className="flex flex-col gap-4">
          <CabecalhoSecao titulo="Projetos" origem={origemDe('projetos', origens.projetos)} />
          {curriculo.projetos.map((projeto, i) => (
            <div key={projeto.nome} className="rounded-md border border-neutral-200 p-3">
              <p className="mb-2 text-sm font-semibold text-neutral-800">{projeto.nome}</p>
              <Campo label="Descrição" value={projeto.descricao} onChange={(v) => atualizarProjeto(i, v)} area linhas={2} />
            </div>
          ))}
        </div>
      )}

      {curriculo.experiencias.length > 0 && (
        <div className="flex flex-col gap-4">
          <CabecalhoSecao titulo="Experiência profissional" origem={origemDe('experiencias', origens.experiencias)} />
          {curriculo.experiencias.map((exp, i) => (
            <div key={`${exp.empresa}-${i}`} className="rounded-md border border-neutral-200 p-3">
              <p className="mb-2 text-sm font-semibold text-neutral-800">
                {exp.cargo} — {exp.empresa} <span className="font-normal text-neutral-500">({exp.periodo})</span>
              </p>
              <Campo
                label="Descrição (uma linha por tópico)"
                value={exp.pontos.join('\n')}
                onChange={(v) => atualizarExperiencia(i, v)}
                area
                linhas={4}
              />
            </div>
          ))}
        </div>
      )}

      {curriculo.formacao.length > 0 && (
        <div className="flex flex-col gap-4">
          <CabecalhoSecao titulo="Formação" origem={origemDe('formacao', origens.formacao)} />
          {curriculo.formacao.map((form, i) => (
            <div key={`${form.instituicao}-${i}`} className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-2">
              <Campo label="Curso" value={form.curso} onChange={(v) => atualizarFormacao(i, 'curso', v)} />
              <Campo label="Instituição" value={form.instituicao} onChange={(v) => atualizarFormacao(i, 'instituicao', v)} />
            </div>
          ))}
        </div>
      )}

      {curriculo.certificados.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={estiloLabel + ' mb-0'}>Certificados</span>
            <OrigemBadge origem={origemDe('certificados', origens.certificados)} />
            {curriculo.certificados.some((c) => c.competenciasDetectadas.length > 0) && (
              <OrigemBadge origem={origens.certificadosCompetenciasDetectadas} />
            )}
          </div>
          {curriculo.certificados.map((cert, i) => (
            <div key={`${cert.titulo}-${i}`} className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-2">
              <Campo label="Título" value={cert.titulo} onChange={(v) => atualizarCertificado(i, 'titulo', v)} />
              <Campo label="Instituição" value={cert.instituicao} onChange={(v) => atualizarCertificado(i, 'instituicao', v)} />
            </div>
          ))}
        </div>
      )}

      {curriculo.idiomas.length > 0 && (
        <div className="flex flex-col gap-4">
          <CabecalhoSecao titulo="Idiomas" origem={origemDe('idiomas', origens.idiomas)} />
          {curriculo.idiomas.map((idioma, i) => (
            <div key={i} className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-2">
              <Campo label="Idioma" value={idioma.nome} onChange={(v) => atualizarIdioma(i, 'nome', v)} />
              <label className="block">
                <span className={estiloLabel}>Nível</span>
                <select
                  className={estiloInput}
                  value={idioma.nivel}
                  onChange={(e) => atualizarIdioma(i, 'nivel', e.target.value)}
                >
                  {Object.values(NivelProficiencia).map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      )}

      {curriculo.links.length > 0 && (
        <div className="flex flex-col gap-3">
          <CabecalhoSecao titulo="Links" origem={origemDe('links', origens.links)} />
          {curriculo.links.map((link, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 w-24 shrink-0 text-xs text-neutral-500">{link.tipo}</span>
              <div className="flex-1">
                <input
                  className={erros.links[i] ? estiloInputErro : estiloInput}
                  value={link.url}
                  onChange={(e) => atualizarLink(i, e.target.value)}
                  onBlur={() => tratarBlurLink(i)}
                  data-campo-invalido={erros.links[i] ? 'true' : undefined}
                />
                {erros.links[i] && <span className="mt-1 block text-xs text-red-600">{erros.links[i]}</span>}
                {avisoAjusteLink[i] && !erros.links[i] && (
                  <span className="mt-1 block text-xs text-emerald-700">{avisoAjusteLink[i]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
