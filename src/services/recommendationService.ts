import type { Candidato, Vaga, RecomendacaoVaga } from '../types/models'
import { ChanceEntrevista, NivelExperiencia } from '../types/enums'
import { vagasMock } from '../data/vagas'
import { gerarId } from '../utils/id'
import { calcularDuracaoMeses } from '../utils/formatters'

const DIAS_MAXIMOS_VAGA_RECENTE = 45

const ordemExperiencia: Record<string, number> = {
  [NivelExperiencia.ESTAGIARIO]: 0,
  [NivelExperiencia.JUNIOR]: 1,
  [NivelExperiencia.PLENO]: 2,
  [NivelExperiencia.SENIOR]: 3,
  [NivelExperiencia.ESPECIALISTA]: 4,
}

function calcularAderenciaArea(candidato: Candidato, vaga: Vaga): number {
  return candidato.areaInteresse.nome === vaga.area ? 30 : 0
}

function atendeModalidadePreferida(candidato: Candidato, vaga: Vaga): boolean {
  const modalidadesPreferidas = candidato.modalidadesPreferidas?.length
    ? candidato.modalidadesPreferidas
    : [vaga.modalidade]

  return modalidadesPreferidas.includes(vaga.modalidade)
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function textoSenioridadeVaga(vaga: Vaga): string {
  return normalizarTexto([vaga.titulo, vaga.descricao, vaga.requisitos.join(' ')].join(' '))
}

function classificarNivelVaga(vaga: Vaga): number {
  const texto = textoSenioridadeVaga(vaga)

  if (/estagio|estagiario|trainee|aprendiz|primeiro emprego|programa|formacao|novos talentos|bolsa auxilio|next gen|genew/.test(texto)) {
    return ordemExperiencia[NivelExperiencia.ESTAGIARIO]
  }
  if (/junior|\bjr\b|desenvolvedor.* i\b|analista.* i\b/.test(texto)) {
    return ordemExperiencia[NivelExperiencia.JUNIOR]
  }
  if (/senior|especialista|staff|principal/.test(texto)) {
    return ordemExperiencia[NivelExperiencia.SENIOR]
  }
  if (/pleno|mid-level|mid level/.test(texto)) {
    return ordemExperiencia[NivelExperiencia.PLENO]
  }

  return ordemExperiencia[NivelExperiencia.PLENO]
}

function atendeNivelExperiencia(candidato: Candidato, vaga: Vaga): boolean {
  const nivelCandidato = ordemExperiencia[candidato.nivelExperiencia] ?? ordemExperiencia[NivelExperiencia.JUNIOR]
  const nivelVaga = classificarNivelVaga(vaga)

  if (nivelCandidato === ordemExperiencia[NivelExperiencia.ESTAGIARIO]) {
    return nivelVaga === ordemExperiencia[NivelExperiencia.ESTAGIARIO]
  }

  return nivelVaga <= nivelCandidato
}

function calcularExperienciaTotalMeses(candidato: Candidato): number {
  return candidato.experiencias.reduce(
    (total, experiencia) => total + calcularDuracaoMeses(experiencia.dataInicio, experiencia.dataFim),
    0,
  )
}

function atendeExperienciaMinima(candidato: Candidato, vaga: Vaga): boolean {
  if (candidato.nivelExperiencia === NivelExperiencia.ESTAGIARIO && vaga.experienciaMinimaMeses > 0) {
    return false
  }

  return calcularExperienciaTotalMeses(candidato) >= vaga.experienciaMinimaMeses
}

function vagaEstaAberta(vaga: Vaga): boolean {
  return vaga.status === 'Aberta'
}

function vagaRecente(vaga: Vaga): boolean {
  const publicadaEm = new Date(`${vaga.dataPublicacao}T00:00:00`)
  if (Number.isNaN(publicadaEm.getTime())) return false

  const agora = new Date()
  const dias = (agora.getTime() - publicadaEm.getTime()) / (1000 * 60 * 60 * 24)
  return dias >= 0 && dias <= DIAS_MAXIMOS_VAGA_RECENTE
}

function calcularAderenciaCompetencias(candidato: Candidato, vaga: Vaga): number {
  if (vaga.requisitos.length === 0) return 0
  const nomesCandidato = candidato.competencias.map((c) => c.nome.toLowerCase())
  const atendidos = vaga.requisitos.filter((req) =>
    nomesCandidato.some((nome) => nome.includes(req.toLowerCase()) || req.toLowerCase().includes(nome)),
  )
  return Math.round((atendidos.length / vaga.requisitos.length) * 35)
}

function calcularAderenciaIdiomas(candidato: Candidato, vaga: Vaga): number {
  const exigeIngles = /ingl[eê]s|english/i.test(vaga.requisitos.join(' ') + vaga.descricao)
  if (!exigeIngles) return 10
  const idiomaIngles = candidato.idiomas.find((i) => /ingl[eê]s|english/i.test(i.nome))
  if (!idiomaIngles) return 0
  const pesoPorNivel: Record<string, number> = {
    Básico: 3,
    Intermediário: 6,
    Avançado: 9,
    Fluente: 10,
    Nativo: 10,
  }
  return pesoPorNivel[idiomaIngles.nivelProficiencia] ?? 0
}

function calcularAderenciaExperiencia(candidato: Candidato, vaga: Vaga): number {
  const nivelCandidato = ordemExperiencia[candidato.nivelExperiencia] ?? 0
  const nivelAlvo = classificarNivelVaga(vaga)
  const diferenca = Math.abs(nivelCandidato - nivelAlvo)
  return Math.max(0, 15 - diferenca * 6)
}

function calcularAderenciaNivel(candidato: Candidato): number {
  return candidato.experiencias.length > 0 ? 10 : 5
}

function gerarJustificativa(candidato: Candidato, vaga: Vaga, compatibilidade: number): string {
  const partes: string[] = []
  if (atendeModalidadePreferida(candidato, vaga)) {
    partes.push(`modalidade ${vaga.modalidade.toLowerCase()} dentro da preferencia`)
  }
  if (candidato.areaInteresse.nome === vaga.area) {
    partes.push('área de interesse compatível')
  }
  const nomesCandidato = candidato.competencias.map((c) => c.nome.toLowerCase())
  const requisitosAtendidos = vaga.requisitos.filter((req) =>
    nomesCandidato.some((nome) => nome.includes(req.toLowerCase())),
  )
  if (requisitosAtendidos.length > 0) {
    partes.push(`competências em comum: ${requisitosAtendidos.slice(0, 3).join(', ')}`)
  }
  if (partes.length === 0) {
    partes.push('aderência parcial ao perfil da vaga')
  }
  return `Compatibilidade de ${Math.round(compatibilidade)}% com base em ${partes.join(' e ')}.`
}

function mapearChanceEntrevista(compatibilidade: number): ChanceEntrevista {
  if (compatibilidade >= 90) return ChanceEntrevista.MUITO_ALTA
  if (compatibilidade >= 80) return ChanceEntrevista.ALTA
  if (compatibilidade >= 70) return ChanceEntrevista.MEDIA
  return ChanceEntrevista.BAIXA
}

export const recommendationService = {
  calcularCompatibilidade(candidato: Candidato, vaga: Vaga): number {
    const total =
      calcularAderenciaArea(candidato, vaga) +
      calcularAderenciaCompetencias(candidato, vaga) +
      calcularAderenciaIdiomas(candidato, vaga) +
      calcularAderenciaExperiencia(candidato, vaga) +
      calcularAderenciaNivel(candidato)
    return Math.min(100, Math.round(total))
  },

  gerarRecomendacoes(candidato: Candidato): RecomendacaoVaga[] {
    return vagasMock
      .filter((vaga) => vagaEstaAberta(vaga))
      .filter((vaga) => vagaRecente(vaga))
      .filter((vaga) => atendeModalidadePreferida(candidato, vaga))
      .filter((vaga) => atendeNivelExperiencia(candidato, vaga))
      .filter((vaga) => atendeExperienciaMinima(candidato, vaga))
      .map((vaga) => {
        const compatibilidade = this.calcularCompatibilidade(candidato, vaga)
        return {
          idRecomendacao: gerarId('rec'),
          vaga,
          compatibilidade,
          justificativa: gerarJustificativa(candidato, vaga, compatibilidade),
          chanceEntrevista: mapearChanceEntrevista(compatibilidade),
        }
      })
      .filter((rec) => rec.compatibilidade >= 70)
      .sort((a, b) => b.compatibilidade - a.compatibilidade)
  },
}
