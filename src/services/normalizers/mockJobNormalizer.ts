import type { VagaNormalizada, RequisitoVaga, TipoContratoVaga, RequisitoIdioma } from '../../types/vaga'
import type { Modalidade } from '../../types/enums'
import { encontrarAreaPorTexto } from '../areaMatchService'
import { classificarTipoRequisito } from './classificacaoRequisitoService'
import { calcularConfiabilidadeDados } from '../confiabilidadeDadosService'
import { classificarPublicoVaga } from '../publicoVagaService'

/**
 * Formato "bruto" simulado do MockJobProvider — deliberadamente menos
 * estruturado que VagaNormalizada (área em texto livre, requisitos como
 * strings soltas), para exercitar de verdade o trabalho do normalizador.
 * Uma fonte real (Adzuna, JSearch...) teria seu próprio formato bruto e seu
 * próprio normalizador, mas ambos produziriam o mesmo VagaNormalizada.
 */
export interface VagaMockBruta {
  id: string
  titulo: string
  empresa: string
  descricao: string
  areaTexto: string
  cargoTexto?: string
  senioridadeTexto?: string
  tipoContrato?: TipoContratoVaga
  cidade?: string
  estado?: string
  pais: string
  aceitaCandidatosDe?: string[]
  modalidade?: Modalidade
  salarioMin?: number
  salarioMax?: number
  moeda?: string
  beneficios?: string[]
  requisitosObrigatoriosTexto: string[]
  requisitosDesejaveisTexto?: string[]
  formacaoRequerida?: string[]
  experienciaMinimaMeses?: number
  idiomasExigidos?: RequisitoIdioma[]
  dataPublicacao?: string
  dataExpiracao?: string
  urlOriginal?: string
  statusBruto: 'aberta' | 'encerrada'
}

function paraRequisitos(textos: string[], obrigatorio: boolean): RequisitoVaga[] {
  return textos.map((texto, i) => ({
    id: `${obrigatorio ? 'req-obr' : 'req-des'}-${i}-${texto.slice(0, 3)}`,
    nome: texto,
    tipo: classificarTipoRequisito(texto),
    obrigatorio,
  }))
}

export function normalizarVagaMock(bruta: VagaMockBruta): VagaNormalizada {
  const area = encontrarAreaPorTexto(bruta.areaTexto)

  const base: Omit<VagaNormalizada, 'confiabilidadeDados'> = {
    id: `mock-${bruta.id}`,
    idExterno: bruta.id,
    fonte: { id: 'mock', nome: 'Vagas de demonstração', tipo: 'demonstracao' },

    titulo: bruta.titulo,
    empresa: bruta.empresa,
    descricao: bruta.descricao,

    areaId: area?.id ?? 'outro',
    cargoNormalizado: bruta.cargoTexto,

    senioridade: bruta.senioridadeTexto as VagaNormalizada['senioridade'],
    senioridadeInformada: Boolean(bruta.senioridadeTexto),

    tipoContrato: bruta.tipoContrato,

    localizacao: {
      cidade: bruta.cidade,
      estado: bruta.estado,
      pais: bruta.pais,
      aceitaCandidatosDe: bruta.aceitaCandidatosDe,
    },
    modalidade: bruta.modalidade,
    modalidadeInformada: Boolean(bruta.modalidade),
    publico: classificarPublicoVaga(bruta.titulo, bruta.descricao),

    salario:
      bruta.salarioMin || bruta.salarioMax
        ? { minimo: bruta.salarioMin, maximo: bruta.salarioMax, moeda: bruta.moeda ?? 'BRL', periodicidade: 'mes' }
        : undefined,
    beneficios: bruta.beneficios ?? [],

    requisitosObrigatorios: paraRequisitos(bruta.requisitosObrigatoriosTexto, true),
    requisitosDesejaveis: paraRequisitos(bruta.requisitosDesejaveisTexto ?? [], false),

    formacaoRequerida: bruta.formacaoRequerida,
    experienciaMinimaMeses: bruta.experienciaMinimaMeses,
    idiomasExigidos: bruta.idiomasExigidos ?? [],

    dataPublicacao: bruta.dataPublicacao,
    dataExpiracao: bruta.dataExpiracao,
    consultadaEm: new Date().toISOString(),

    urlOriginal: bruta.urlOriginal,
    // Uma vaga de demonstração nunca reivindica status "aberta" real — vira
    // "demonstracao". Mas se a vaga bruta já é "encerrada" (usada para testar
    // o filtro de vagas encerradas), esse status é preservado.
    status: bruta.statusBruto === 'encerrada' ? 'encerrada' : 'demonstracao',
  }

  return { ...base, confiabilidadeDados: calcularConfiabilidadeDados(base) }
}
