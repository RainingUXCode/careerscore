import type { Candidato } from '../../types/models'
import type { TipoContratoVaga, VagaNormalizada, RequisitoVaga, NivelSenioridadeVaga } from '../../types/vaga'
import type { DimensaoCompatibilidade, CompetenciaTransferivel } from '../../types/compatibilidade'
import { NivelProficiencia, StatusCurso, TipoCompetencia } from '../../types/enums'
import { obterAreaPorId } from '../../data/areasProfissionais'
import { resolverAreaDoCandidato } from '../areaBridgeService'
import { resolverSenioridadeDoCandidato, ordemSenioridadeVaga } from '../senioridadeBridgeService'
import { analisarExperienciasAnteriores, detectarOrigensTransferiveis } from '../competenciasTransferiveisService'
import { normalizarTexto } from '../../utils/texto'
import { calcularDuracaoMeses } from '../../utils/formatters'
import { pesosCompatibilidade } from '../../config/pesosCompatibilidade'
import { contratosEfetivosDaOpcao } from '../objetivoContratoService'

function baseDimensao(chave: string, nome: string, peso: number): Omit<DimensaoCompatibilidade, 'avaliada' | 'confianca' | 'justificativa'> {
  return {
    chave,
    nome,
    pesoOriginal: peso,
    pesoAplicado: peso,
    evidencias: [],
    requisitosAtendidos: [],
    requisitosParciais: [],
    requisitosAusentes: [],
    acoesRecomendadas: [],
  }
}

function naoAvaliada(chave: string, nome: string, peso: number, motivo: string): DimensaoCompatibilidade {
  return { ...baseDimensao(chave, nome, peso), avaliada: false, confianca: 0, justificativa: motivo }
}

function textoContem(textoNormalizado: string, termo: string): boolean {
  const termoNormalizado = normalizarTexto(termo)
  return textoNormalizado.includes(termoNormalizado) || termoNormalizado.includes(textoNormalizado)
}

function obterCargoObjetivoAtivo(candidato: Candidato): string | undefined {
  const objetivo = candidato.objetivoProfissional
  return objetivo?.modo === 'definido' ? objetivo.opcoes[0]?.cargoOuArea?.trim() || undefined : undefined
}

function obterNivelAlvoAtivo(candidato: Candidato): NivelSenioridadeVaga | 'Trainee' | 'Indiferente' | undefined {
  const objetivo = candidato.objetivoProfissional
  return objetivo?.modo === 'definido' ? objetivo.opcoes[0]?.nivelAlvo : undefined
}

// ---------------------------------------------------------------------------
// 1. Área profissional
// ---------------------------------------------------------------------------
export function avaliarArea(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'area'
  const nome = 'Área profissional'
  const peso = pesosCompatibilidade.area

  const areaCandidato = resolverAreaDoCandidato(candidato)
  const areaVaga = obterAreaPorId(vaga.areaId)

  if (!areaCandidato || !areaVaga) {
    return naoAvaliada(chave, nome, peso, 'Não foi possível identificar a área profissional de um dos lados com confiança suficiente.')
  }

  const mesmaArea = areaCandidato.id === areaVaga.id
  const relacionada = areaCandidato.categoriaPaiId === areaVaga.id || areaVaga.categoriaPaiId === areaCandidato.id

  const nota = mesmaArea ? 10 : relacionada ? 6 : 0

  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.9,
    nota,
    justificativa: mesmaArea
      ? `Sua área de interesse (${areaCandidato.nome}) corresponde diretamente à área da vaga.`
      : relacionada
        ? `Sua área de interesse (${areaCandidato.nome}) é próxima da área da vaga (${areaVaga.nome}).`
        : `Sua área de interesse (${areaCandidato.nome}) é diferente da área da vaga (${areaVaga.nome}).`,
    requisitosAtendidos: mesmaArea ? [areaVaga.nome] : [],
    requisitosAusentes: mesmaArea ? [] : [areaVaga.nome],
  }
}

// ---------------------------------------------------------------------------
// 2. Cargo
// ---------------------------------------------------------------------------
export function avaliarCargo(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'cargo'
  const nome = 'Cargo'
  const peso = pesosCompatibilidade.cargo
  const cargoDesejado = obterCargoObjetivoAtivo(candidato)

  if (!vaga.cargoNormalizado || !cargoDesejado) {
    return naoAvaliada(chave, nome, peso, 'Sem objetivo de cargo definido para comparar com a vaga.')
  }

  const bateObjetivo = textoContem(normalizarTexto(vaga.cargoNormalizado), cargoDesejado)
  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.8,
    nota: bateObjetivo ? 10 : 4,
    justificativa: bateObjetivo
      ? `O cargo da vaga se aproxima do seu objetivo atual: "${cargoDesejado}".`
      : `O cargo da vaga nao parece diretamente alinhado ao objetivo informado: "${cargoDesejado}".`,
    requisitosAtendidos: bateObjetivo ? [cargoDesejado] : [],
    requisitosParciais: bateObjetivo ? [] : [cargoDesejado],
  }
}

// ---------------------------------------------------------------------------
// 3. Senioridade
// ---------------------------------------------------------------------------
export function avaliarSenioridade(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'senioridade'
  const nome = 'Senioridade'
  const peso = pesosCompatibilidade.senioridade

  if (!vaga.senioridadeInformada || !vaga.senioridade) {
    return naoAvaliada(chave, nome, peso, 'A empresa não informou o nível de experiência esperado para esta vaga.')
  }

  const nivelAlvo = obterNivelAlvoAtivo(candidato)
  if (!nivelAlvo) {
    return naoAvaliada(chave, nome, peso, 'Sem senioridade alvo definida no objetivo profissional.')
  }
  if (nivelAlvo === 'Indiferente') {
    return naoAvaliada(chave, nome, peso, 'O objetivo profissional marcou senioridade indiferente.')
  }
  const senioridadeCandidato =
    nivelAlvo && nivelAlvo !== 'Trainee' ? nivelAlvo : resolverSenioridadeDoCandidato(candidato.nivelExperiencia)
  const diferenca = Math.abs(ordemSenioridadeVaga[senioridadeCandidato] - ordemSenioridadeVaga[vaga.senioridade])
  const nota = diferenca === 0 ? 10 : diferenca === 1 ? 6 : 2

  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.8,
    nota,
    justificativa: `Vaga busca nível "${vaga.senioridade}"; seu nível informado é "${senioridadeCandidato}".`,
    requisitosAtendidos: diferenca === 0 ? [vaga.senioridade] : [],
    requisitosParciais: diferenca === 1 ? [vaga.senioridade] : [],
    requisitosAusentes: diferenca > 1 ? [vaga.senioridade] : [],
  }
}

// ---------------------------------------------------------------------------
// 4. Formação
// ---------------------------------------------------------------------------
export function avaliarFormacao(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'formacao'
  const nome = 'Formação'
  const peso = pesosCompatibilidade.formacao

  if (!vaga.formacaoRequerida || vaga.formacaoRequerida.length === 0) {
    return naoAvaliada(chave, nome, peso, 'A vaga não especifica um requisito de formação.')
  }

  const atendidos: string[] = []
  const parciais: string[] = []
  const ausentes: string[] = []

  for (const requisito of vaga.formacaoRequerida) {
    const requisitoNormalizado = normalizarTexto(requisito)
    const match = candidato.escolaridades.find(
      (esc) => textoContem(requisitoNormalizado, esc.curso) || textoContem(requisitoNormalizado, esc.nivel),
    )
    if (match && match.status === StatusCurso.CONCLUIDO) atendidos.push(requisito)
    else if (match) parciais.push(requisito)
    else ausentes.push(requisito)
  }

  const nota = ((atendidos.length + parciais.length * 0.5) / vaga.formacaoRequerida.length) * 10

  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.7,
    nota: Math.round(nota),
    justificativa:
      ausentes.length === 0
        ? 'Sua formação atende ao que a vaga pede.'
        : 'A vaga pede formação relacionada que não foi identificada no seu perfil; isso pode ser aceito se a empresa considerar áreas correlatas.',
    requisitosAtendidos: atendidos,
    requisitosParciais: parciais,
    requisitosAusentes: ausentes,
  }
}

// ---------------------------------------------------------------------------
// 5. Experiência profissional
// ---------------------------------------------------------------------------
export function avaliarExperiencia(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'experiencia'
  const nome = 'Experiência profissional'
  const peso = pesosCompatibilidade.experiencia

  if (vaga.experienciaMinimaMeses === undefined) {
    return naoAvaliada(chave, nome, peso, 'A vaga não especifica experiência mínima.')
  }

  const analisesExperiencias = analisarExperienciasAnteriores(candidato, vaga.areaId)
  const mesesPonderados = candidato.experiencias.reduce((soma, exp) => {
    const analise = analisesExperiencias.find((item) => item.experienciaId === exp.idExperiencia)
    const meses = calcularDuracaoMeses(exp.dataInicio, exp.empregoAtual ? undefined : exp.dataFim || exp.dataInicio)
    const pesoRelacao =
      analise?.tipoRelacao === 'direta'
        ? 1
        : analise?.tipoRelacao === 'relacionada'
          ? 0.6
          : (analise?.competenciasTransferiveis.length ?? 0) > 0
            ? 0.25
            : 0
    return soma + meses * pesoRelacao
  }, 0)

  if (vaga.experienciaMinimaMeses === 0) {
    return {
      ...baseDimensao(chave, nome, peso),
      avaliada: true,
      confianca: 0.9,
      nota: 10,
      justificativa: 'Vaga de primeiro emprego/estágio; não exige experiência prévia.',
    }
  }

  const proporcao = Math.min(mesesPonderados / vaga.experienciaMinimaMeses, 1)
  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.8,
    nota: Math.round(proporcao * 10),
    justificativa: `Vaga pede ao menos ${vaga.experienciaMinimaMeses} meses de experiência; seu histórico ponderado por relação com a área equivale a ${Math.round(mesesPonderados)} meses.`,
  }
}

// ---------------------------------------------------------------------------
// 6/7. Competências (técnicas ou comportamentais)
// ---------------------------------------------------------------------------
function avaliarCompetenciasPorTipo(
  candidato: Candidato,
  vaga: VagaNormalizada,
  tipoRequisito: 'competencia_tecnica' | 'competencia_comportamental',
  tipoCompetenciaCandidato: TipoCompetencia,
  chave: string,
  nome: string,
  peso: number,
): DimensaoCompatibilidade {
  const requisitos = [...vaga.requisitosObrigatorios, ...vaga.requisitosDesejaveis].filter(
    (r) => r.tipo === tipoRequisito || r.tipo === 'ferramenta',
  )

  if (requisitos.length === 0) {
    return naoAvaliada(chave, nome, peso, 'A vaga não lista requisitos desse tipo.')
  }

  const nomesCandidato = candidato.competencias
    .filter((c) => c.tipo === tipoCompetenciaCandidato)
    .map((c) => normalizarTexto(c.nome))

  const atendidos: string[] = []
  const ausentes: string[] = []

  requisitos.forEach((requisito) => {
    const bateu = nomesCandidato.some((nomeCompetencia) => textoContem(nomeCompetencia, requisito.nome))
    if (bateu) atendidos.push(requisito.nome)
    else ausentes.push(requisito.nome)
  })

  const obrigatorios = requisitos.filter((r) => r.obrigatorio)
  const obrigatoriosAtendidos = obrigatorios.filter((r) => atendidos.includes(r.nome))
  const pesoObrigatorios = obrigatorios.length > 0 ? 0.7 : 0
  const pesoDesejaveis = 1 - pesoObrigatorios

  const notaObrigatorios = obrigatorios.length > 0 ? (obrigatoriosAtendidos.length / obrigatorios.length) * 10 : 0
  const desejaveis = requisitos.filter((r) => !r.obrigatorio)
  const desejaveisAtendidos = desejaveis.filter((r) => atendidos.includes(r.nome))
  const notaDesejaveis = desejaveis.length > 0 ? (desejaveisAtendidos.length / desejaveis.length) * 10 : 0

  const nota =
    obrigatorios.length > 0 && desejaveis.length > 0
      ? notaObrigatorios * pesoObrigatorios + notaDesejaveis * pesoDesejaveis
      : obrigatorios.length > 0
        ? notaObrigatorios
        : notaDesejaveis

  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.75,
    nota: Math.round(nota),
    justificativa:
      ausentes.length === 0
        ? 'Você atende a todos os requisitos listados desse tipo.'
        : `Faltam evidências de: ${ausentes.slice(0, 3).join(', ')}.`,
    requisitosAtendidos: atendidos,
    requisitosAusentes: ausentes,
    acoesRecomendadas: ausentes.slice(0, 2).map((nomeAusente) => `Destacar ou desenvolver "${nomeAusente}" para reforçar a candidatura.`),
  }
}

export function avaliarCompetenciasTecnicas(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  return avaliarCompetenciasPorTipo(
    candidato,
    vaga,
    'competencia_tecnica',
    TipoCompetencia.TECNICA,
    'competencias_tecnicas',
    'Competências técnicas e específicas',
    pesosCompatibilidade.competenciasTecnicas,
  )
}

export function avaliarSoftSkills(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  return avaliarCompetenciasPorTipo(
    candidato,
    vaga,
    'competencia_comportamental',
    TipoCompetencia.COMPORTAMENTAL,
    'soft_skills',
    'Soft skills',
    pesosCompatibilidade.softSkills,
  )
}

// ---------------------------------------------------------------------------
// 8. Competências transferíveis
// ---------------------------------------------------------------------------
export function avaliarCompetenciasTransferiveis(
  candidato: Candidato,
  requisitosAusentesDiretos: string[],
  areaAlvoId?: string,
): { dimensao: DimensaoCompatibilidade; competenciasTransferiveis: CompetenciaTransferivel[] } {
  const chave = 'competencias_transferiveis'
  const nome = 'Competencias transferiveis'
  const peso = pesosCompatibilidade.competenciasTransferiveis
  const requisitosUnicos = Array.from(new Set(requisitosAusentesDiretos.map((requisito) => requisito.trim()).filter(Boolean)))

  if (requisitosUnicos.length === 0) {
    return {
      dimensao: naoAvaliada(chave, nome, peso, 'Nao ha requisitos ausentes para avaliar via competencias transferiveis.'),
      competenciasTransferiveis: [],
    }
  }

  const origens = detectarOrigensTransferiveis(candidato, areaAlvoId)
  const encontradas: CompetenciaTransferivel[] = []
  const competenciasJaContadas = new Set<string>()

  for (const ausente of requisitosUnicos) {
    for (const origem of origens) {
      const item = origem.itens.find((i) => textoContem(normalizarTexto(ausente), i.competencia))
      const chaveCompetencia = item ? normalizarTexto(item.competencia) : undefined
      if (item && chaveCompetencia && !competenciasJaContadas.has(chaveCompetencia)) {
        competenciasJaContadas.add(chaveCompetencia)
        encontradas.push({
          nome: item.competencia,
          origemExperiencia: origem.origemDescricao,
          justificativa: item.justificativa,
          evidencia: item.evidencia,
          confianca: item.confianca,
        })
        break
      }
    }
  }

  const nota = Math.round((encontradas.length / requisitosUnicos.length) * 10)

  return {
    dimensao: {
      ...baseDimensao(chave, nome, peso),
      avaliada: encontradas.length > 0,
      confianca: 0.5,
      nota: encontradas.length > 0 ? nota : undefined,
      justificativa:
        encontradas.length > 0
          ? `${encontradas.length} requisito(s) ausente(s) tem competencia transferivel relacionada na sua experiencia.`
          : 'Nenhuma competencia transferivel identificada para os requisitos ausentes.',
      requisitosParciais: encontradas.map((e) => e.nome),
    },
    competenciasTransferiveis: encontradas,
  }
}

// ---------------------------------------------------------------------------
// 9. Idiomas
// ---------------------------------------------------------------------------
const ordemProficiencia: Record<string, number> = {
  [NivelProficiencia.BASICO]: 1,
  [NivelProficiencia.INTERMEDIARIO]: 2,
  [NivelProficiencia.AVANCADO]: 3,
  [NivelProficiencia.FLUENTE]: 4,
  [NivelProficiencia.NATIVO]: 4,
}

export function avaliarIdiomas(
  candidato: Candidato,
  vaga: VagaNormalizada,
): { dimensao: DimensaoCompatibilidade; impeditivo?: string } {
  const chave = 'idiomas'
  const nome = 'Idiomas'
  const peso = pesosCompatibilidade.idiomas

  if (vaga.idiomasExigidos.length === 0) {
    return { dimensao: naoAvaliada(chave, nome, peso, 'A vaga não especifica exigência de idiomas.') }
  }

  const atendidos: string[] = []
  const parciais: string[] = []
  const ausentes: string[] = []
  let impeditivo: string | undefined

  for (const exigido of vaga.idiomasExigidos) {
    const idiomaCandidato = candidato.idiomas.find((i) => textoContem(normalizarTexto(i.nome), exigido.idioma))

    if (!idiomaCandidato) {
      ausentes.push(exigido.idioma)
      if (exigido.obrigatorio) {
        impeditivo = `Idioma obrigatório "${exigido.idioma}" não encontrado no seu perfil.`
      }
      continue
    }

    if (!exigido.nivelMinimo) {
      atendidos.push(exigido.idioma)
      continue
    }

    const nivelCandidato = ordemProficiencia[idiomaCandidato.nivelProficiencia] ?? 0
    const nivelExigido = ordemProficiencia[exigido.nivelMinimo] ?? 0
    if (nivelCandidato >= nivelExigido) {
      atendidos.push(exigido.idioma)
    } else {
      parciais.push(exigido.idioma)
      if (exigido.obrigatorio) {
        impeditivo = `Idioma obrigatório "${exigido.idioma}" exigido em nível igual ou superior a "${exigido.nivelMinimo}", abaixo do seu nível atual.`
      }
    }
  }

  const nota = ((atendidos.length + parciais.length * 0.5) / vaga.idiomasExigidos.length) * 10

  return {
    dimensao: {
      ...baseDimensao(chave, nome, peso),
      avaliada: true,
      confianca: 0.8,
      nota: Math.round(nota),
      justificativa:
        ausentes.length === 0 && parciais.length === 0
          ? 'Seus idiomas atendem ao que a vaga exige.'
          : `Idiomas a reforçar: ${[...parciais, ...ausentes].join(', ')}.`,
      requisitosAtendidos: atendidos,
      requisitosParciais: parciais,
      requisitosAusentes: ausentes,
    },
    impeditivo,
  }
}

// ---------------------------------------------------------------------------
// 10. Certificados
// ---------------------------------------------------------------------------
export function avaliarCertificados(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'certificados'
  const nome = 'Certificados'
  const peso = pesosCompatibilidade.certificados

  const requisitos = [...vaga.requisitosObrigatorios, ...vaga.requisitosDesejaveis].filter((r) => r.tipo === 'certificado')
  if (requisitos.length === 0) {
    return naoAvaliada(chave, nome, peso, 'A vaga não exige certificados específicos.')
  }

  const nomesCertificados = candidato.certificados.map((c) => normalizarTexto(c.titulo))
  const atendidos = requisitos.filter((r) => nomesCertificados.some((nomeCertificado) => textoContem(nomeCertificado, r.nome))).map((r) => r.nome)
  const ausentes = requisitos.filter((r) => !atendidos.includes(r.nome)).map((r) => r.nome)

  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.7,
    nota: Math.round((atendidos.length / requisitos.length) * 10),
    justificativa: ausentes.length === 0 ? 'Você possui os certificados pedidos.' : `Certificados não encontrados: ${ausentes.join(', ')}.`,
    requisitosAtendidos: atendidos,
    requisitosAusentes: ausentes,
  }
}

// ---------------------------------------------------------------------------
// 11. Licenças (podem ser impeditivo real quando obrigatórias e ausentes)
// ---------------------------------------------------------------------------
export function avaliarLicencas(
  candidato: Candidato,
  vaga: VagaNormalizada,
): { dimensao: DimensaoCompatibilidade; impeditivo?: string } {
  const chave = 'licencas'
  const nome = 'Licenças profissionais'
  const peso = pesosCompatibilidade.licencas

  const requisitos: RequisitoVaga[] = [...vaga.requisitosObrigatorios, ...vaga.requisitosDesejaveis].filter(
    (r) => r.tipo === 'licenca',
  )
  if (requisitos.length === 0) {
    return { dimensao: naoAvaliada(chave, nome, peso, 'A vaga não exige licença profissional específica.') }
  }

  const textosCandidato = [
    ...candidato.certificados.map((c) => normalizarTexto(c.titulo)),
    ...candidato.escolaridades.map((e) => normalizarTexto(`${e.curso} ${e.nivel}`)),
  ]

  const atendidos = requisitos.filter((r) => textosCandidato.some((texto) => textoContem(texto, r.nome))).map((r) => r.nome)
  const ausentes = requisitos.filter((r) => !atendidos.includes(r.nome))

  const impeditivoRequisito = ausentes.find((r) => r.obrigatorio)

  return {
    dimensao: {
      ...baseDimensao(chave, nome, peso),
      avaliada: true,
      confianca: 0.6,
      nota: Math.round((atendidos.length / requisitos.length) * 10),
      justificativa:
        ausentes.length === 0
          ? 'Você atende às licenças exigidas.'
          : `Licença(s) não identificada(s) no seu perfil: ${ausentes.map((r) => r.nome).join(', ')}.`,
      requisitosAtendidos: atendidos,
      requisitosAusentes: ausentes.map((r) => r.nome),
    },
    impeditivo: impeditivoRequisito ? `Licença obrigatória "${impeditivoRequisito.nome}" não identificada no seu perfil.` : undefined,
  }
}

// ---------------------------------------------------------------------------
// 12. Localização
// ---------------------------------------------------------------------------
export function avaliarLocalizacao(
  candidato: Candidato,
  vaga: VagaNormalizada,
): { dimensao: DimensaoCompatibilidade; impeditivo?: string } {
  const chave = 'localizacao'
  const nome = 'Localização'
  const peso = pesosCompatibilidade.localizacao

  if (!vaga.modalidadeInformada) {
    return { dimensao: naoAvaliada(chave, nome, peso, 'A modalidade da vaga não foi informada, então a localização não pôde ser avaliada com segurança.') }
  }

  if (vaga.modalidade === 'Remoto') {
    const restricoes = vaga.localizacao.aceitaCandidatosDe
    if (!restricoes || restricoes.length === 0) {
      return {
        dimensao: {
          ...baseDimensao(chave, nome, peso),
          avaliada: true,
          confianca: 0.6,
          nota: 8,
          justificativa: 'Vaga remota sem restrição geográfica informada; considerada compatível, com ressalva.',
        },
      }
    }
    const aceita = restricoes.some(
      (regiao) => textoContem(normalizarTexto(candidato.estado), regiao) || textoContem(normalizarTexto('Brasil'), regiao),
    )
    return {
      dimensao: {
        ...baseDimensao(chave, nome, peso),
        avaliada: true,
        confianca: 0.85,
        nota: aceita ? 10 : 0,
        justificativa: aceita
          ? 'Vaga remota aceita candidatos da sua localização.'
          : 'Vaga remota restrita a outra região/país; não compatível com sua localização.',
      },
      impeditivo: aceita ? undefined : 'Vaga remota restrita a região/país diferente do seu.',
    }
  }

  // presencial ou híbrido: exige cidade/estado
  if (!vaga.localizacao.cidade && !vaga.localizacao.estado) {
    return { dimensao: naoAvaliada(chave, nome, peso, 'A vaga não informou cidade/estado para avaliar compatibilidade geográfica.') }
  }

  const cidadeBase = candidato.cidade
  const estadoBase = candidato.estado
  const mesmoEstado = normalizarTexto(estadoBase) === normalizarTexto(vaga.localizacao.estado ?? '')
  const mesmaCidade = normalizarTexto(cidadeBase) === normalizarTexto(vaga.localizacao.cidade ?? '')

  const nota = mesmaCidade ? 10 : mesmoEstado ? 5 : 0
  return {
    dimensao: {
      ...baseDimensao(chave, nome, peso),
      avaliada: true,
      confianca: 0.9,
      nota,
      justificativa: mesmaCidade
        ? 'Vaga na sua cidade.'
        : mesmoEstado
          ? 'Vaga no seu estado, mas em outra cidade; avalie o deslocamento.'
          : `Vaga presencial/híbrida em ${vaga.localizacao.cidade ?? vaga.localizacao.estado}, fora da sua localização.`,
    },
    impeditivo: nota === 0 && vaga.modalidade === 'Presencial' ? 'Localização presencial incompatível com sua cidade/estado.' : undefined,
  }
}

// ---------------------------------------------------------------------------
// 13. Modalidade (preferência do candidato)
// ---------------------------------------------------------------------------
export function avaliarModalidade(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const chave = 'modalidade'
  const nome = 'Modalidade'
  const peso = pesosCompatibilidade.modalidade

  if (!vaga.modalidadeInformada || !vaga.modalidade) {
    return naoAvaliada(chave, nome, peso, 'A empresa não informou a modalidade de trabalho.')
  }

  const objetivo = candidato.objetivoProfissional
  const modalidadesObjetivo = objetivo?.modo === 'definido' ? objetivo.opcoes[0]?.modalidadesAceitas : undefined
  const preferidas = modalidadesObjetivo?.length
    ? modalidadesObjetivo
    : candidato.modalidadesPreferidas?.length
      ? candidato.modalidadesPreferidas
      : undefined
  if (!preferidas) {
    return naoAvaliada(chave, nome, peso, 'Você ainda não informou preferência de modalidade no seu perfil.')
  }

  const atende = preferidas.includes(vaga.modalidade)
  return {
    ...baseDimensao(chave, nome, peso),
    avaliada: true,
    confianca: 0.9,
    nota: atende ? 10 : 2,
    justificativa: atende
      ? `Modalidade "${vaga.modalidade}" está entre suas preferências.`
      : `Modalidade "${vaga.modalidade}" não está entre suas preferências informadas.`,
  }
}

// ---------------------------------------------------------------------------
// 14. Tipo de contrato; sem preferência coletada no formulário ainda
// ---------------------------------------------------------------------------
export function avaliarTipoContrato(candidato: Candidato, vaga: VagaNormalizada): DimensaoCompatibilidade {
  const objetivo = candidato.objetivoProfissional
  const preferidos = objetivo?.modo === 'definido' ? contratosEfetivosDaOpcao(objetivo.opcoes[0]) : []
  if (!vaga.tipoContrato || preferidos.length === 0 || preferidos.includes('Indiferente')) {
    return naoAvaliada(
      'tipo_contrato',
      'Tipo de contrato',
      pesosCompatibilidade.tipoContrato,
      'Tipo de contrato não informado pela vaga ou marcado como indiferente no objetivo.',
    )
  }
  const atende = preferidos.includes(vaga.tipoContrato as TipoContratoVaga)
  return {
    ...baseDimensao('tipo_contrato', 'Tipo de contrato', pesosCompatibilidade.tipoContrato),
    avaliada: true,
    confianca: 0.8,
    nota: atende ? 10 : 3,
    justificativa: atende
      ? `Tipo de contrato "${vaga.tipoContrato}" está entre os aceitos.`
      : `Tipo de contrato "${vaga.tipoContrato}" não está entre os preferidos.`,
    requisitosAtendidos: atende ? [vaga.tipoContrato] : [],
    requisitosParciais: atende ? [] : [vaga.tipoContrato],
  }
}

// ---------------------------------------------------------------------------
// 15. Faixa salarial; preparado, sem preferência coletada no formulário ainda
// ---------------------------------------------------------------------------
export function avaliarFaixaSalarial(): DimensaoCompatibilidade {
  return naoAvaliada(
    'faixa_salarial',
    'Faixa salarial',
    pesosCompatibilidade.faixaSalarial,
    'O formulário ainda não coleta pretensão salarial.',
  )
}
