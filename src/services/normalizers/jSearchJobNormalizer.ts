import { gerarId } from '../../utils/id'
import type { VagaNormalizada, RequisitoVaga } from '../../types/vaga'
import { Modalidade } from '../../types/enums'
import type { JSearchRawJob } from '../providers/jsearch/types'
import { encontrarAreaPorTexto } from '../areaMatchService'
import { classificarTipoRequisito } from './classificacaoRequisitoService'
import { calcularConfiabilidadeDados } from '../confiabilidadeDadosService'
import { competenciasReferenciaVagas } from '../../data/competenciasReferenciaVagas'
import { normalizarTexto } from '../../utils/texto'
import { classificarPublicoVaga } from '../publicoVagaService'
import { inferirSenioridadeVaga } from '../senioridadeVagaService'

function paraDataISO(valor?: string): string | undefined {
  if (!valor) return undefined
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return undefined
  return data.toISOString().slice(0, 10)
}

/**
 * Extrai competências conhecidas mencionadas na descrição, como fallback
 * conservador quando a fonte não retorna `job_required_skills` estruturado.
 * Só reconhece termos já presentes no catálogo de referência — nunca inventa
 * uma competência nova a partir de texto livre.
 */
function extrairRequisitosDaDescricao(descricao: string): RequisitoVaga[] {
  const textoNormalizado = normalizarTexto(descricao)
  const encontrados = competenciasReferenciaVagas.filter((competencia) => {
    const termos = [competencia.nome, ...competencia.sinonimos]
    return termos.some((termo) => textoNormalizado.includes(normalizarTexto(termo)))
  })

  return encontrados.slice(0, 12).map((competencia) => ({
    id: `jsearch-inferido-${competencia.id}`,
    nome: competencia.nome,
    tipo: classificarTipoRequisito(competencia.nome),
    obrigatorio: false,
    inferido: true,
  }))
}

function paraRequisitosEstruturados(habilidades: string[]): RequisitoVaga[] {
  return habilidades.map((nome, i) => ({
    id: `jsearch-skill-${i}-${nome.slice(0, 3)}`,
    nome,
    tipo: classificarTipoRequisito(nome),
    obrigatorio: true,
  }))
}

function paraFormacaoRequerida(educacao: JSearchRawJob['job_required_education']): string[] | undefined {
  if (!educacao) return undefined
  const niveis: string[] = []
  if (educacao.postgraduate_degree) niveis.push('Pós-graduação')
  if (educacao.bachelors_degree) niveis.push('Graduação')
  if (educacao.associates_degree) niveis.push('Tecnólogo')
  if (educacao.high_school) niveis.push('Ensino médio')
  if (educacao.professional_certification) niveis.push('Certificação profissional')
  return niveis.length > 0 ? niveis : undefined
}

/**
 * Converte uma vaga bruta da JSearch para o modelo interno comum.
 * Qualquer campo ausente na fonte permanece ausente aqui — nunca é
 * preenchido com um valor assumido.
 */
export function normalizarVagaJSearch(bruta: JSearchRawJob): VagaNormalizada {
  const descricao = bruta.job_description ?? ''
  const titulo = bruta.job_title ?? 'Título não informado'
  const area = encontrarAreaPorTexto(`${bruta.job_title ?? ''} ${descricao}`)
  const senioridadeInferida = inferirSenioridadeVaga(titulo, descricao)

  const requisitos =
    bruta.job_required_skills && bruta.job_required_skills.length > 0
      ? paraRequisitosEstruturados(bruta.job_required_skills)
      : descricao
        ? extrairRequisitosDaDescricao(descricao)
        : []

  const dataExpiracao = paraDataISO(bruta.job_offer_expiration_datetime_utc)
  const expirada = dataExpiracao ? new Date(dataExpiracao).getTime() < Date.now() : false

  const modalidadeInformada = bruta.job_is_remote === true
  const salarioInformado = bruta.job_min_salary != null || bruta.job_max_salary != null

  const base: Omit<VagaNormalizada, 'confiabilidadeDados'> = {
    id: `jsearch-${bruta.job_id ?? gerarId('vaga')}`,
    idExterno: bruta.job_id,
    fonte: { id: 'jsearch', nome: 'JSearch (LinkedIn, Indeed, Glassdoor e outros)', tipo: 'real' },

    titulo,
    empresa: bruta.employer_name ?? 'Empresa não informada',
    descricao,

    areaId: area?.id ?? 'outro',
    senioridade: senioridadeInferida.senioridade,
    senioridadesPossiveis: senioridadeInferida.senioridadesPossiveis.length > 0 ? senioridadeInferida.senioridadesPossiveis : undefined,
    senioridadeInformada: senioridadeInferida.senioridadesPossiveis.length > 0,

    localizacao: {
      cidade: bruta.job_city ?? undefined,
      estado: bruta.job_state ?? undefined,
      pais: bruta.job_country ?? 'Não informado',
    },
    modalidade: modalidadeInformada ? Modalidade.REMOTO : undefined,
    modalidadeInformada,
    publico: classificarPublicoVaga(bruta.job_title ?? '', descricao),

    salario: salarioInformado
      ? {
          minimo: bruta.job_min_salary ?? undefined,
          maximo: bruta.job_max_salary ?? undefined,
          moeda: bruta.job_salary_currency ?? 'Não informado',
          periodicidade: (bruta.job_salary_period?.toLowerCase() as 'hora' | 'dia' | 'mes' | 'ano') || undefined,
          estimado: Boolean(bruta.job_salary_is_predicted),
        }
      : undefined,
    beneficios: bruta.job_highlights?.Benefits ?? [],

    requisitosObrigatorios: requisitos.filter((r) => r.obrigatorio),
    requisitosDesejaveis: requisitos.filter((r) => !r.obrigatorio),

    formacaoRequerida: paraFormacaoRequerida(bruta.job_required_education),
    experienciaMinimaMeses: bruta.job_required_experience?.no_experience_required
      ? 0
      : (bruta.job_required_experience?.required_experience_in_months ?? undefined),
    idiomasExigidos: [],

    dataPublicacao: paraDataISO(bruta.job_posted_at_datetime_utc),
    dataExpiracao,
    consultadaEm: new Date().toISOString(),

    urlOriginal: bruta.job_apply_link,
    status: expirada ? 'encerrada' : 'aberta',
  }

  return { ...base, confiabilidadeDados: calcularConfiabilidadeDados(base) }
}
