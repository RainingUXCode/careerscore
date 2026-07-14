import type { Candidato } from '../types/models'
import type { VagaNormalizada } from '../types/vaga'
import type {
  ResultadoCompatibilidade,
  DimensaoCompatibilidade,
  ConfiabilidadeCompatibilidade,
  RecomendacaoCandidatura,
  ImpeditivoCompatibilidade,
} from '../types/compatibilidade'
import {
  avaliarArea,
  avaliarCargo,
  avaliarSenioridade,
  avaliarFormacao,
  avaliarExperiencia,
  avaliarCompetenciasTecnicas,
  avaliarSoftSkills,
  avaliarCompetenciasTransferiveis,
  avaliarIdiomas,
  avaliarCertificados,
  avaliarLicencas,
  avaliarLocalizacao,
  avaliarModalidade,
  avaliarTipoContrato,
  avaliarFaixaSalarial,
} from './compatibilidade/dimensoes'
import { analisarExperienciasAnteriores } from './competenciasTransferiveisService'

function calcularCompatibilidadeGeral(dimensoes: DimensaoCompatibilidade[]): number {
  const avaliadas = dimensoes.filter((d) => d.avaliada && d.nota !== undefined)
  if (avaliadas.length === 0) return 0

  const somaPesos = avaliadas.reduce((soma, d) => soma + d.pesoAplicado, 0)
  const somaPonderada = avaliadas.reduce((soma, d) => soma + (d.nota ?? 0) * d.pesoAplicado, 0)

  return somaPesos > 0 ? Math.round((somaPonderada / somaPesos) * 10) : 0
}

function calcularConfiabilidade(dimensoes: DimensaoCompatibilidade[]): ConfiabilidadeCompatibilidade {
  const avaliadas = dimensoes.filter((d) => d.avaliada)
  const semDados = dimensoes.filter((d) => !d.avaliada)
  const percentual = Math.round((avaliadas.length / dimensoes.length) * 100)

  return {
    percentual,
    dimensoesAvaliadas: avaliadas.length,
    totalDimensoes: dimensoes.length,
    dimensoesSemDados: semDados.map((d) => d.nome),
    resumo:
      semDados.length === 0
        ? 'Todas as dimensões puderam ser avaliadas com os dados disponíveis.'
        : `${semDados.length} dimensão(ões) não puderam ser avaliadas por falta de dados: ${semDados.map((d) => d.nome).join(', ')}.`,
  }
}

function gerarRecomendacao(
  compatibilidadeGeral: number,
  confiabilidade: ConfiabilidadeCompatibilidade,
  impeditivos: ImpeditivoCompatibilidade[],
): { recomendacao: RecomendacaoCandidatura; motivos: string[] } {
  if (impeditivos.length > 0) {
    return {
      recomendacao: 'nao_recomendada',
      motivos: impeditivos.map((i) => i.descricao),
    }
  }

  const motivos: string[] = []
  if (compatibilidadeGeral >= 75) motivos.push('boa aderência aos requisitos principais')
  else if (compatibilidadeGeral >= 55) motivos.push('aderência parcial aos requisitos principais')
  else motivos.push('aderência baixa aos requisitos identificados')

  if (confiabilidade.percentual < 60) {
    motivos.push(`vários dados da vaga não foram informados (${confiabilidade.dimensoesSemDados.slice(0, 3).join(', ')})`)
  }

  let recomendacao: RecomendacaoCandidatura
  if (compatibilidadeGeral >= 75 && confiabilidade.percentual >= 60) {
    recomendacao = 'recomendada'
  } else if (compatibilidadeGeral >= 55) {
    recomendacao = 'recomendada_com_ressalvas'
  } else if (compatibilidadeGeral >= 35) {
    recomendacao = 'avaliar_com_cuidado'
  } else {
    recomendacao = 'nao_recomendada'
  }

  return { recomendacao, motivos }
}

export function calcularCompatibilidade(candidato: Candidato, vaga: VagaNormalizada): ResultadoCompatibilidade {
  const dimensaoArea = avaliarArea(candidato, vaga)
  const dimensaoCargo = avaliarCargo(candidato, vaga)
  const { dimensao: dimensaoSenioridade, impeditivo: impeditivoSenioridade } = avaliarSenioridade(candidato, vaga)
  const dimensaoFormacao = avaliarFormacao(candidato, vaga)
  const dimensaoExperiencia = avaliarExperiencia(candidato, vaga)
  const dimensaoTecnicas = avaliarCompetenciasTecnicas(candidato, vaga)
  const dimensaoSoftSkills = avaliarSoftSkills(candidato, vaga)

  const requisitosAusentesDiretos = [...dimensaoTecnicas.requisitosAusentes, ...dimensaoSoftSkills.requisitosAusentes]
  const { dimensao: dimensaoTransferiveis, competenciasTransferiveis } = avaliarCompetenciasTransferiveis(
    candidato,
    requisitosAusentesDiretos,
    vaga.areaId,
  )

  const { dimensao: dimensaoIdiomas, impeditivo: impeditivoIdioma } = avaliarIdiomas(candidato, vaga)
  const dimensaoCertificados = avaliarCertificados(candidato, vaga)
  const { dimensao: dimensaoLicencas, impeditivo: impeditivoLicenca } = avaliarLicencas(candidato, vaga)
  const { dimensao: dimensaoLocalizacao, impeditivo: impeditivoLocalizacao } = avaliarLocalizacao(candidato, vaga)
  const { dimensao: dimensaoModalidade, impeditivo: impeditivoModalidade } = avaliarModalidade(candidato, vaga)
  const dimensaoTipoContrato = avaliarTipoContrato(candidato, vaga)
  const dimensaoFaixaSalarial = avaliarFaixaSalarial()

  const dimensoes = [
    dimensaoArea,
    dimensaoCargo,
    dimensaoSenioridade,
    dimensaoFormacao,
    dimensaoExperiencia,
    dimensaoTecnicas,
    dimensaoSoftSkills,
    dimensaoTransferiveis,
    dimensaoIdiomas,
    dimensaoCertificados,
    dimensaoLicencas,
    dimensaoLocalizacao,
    dimensaoModalidade,
    dimensaoTipoContrato,
    dimensaoFaixaSalarial,
  ]

  const impeditivos: ImpeditivoCompatibilidade[] = [
    impeditivoIdioma && { descricao: impeditivoIdioma, motivo: 'idioma_obrigatorio_ausente' },
    impeditivoSenioridade && { descricao: impeditivoSenioridade, motivo: 'senioridade_incompativel' },
    impeditivoLicenca && { descricao: impeditivoLicenca, motivo: 'licenca_obrigatoria_ausente' },
    impeditivoLocalizacao && { descricao: impeditivoLocalizacao, motivo: 'localizacao_incompativel' },
    impeditivoModalidade && { descricao: impeditivoModalidade, motivo: 'modalidade_incompativel' },
  ].filter((i): i is ImpeditivoCompatibilidade => Boolean(i))

  const compatibilidadeGeral = calcularCompatibilidadeGeral(dimensoes)
  const experienciasAnteriores = analisarExperienciasAnteriores(candidato, vaga.areaId)
  const confiabilidade = calcularConfiabilidade(dimensoes)
  const { recomendacao, motivos } = gerarRecomendacao(compatibilidadeGeral, confiabilidade, impeditivos)

  return {
    vagaId: vaga.id,
    compatibilidadeGeral,
    dimensoes,
    confiabilidade,
    competenciasTransferiveis,
    experienciasAnteriores,
    impeditivos,
    recomendacaoCandidatura: recomendacao,
    motivosRecomendacao: motivos,
  }
}
