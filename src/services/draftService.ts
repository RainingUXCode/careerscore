import type { Candidato } from '../types/models'

const CHAVE_RASCUNHO = 'careerscore:rascunho-candidato'

function escolherArray<T>(valor: unknown, fallback: T[]): T[] {
  return Array.isArray(valor) ? valor as T[] : fallback
}

function montarCandidato(dados: Partial<Candidato>, fallback: Candidato): Candidato {
  return {
    ...fallback,
    ...dados,
    areaInteresse: {
      ...fallback.areaInteresse,
      ...dados.areaInteresse,
    },
    modalidadesPreferidas: escolherArray(dados.modalidadesPreferidas, fallback.modalidadesPreferidas),
    escolaridades: escolherArray(dados.escolaridades, fallback.escolaridades),
    experiencias: escolherArray(dados.experiencias, fallback.experiencias),
    competencias: escolherArray(dados.competencias, fallback.competencias),
    certificados: escolherArray(dados.certificados, fallback.certificados).map((certificado) => ({
      ...certificado,
      arquivo: undefined,
    })),
    idiomas: escolherArray(dados.idiomas, fallback.idiomas),
    links: escolherArray(dados.links, fallback.links),
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
    const { curriculo: _curriculo, ...candidatoSemArquivo } = candidato
    const serializavel = {
      ...candidatoSemArquivo,
      certificados: candidato.certificados.map(({ arquivo: _arquivo, ...certificado }) => certificado),
    }
    window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(serializavel))
  },

  limpar() {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(CHAVE_RASCUNHO)
  },
}
