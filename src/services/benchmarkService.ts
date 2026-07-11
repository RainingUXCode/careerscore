import type { AnalisePerfil, PontuacaoDetalhes } from '../types/models'
import { NomeArea } from '../types/enums'

export const categoriasPontuacao: Array<{
  chave: keyof PontuacaoDetalhes
  label: string
  maximo: number
}> = [
  { chave: 'experiencia', label: 'Experiencia', maximo: 30 },
  { chave: 'competencias', label: 'Competencias', maximo: 25 },
  { chave: 'escolaridade', label: 'Escolaridade', maximo: 16 },
  { chave: 'idiomas', label: 'Idiomas', maximo: 12 },
  { chave: 'presencaDigital', label: 'Presenca digital', maximo: 18 },
  { chave: 'certificados', label: 'Certificados', maximo: 14 },
  { chave: 'curriculo', label: 'Curriculo', maximo: 15 },
]

const benchmarkPorArea: Record<string, PontuacaoDetalhes> = {
  [NomeArea.TECNOLOGIA_DADOS]: {
    experiencia: 12,
    competencias: 14,
    escolaridade: 9,
    idiomas: 5,
    presencaDigital: 6,
    certificados: 3,
    curriculo: 10,
  },
  [NomeArea.SAUDE]: {
    experiencia: 14,
    competencias: 10,
    escolaridade: 11,
    idiomas: 3,
    presencaDigital: 3,
    certificados: 4,
    curriculo: 10,
  },
  [NomeArea.GESTAO_NEGOCIOS]: {
    experiencia: 15,
    competencias: 12,
    escolaridade: 9,
    idiomas: 5,
    presencaDigital: 5,
    certificados: 3,
    curriculo: 10,
  },
  [NomeArea.ENGENHARIA]: {
    experiencia: 14,
    competencias: 12,
    escolaridade: 10,
    idiomas: 4,
    presencaDigital: 4,
    certificados: 4,
    curriculo: 10,
  },
  [NomeArea.COMERCIO_ATENDIMENTO]: {
    experiencia: 13,
    competencias: 9,
    escolaridade: 7,
    idiomas: 3,
    presencaDigital: 3,
    certificados: 3,
    curriculo: 10,
  },
  [NomeArea.OUTRO]: {
    experiencia: 12,
    competencias: 10,
    escolaridade: 8,
    idiomas: 4,
    presencaDigital: 4,
    certificados: 3,
    curriculo: 10,
  },
}

function calcularTotal(detalhes: PontuacaoDetalhes): number {
  return Math.min(100, Object.values(detalhes).reduce((soma, valor) => soma + valor, 0))
}

function calcularPercentil(score: number, media: number): number {
  const diferenca = score - media
  return Math.max(8, Math.min(94, Math.round(50 + diferenca * 1.35)))
}

export const benchmarkService = {
  calcular(analise: AnalisePerfil, area: string) {
    const referencia = benchmarkPorArea[area] ?? benchmarkPorArea[NomeArea.OUTRO]
    const mediaArea = calcularTotal(referencia)
    const percentil = calcularPercentil(analise.scoreEmpregabilidade, mediaArea)
    const categoriaMaisForte = categoriasPontuacao
      .map((categoria) => ({
        ...categoria,
        diferenca: analise.pontuacaoDetalhes[categoria.chave] - referencia[categoria.chave],
      }))
      .sort((a, b) => b.diferenca - a.diferenca)[0]

    return {
      referencia,
      mediaArea,
      percentil,
      categoriaMaisForte,
    }
  },
}
