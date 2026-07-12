import type {
  Candidato,
  ModoObjetivoProfissional,
  NivelSenioridadeAlvo,
  OpcaoObjetivoProfissional,
  PreferenciaTrabalhoCom,
  TipoContratoAceito,
} from '../../types/models'
import { Modalidade } from '../../types/enums'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { ErrosValidacao } from '../../services/validationService'

interface Props {
  candidato: Candidato
  atualizarCampo: <K extends keyof Candidato>(campo: K, valor: Candidato[K]) => void
  erros: ErrosValidacao
}

const niveis: NivelSenioridadeAlvo[] = [
  'Aprendiz',
  'Estágio',
  'Trainee',
  'Auxiliar',
  'Assistente',
  'Júnior',
  'Pleno',
  'Sênior',
  'Especialista',
  'Coordenação',
  'Gerência',
  'Indiferente',
]

const contratos: TipoContratoAceito[] = ['Estágio', 'Aprendiz', 'Trainee', 'CLT', 'PJ', 'Temporário', 'Freelance', 'Cooperado', 'Indiferente']
const modalidades = [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL]
const preferenciasTrabalho: Array<{ valor: PreferenciaTrabalhoCom; label: string }> = [
  { valor: 'pessoas', label: 'Pessoas' },
  { valor: 'dados', label: 'Dados' },
  { valor: 'processos', label: 'Processos' },
  { valor: 'criatividade', label: 'Criatividade' },
  { valor: 'tecnologia', label: 'Tecnologia' },
  { valor: 'tarefas_praticas', label: 'Tarefas práticas' },
]

function separarTags(valor: string): string[] {
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function juntarTags(valor: string[]): string {
  return valor.join(', ')
}

function alternarItem<T>(itens: T[], item: T): T[] {
  return itens.includes(item) ? itens.filter((atual) => atual !== item) : [...itens, item]
}

export function ObjetivoProfissionalSection({ candidato, atualizarCampo, erros }: Props) {
  const objetivo = candidato.objetivoProfissional
  const preferencias = objetivo.preferenciasExploracao

  const atualizarObjetivo = (patch: Partial<typeof objetivo>) => {
    const proximo = { ...objetivo, ...patch }
    atualizarCampo('objetivoProfissional', proximo)
    if (patch.modalidadesAceitas) {
      atualizarCampo('modalidadesPreferidas', patch.modalidadesAceitas)
    }
  }

  function definirModo(modo: ModoObjetivoProfissional) {
    atualizarObjetivo({ modo })
  }

  function alternarContrato(contrato: TipoContratoAceito) {
    const atual = objetivo.tiposContratoAceitos
    const proximo = atual.includes(contrato)
      ? atual.filter((item) => item !== contrato)
      : [...atual.filter((item) => item !== 'Indiferente'), contrato]
    atualizarObjetivo({ tiposContratoAceitos: contrato === 'Indiferente' ? ['Indiferente'] : proximo })
  }

  function alternarModalidade(modalidade: Modalidade) {
    const proximo = alternarItem(objetivo.modalidadesAceitas, modalidade)
    atualizarObjetivo({ modalidadesAceitas: proximo })
  }

  function atualizarOpcao(indice: number, patch: Partial<OpcaoObjetivoProfissional>) {
    const opcoes = objetivo.opcoes.map((opcao, i) => {
      if (i !== indice) return patch.principal ? { ...opcao, principal: false } : opcao
      return { ...opcao, ...patch }
    })
    atualizarObjetivo({ opcoes })
  }

  function adicionarOpcao() {
    if (objetivo.opcoes.length >= 3) return
    const novaOpcao: OpcaoObjetivoProfissional = {
      id: `objetivo-${Date.now()}`,
      cargoOuArea: '',
      nivelAlvo: 'Indiferente',
      prioridade: objetivo.opcoes.length + 1,
      principal: objetivo.opcoes.length === 0,
      tiposContratoAceitos: ['Indiferente'],
      modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
    }
    atualizarObjetivo({ opcoes: [...objetivo.opcoes, novaOpcao] })
  }

  function removerOpcao(indice: number) {
    const restantes = objetivo.opcoes.filter((_, i) => i !== indice)
    if (restantes.length > 0 && !restantes.some((opcao) => opcao.principal)) {
      restantes[0] = { ...restantes[0], principal: true }
    }
    atualizarObjetivo({ opcoes: restantes })
  }

  function alternarModalidadeOpcao(indice: number, modalidade: Modalidade) {
    const opcao = objetivo.opcoes[indice]
    atualizarOpcao(indice, { modalidadesAceitas: alternarItem(opcao.modalidadesAceitas, modalidade) })
  }

  function alternarContratoOpcao(indice: number, contrato: TipoContratoAceito) {
    const opcao = objetivo.opcoes[indice]
    const atual = opcao.tiposContratoAceitos
    const proximo = atual.includes(contrato)
      ? atual.filter((item) => item !== contrato)
      : [...atual.filter((item) => item !== 'Indiferente'), contrato]
    atualizarOpcao(indice, { tiposContratoAceitos: contrato === 'Indiferente' ? ['Indiferente'] : proximo })
  }

  function atualizarPreferencias(patch: Partial<typeof preferencias>) {
    atualizarObjetivo({ preferenciasExploracao: { ...preferencias, ...patch } })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="mb-2 font-display text-xl font-semibold text-[var(--color-ink)]">Objetivo profissional</h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Conte como quer orientar sua busca agora. O CareerScore pode trabalhar com um objetivo definido, algumas opções ou uma fase de descoberta.
        </p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">Você já sabe qual vaga ou área deseja buscar?</legend>
        <div className="grid gap-2">
          {[
            ['definido', 'Sim, já tenho um objetivo definido'],
            ['multiplas_opcoes', 'Tenho algumas opções em mente'],
            ['exploracao', 'Ainda não sei e quero ajuda para descobrir'],
          ].map(([modo, label]) => (
            <label key={modo} className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
              <input
                type="radio"
                name="modoObjetivoProfissional"
                checked={objetivo.modo === modo}
                onChange={() => definirModo(modo as ModoObjetivoProfissional)}
              />
              {label}
            </label>
          ))}
        </div>
        {erros.modo && <span className="text-xs text-[var(--color-score-low)]">{erros.modo}</span>}
      </fieldset>

      {objetivo.modo === 'definido' && (
        <div className="grid gap-6">
          <Input
            label="Cargo desejado"
            placeholder="Ex: Assistente de RH, Estágio em Front-end, Vendedor"
            value={objetivo.cargoDesejado}
            onChange={(e) => atualizarObjetivo({ cargoDesejado: e.target.value })}
            error={erros.cargoDesejado}
          />

          <Select
            label="Nível alvo"
            value={objetivo.nivelAlvo}
            options={niveis.map((nivel) => ({ value: nivel, label: nivel }))}
            onChange={(e) => atualizarObjetivo({ nivelAlvo: e.target.value as NivelSenioridadeAlvo })}
            error={erros.nivelAlvo}
          />

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-[var(--color-ink)]">Tipos de contrato aceitos</legend>
            <div className="flex flex-wrap gap-2">
              {contratos.map((contrato) => (
                <label key={contrato} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                  <input type="checkbox" checked={objetivo.tiposContratoAceitos.includes(contrato)} onChange={() => alternarContrato(contrato)} />
                  {contrato}
                </label>
              ))}
            </div>
            {erros.tiposContratoAceitos && <span className="text-xs text-[var(--color-score-low)]">{erros.tiposContratoAceitos}</span>}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-[var(--color-ink)]">Modalidades aceitas</legend>
            <div className="flex flex-wrap gap-2">
              {modalidades.map((modalidade) => (
                <label key={modalidade} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                  <input type="checkbox" checked={objetivo.modalidadesAceitas.includes(modalidade)} onChange={() => alternarModalidade(modalidade)} />
                  {modalidade}
                </label>
              ))}
            </div>
            {erros.modalidadesAceitas && <span className="text-xs text-[var(--color-score-low)]">{erros.modalidadesAceitas}</span>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Cidade de busca" value={objetivo.cidadeBusca ?? ''} onChange={(e) => atualizarObjetivo({ cidadeBusca: e.target.value })} />
            <Input label="Estado de busca" value={objetivo.estadoBusca ?? ''} onChange={(e) => atualizarObjetivo({ estadoBusca: e.target.value })} />
            <Input label="País de busca" value={objetivo.paisBusca} onChange={(e) => atualizarObjetivo({ paisBusca: e.target.value })} error={erros.paisBusca} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" checked={objetivo.aceitaMudanca} onChange={(e) => atualizarObjetivo({ aceitaMudanca: e.target.checked })} />
            Tenho disponibilidade para mudança
          </label>

          <Input
            label="Áreas secundárias de interesse"
            placeholder="Ex: Design, Produto, Marketing"
            value={juntarTags(objetivo.areasSecundarias)}
            onChange={(e) => atualizarObjetivo({ areasSecundarias: separarTags(e.target.value) })}
            hint="Separe por vírgulas."
          />

          <Input
            label="Conhecimentos prioritários"
            placeholder="Ex: Excel, atendimento ao cliente, recrutamento, Power BI"
            value={juntarTags(objetivo.conhecimentosPrioritarios)}
            onChange={(e) => atualizarObjetivo({ conhecimentosPrioritarios: separarTags(e.target.value) })}
            hint="Separe por vírgulas. Esses itens ajudam a ordenar e explicar as vagas."
          />
        </div>
      )}

      {objetivo.modo === 'multiplas_opcoes' && (
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-muted)]">Informe até 3 caminhos. Um deles deve ficar marcado como principal.</p>
          {objetivo.opcoes.map((opcao, indice) => (
            <div key={opcao.id} className="grid gap-4 rounded-lg border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
                  <input type="radio" name="objetivoPrincipal" checked={opcao.principal} onChange={() => atualizarOpcao(indice, { principal: true })} />
                  Opção principal
                </label>
                <button type="button" className="text-sm font-medium text-[var(--color-score-low)]" onClick={() => removerOpcao(indice)}>
                  Remover
                </button>
              </div>
              <Input
                label="Cargo ou área"
                placeholder="Ex: Assistente Administrativo, RH, Vendas"
                value={opcao.cargoOuArea}
                onChange={(e) => atualizarOpcao(indice, { cargoOuArea: e.target.value })}
                error={erros[`opcao_${indice}`]}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Nível alvo"
                  value={opcao.nivelAlvo ?? 'Indiferente'}
                  options={niveis.map((nivel) => ({ value: nivel, label: nivel }))}
                  onChange={(e) => atualizarOpcao(indice, { nivelAlvo: e.target.value as NivelSenioridadeAlvo })}
                />
                <Input
                  label="Prioridade"
                  type="number"
                  min={1}
                  max={3}
                  value={opcao.prioridade}
                  onChange={(e) => atualizarOpcao(indice, { prioridade: Number(e.target.value) || indice + 1 })}
                />
              </div>
              <div className="grid gap-3">
                <span className="text-sm font-medium text-[var(--color-ink)]">Modalidades</span>
                <div className="flex flex-wrap gap-2">
                  {modalidades.map((modalidade) => (
                    <label key={modalidade} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                      <input type="checkbox" checked={opcao.modalidadesAceitas.includes(modalidade)} onChange={() => alternarModalidadeOpcao(indice, modalidade)} />
                      {modalidade}
                    </label>
                  ))}
                </div>
                <span className="text-sm font-medium text-[var(--color-ink)]">Contratos</span>
                <div className="flex flex-wrap gap-2">
                  {contratos.map((contrato) => (
                    <label key={contrato} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                      <input type="checkbox" checked={opcao.tiposContratoAceitos.includes(contrato)} onChange={() => alternarContratoOpcao(indice, contrato)} />
                      {contrato}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {erros.opcoes && <span className="text-xs text-[var(--color-score-low)]">{erros.opcoes}</span>}
          {erros.opcaoPrincipal && <span className="text-xs text-[var(--color-score-low)]">{erros.opcaoPrincipal}</span>}
          <button
            type="button"
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50"
            disabled={objetivo.opcoes.length >= 3}
            onClick={adicionarOpcao}
          >
            Adicionar opção
          </button>
        </div>
      )}

      {objetivo.modo === 'exploracao' && (
        <div className="grid gap-5">
          <p className="text-sm text-[var(--color-muted)]">
            Você pode concluir sem escolher cargo. Use alguns sinais do que gosta, evita ou quer testar para receber caminhos profissionais cautelosos.
          </p>
          {erros.preferenciasExploracao && <span className="text-xs text-[var(--color-score-low)]">{erros.preferenciasExploracao}</span>}
          <Input
            label="Atividades que você prefere"
            placeholder="Ex: organizar informações, atender pessoas, resolver problemas"
            value={juntarTags(preferencias.atividadesPreferidas)}
            onChange={(e) => atualizarPreferencias({ atividadesPreferidas: separarTags(e.target.value) })}
            hint="Separe por vírgulas."
          />
          <Input
            label="Atividades que prefere evitar"
            placeholder="Ex: vendas externas, rotina muito repetitiva"
            value={juntarTags(preferencias.atividadesEvitar)}
            onChange={(e) => atualizarPreferencias({ atividadesEvitar: separarTags(e.target.value) })}
            hint="Opcional. Separe por vírgulas."
          />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-[var(--color-ink)]">Prefere trabalhar com</legend>
            <div className="flex flex-wrap gap-2">
              {preferenciasTrabalho.map((item) => (
                <label key={item.valor} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={preferencias.prefereTrabalharCom.includes(item.valor)}
                    onChange={() => atualizarPreferencias({ prefereTrabalharCom: alternarItem(preferencias.prefereTrabalharCom, item.valor) })}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Rotina ou variedade"
              value={preferencias.rotinaOuVariedade ?? ''}
              placeholder="Escolha uma opção"
              options={[
                { value: 'rotina', label: 'Rotina' },
                { value: 'variedade', label: 'Variedade' },
                { value: 'equilibrio', label: 'Equilíbrio' },
              ]}
              onChange={(e) => atualizarPreferencias({ rotinaOuVariedade: e.target.value as typeof preferencias.rotinaOuVariedade })}
            />
            <Select
              label="Individual ou equipe"
              value={preferencias.individualOuEquipe ?? ''}
              placeholder="Escolha uma opção"
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'equipe', label: 'Equipe' },
                { value: 'ambos', label: 'Ambos' },
              ]}
              onChange={(e) => atualizarPreferencias({ individualOuEquipe: e.target.value as typeof preferencias.individualOuEquipe })}
            />
          </div>
          <Input
            label="Ambientes preferidos"
            placeholder="Ex: escritório, clínica, loja, remoto"
            value={juntarTags(preferencias.ambientesPreferidos)}
            onChange={(e) => atualizarPreferencias({ ambientesPreferidos: separarTags(e.target.value) })}
            hint="Opcional. Separe por vírgulas."
          />
          <Input
            label="Interesses"
            placeholder="Ex: saúde, tecnologia, design, logística, educação"
            value={juntarTags(preferencias.interesses)}
            onChange={(e) => atualizarPreferencias({ interesses: separarTags(e.target.value) })}
            hint="Separe por vírgulas."
          />
        </div>
      )}
    </div>
  )
}
