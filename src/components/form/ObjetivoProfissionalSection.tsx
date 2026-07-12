import type {
  Candidato,
  ModoObjetivoProfissional,
  NivelSenioridadeAlvo,
  OpcaoObjetivoProfissional,
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

function separarLista(valor: string): string[] {
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function juntarLista(valor: string[]): string {
  return valor.join(', ')
}

function alternarItem<T>(itens: T[], item: T): T[] {
  return itens.includes(item) ? itens.filter((atual) => atual !== item) : [...itens, item]
}

function criarOpcao(indice: number): OpcaoObjetivoProfissional {
  return {
    id: `objetivo-${Date.now()}-${indice}`,
    cargoOuArea: '',
    nivelAlvo: 'Indiferente',
    tiposContratoAceitos: ['Indiferente'],
    modalidadesAceitas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
  }
}

export function ObjetivoProfissionalSection({ candidato, atualizarCampo, erros }: Props) {
  const objetivo = candidato.objetivoProfissional

  const atualizarObjetivo = (patch: Partial<typeof objetivo>) => {
    const proximo = { ...objetivo, ...patch }
    atualizarCampo('objetivoProfissional', proximo)
    const primeiraOpcao = proximo.opcoes[0]
    if (primeiraOpcao?.modalidadesAceitas.length) {
      atualizarCampo('modalidadesPreferidas', primeiraOpcao.modalidadesAceitas)
    }
  }

  function definirModo(modo: ModoObjetivoProfissional) {
    atualizarObjetivo({
      modo,
      opcoes: modo === 'definido' && objetivo.opcoes.length === 0 ? [criarOpcao(0)] : objetivo.opcoes,
    })
  }

  function atualizarOpcao(indice: number, patch: Partial<OpcaoObjetivoProfissional>) {
    atualizarObjetivo({
      opcoes: objetivo.opcoes.map((opcao, i) => (i === indice ? { ...opcao, ...patch } : opcao)),
    })
  }

  function adicionarOpcao() {
    if (objetivo.opcoes.length >= 3) return
    atualizarObjetivo({ opcoes: [...objetivo.opcoes, criarOpcao(objetivo.opcoes.length)] })
  }

  function removerOpcao(indice: number) {
    const restantes = objetivo.opcoes.filter((_, i) => i !== indice)
    atualizarObjetivo({ opcoes: restantes.length > 0 ? restantes : [criarOpcao(0)] })
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

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="mb-2 font-display text-xl font-semibold text-[var(--color-ink)]">Objetivo profissional</h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          Informe até três caminhos que quer buscar agora, ou escolha a descoberta assistida se ainda estiver explorando possibilidades.
        </p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-[var(--color-ink)]">Você já sabe o que quer?</legend>
        <div className="grid gap-2">
          {[
            ['definido', 'Já sei o que quero'],
            ['exploracao', 'Ainda não sei'],
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
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-muted)]">Adicione de 1 a 3 objetivos. O primeiro será usado como prioridade inicial.</p>
          {objetivo.opcoes.map((opcao, indice) => (
            <div key={opcao.id} className="grid gap-4 rounded-lg border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--color-ink)]">Objetivo {indice + 1}</span>
                {objetivo.opcoes.length > 1 && (
                  <button type="button" className="text-sm font-medium text-[var(--color-score-low)]" onClick={() => removerOpcao(indice)}>
                    Remover
                  </button>
                )}
              </div>

              <Input
                label="Cargo ou área desejada"
                placeholder="Ex: Assistente Administrativo, RH, Vendas"
                value={opcao.cargoOuArea}
                onChange={(e) => atualizarOpcao(indice, { cargoOuArea: e.target.value })}
                error={erros[`opcao_${indice}`]}
              />

              <Select
                label="Nível pretendido"
                value={opcao.nivelAlvo ?? 'Indiferente'}
                options={niveis.map((nivel) => ({ value: nivel, label: nivel }))}
                onChange={(e) => atualizarOpcao(indice, { nivelAlvo: e.target.value as NivelSenioridadeAlvo })}
              />

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-[var(--color-ink)]">Modalidades aceitas</legend>
                <div className="flex flex-wrap gap-2">
                  {modalidades.map((modalidade) => (
                    <label key={modalidade} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                      <input type="checkbox" checked={opcao.modalidadesAceitas.includes(modalidade)} onChange={() => alternarModalidadeOpcao(indice, modalidade)} />
                      {modalidade}
                    </label>
                  ))}
                </div>
                {erros[`modalidades_${indice}`] && <span className="text-xs text-[var(--color-score-low)]">{erros[`modalidades_${indice}`]}</span>}
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-[var(--color-ink)]">Tipos de contrato aceitos</legend>
                <div className="flex flex-wrap gap-2">
                  {contratos.map((contrato) => (
                    <label key={contrato} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
                      <input type="checkbox" checked={opcao.tiposContratoAceitos.includes(contrato)} onChange={() => alternarContratoOpcao(indice, contrato)} />
                      {contrato}
                    </label>
                  ))}
                </div>
                {erros[`contratos_${indice}`] && <span className="text-xs text-[var(--color-score-low)]">{erros[`contratos_${indice}`]}</span>}
              </fieldset>
            </div>
          ))}
          {erros.opcoes && <span className="text-xs text-[var(--color-score-low)]">{erros.opcoes}</span>}
          <button
            type="button"
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50"
            disabled={objetivo.opcoes.length >= 3}
            onClick={adicionarOpcao}
          >
            Adicionar objetivo
          </button>
        </div>
      )}

      {objetivo.modo === 'exploracao' && (
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-muted)]">
            Você pode continuar sem escolher cargo, área, nível ou tecnologia. O CareerScore usará competências, experiências, formação, idiomas, certificados e interesses para sugerir caminhos possíveis.
          </p>
          {erros.preferenciasExploracao && <span className="text-xs text-[var(--color-score-low)]">{erros.preferenciasExploracao}</span>}
          <Input
            label="Interesses"
            placeholder="Ex: saúde, tecnologia, design, logística, educação"
            value={juntarLista(objetivo.preferenciasExploracao.interesses)}
            onChange={(e) =>
              atualizarObjetivo({
                preferenciasExploracao: {
                  interesses: separarLista(e.target.value),
                },
              })
            }
            hint="Separe por vírgulas."
          />
        </div>
      )}
    </div>
  )
}
