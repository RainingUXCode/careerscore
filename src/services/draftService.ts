import type { Candidato } from '../types/models'
import { normalizarObjetivoProfissional } from './objetivoProfissionalService'
import { sanitizarLinks } from './linksService'
import { ajustarModalidadePreferida } from './modalidadePreferenciaService'
import { inferirTipoFormacao } from './escolaridadeService'

const CHAVE_RASCUNHO = 'careerscore:rascunho-candidato'

function escolherArray<T>(valor: unknown, fallback: T[]): T[] {
  return Array.isArray(valor) ? valor as T[] : fallback
}

function montarCandidato(dados: Partial<Candidato>, fallback: Candidato): Candidato {
  const modalidadesPreferidas = escolherArray(dados.modalidadesPreferidas, fallback.modalidadesPreferidas)
  return {
    ...fallback,
    ...dados,
    areaInteresse: {
      ...fallback.areaInteresse,
      ...dados.areaInteresse,
    },
    objetivoProfissional: normalizarObjetivoProfissional(dados.objetivoProfissional ?? fallback.objetivoProfissional),
    modalidadesPreferidas,
    modalidadePreferida: ajustarModalidadePreferida(modalidadesPreferidas, dados.modalidadePreferida),
    disponibilidadeMudanca: dados.disponibilidadeMudanca ?? 'prefiro_nao_informar',
    preferenciaVagasPcd: dados.preferenciaVagasPcd ?? 'prefiro_nao_informar',
    escolaridades: escolherArray(dados.escolaridades, fallback.escolaridades).map((escolaridade) => ({
      ...escolaridade,
      tipoFormacao: escolaridade.tipoFormacao ?? inferirTipoFormacao(escolaridade),
    })),
    experiencias: escolherArray(dados.experiencias, fallback.experiencias),
    competencias: escolherArray(dados.competencias, fallback.competencias),
    certificados: escolherArray(dados.certificados, fallback.certificados).map((certificado) => ({
      ...certificado,
      arquivo: undefined,
    })),
    idiomas: escolherArray(dados.idiomas, fallback.idiomas),
    links: sanitizarLinks(escolherArray(dados.links, fallback.links)),
    curriculo: undefined,
  }
}

export const draftService = {
  carregar(fallback: Candidato): Candidato {
    if (typeof window === 'undefined') return fallback

    try {
      const bruto = window.localStorage.getItem(CHAVE_RASCUNHO)
      if (!bruto) return fallback
      const dados = JSON.parse(bruto)
      if (!dados || typeof dados !== 'object') return fallback
      return montarCandidato(dados, fallback)
    } catch {
      return fallback
    }
  },

  salvar(candidato: Candidato) {
    if (typeof window === 'undefined') return
    const { curriculo: _curriculo, nivelExperiencia: _nivelExperiencia, ...candidatoSemArquivo } = candidato
    const serializavel = {
      ...candidatoSemArquivo,
      certificados: candidato.certificados.map(({ arquivo: _arquivo, ...certificado }) => certificado),
      links: sanitizarLinks(candidato.links),
    }
    window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(serializavel))
  },

  limpar() {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(CHAVE_RASCUNHO)
  },
}
