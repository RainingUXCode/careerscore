import type { AnalisePerfil, ChavePontuacaoDetalhes, PontuacaoDetalhes } from '../types/models'
import { NomeArea } from '../types/enums'

export const categoriasPontuacao: Array<{
  chave: ChavePontuacaoDetalhes
  label: string
  maximo: number
}> = [
  { chave: 'competenciasRelevantes', label: 'Competências relevantes', maximo: 30 },
  { chave: 'experienciaEvidencias', label: 'Experiência e evidências práticas', maximo: 25 },
  { chave: 'projetosEntregas', label: 'Projetos e entregas demonstráveis', maximo: 20 },
  { chave: 'consistenciaPerfil', label: 'Consistência do perfil profissional', maximo: 15 },
  { chave: 'curriculoApresentacao', label: 'Currículo e apresentação profissional', maximo: 10 },
]

type PontuacaoReferencia = Record<ChavePontuacaoDetalhes, number>

const benchmarkPorArea: Record<string, PontuacaoReferencia> = {
  [NomeArea.TECNOLOGIA_DADOS]: {
    competenciasRelevantes: 20,
    experienciaEvidencias: 15,
    projetosEntregas: 13,
    consistenciaPerfil: 10,
    curriculoApresentacao: 7,
  },
  [NomeArea.SAUDE]: {
    competenciasRelevantes: 18,
    experienciaEvidencias: 16,
    projetosEntregas: 9,
    consistenciaPerfil: 10,
    curriculoApresentacao: 7,
  },
  [NomeArea.GESTAO_NEGOCIOS]: {
    competenciasRelevantes: 19,
    experienciaEvidencias: 16,
    projetosEntregas: 10,
    consistenciaPerfil: 10,
    curriculoApresentacao: 7,
  },
  [NomeArea.ENGENHARIA]: {
    competenciasRelevantes: 19,
    experienciaEvidencias: 16,
    projetosEntregas: 11,
    consistenciaPerfil: 10,
    curriculoApresentacao: 7,
  },
  [NomeArea.COMERCIO_ATENDIMENTO]: {
    competenciasRelevantes: 16,
    experienciaEvidencias: 15,
    projetosEntregas: 8,
    consistenciaPerfil: 9,
    curriculoApresentacao: 7,
  },
  [NomeArea.OUTRO]: {
    competenciasRelevantes: 17,
    experienciaEvidencias: 14,
    projetosEntregas: 9,
    consistenciaPerfil: 9,
    curriculoApresentacao: 7,
  },
}

function calcularTotal(referencia: PontuacaoReferencia): number {
  return categoriasPontuacao.reduce((soma, categoria) => soma + referencia[categoria.chave], 0)
}

function calcularPercentil(score: number, media: number): number {
  const diferenca = score - media
  return Math.max(8, Math.min(94, Math.round(50 + diferenca * 1.35)))
}

function pontosDaCategoria(detalhes: PontuacaoDetalhes, chave: ChavePontuacaoDetalhes): number {
  return detalhes[chave]?.pontos ?? 0
}

export const benchmarkService = {
  calcular(analise: AnalisePerfil, area: string) {
    const referencia = benchmarkPorArea[area] ?? benchmarkPorArea[NomeArea.OUTRO]
    const mediaArea = calcularTotal(referencia)
    const percentil = calcularPercentil(analise.scoreEmpregabilidade, mediaArea)
    const categoriaMaisForte = categoriasPontuacao
      .map((categoria) => ({
        ...categoria,
        diferenca: pontosDaCategoria(analise.pontuacaoDetalhes, categoria.chave) - referencia[categoria.chave],
      }))
      .sort((a, b) => b.diferenca - a.diferenca)[0]

    return {
      referencia,
      mediaArea,
      percentil,
      categoriaMaisForte,
      observacao: 'Referência heurística local: não representa estatística externa de mercado.',
    }
  },
}
