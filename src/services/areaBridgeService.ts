import type { Candidato } from '../types/models'
import type { AreaProfissional } from '../types/area'
import { NomeArea } from '../types/enums'
import { obterAreaPorId } from '../data/areasProfissionais'
import { encontrarAreaPorTexto } from './areaMatchService'

/**
 * Ponte entre o modelo de área do candidato (NomeArea, enum fechado usado
 * pelo formulário e pelo módulo de currículo — intencionalmente intocado) e
 * o novo catálogo de áreas profissionais usado pelo motor de vagas.
 *
 * Isso evita ter que migrar Candidato/currículo para a nova taxonomia agora:
 * o lado do candidato continua simples (um enum de 5 opções + "Outro" com
 * texto livre), e é este serviço que traduz isso para o catálogo mais rico.
 */
const mapaNomeAreaParaId: Record<string, string> = {
  [NomeArea.TECNOLOGIA_DADOS]: 'tecnologia',
  [NomeArea.SAUDE]: 'saude',
  [NomeArea.GESTAO_NEGOCIOS]: 'administracao',
  [NomeArea.ENGENHARIA]: 'engenharia',
  [NomeArea.COMERCIO_ATENDIMENTO]: 'atendimento',
}

export function resolverAreaDoCandidato(candidato: Candidato): AreaProfissional | undefined {
  const { nome, nomePersonalizado } = candidato.areaInteresse
  const objetivo = candidato.objetivoProfissional
  const cargoObjetivo = objetivo?.modo === 'definido' ? (objetivo.opcoes[0]?.cargoOuArea ?? '') : ''
  if (/\brh\b|recursos humanos|departamento pessoal/i.test(cargoObjetivo)) {
    return obterAreaPorId('recursos-humanos')
  }
  const areaDoObjetivo = cargoObjetivo
    ? encontrarAreaPorTexto(cargoObjetivo)
    : undefined
  if (areaDoObjetivo) return areaDoObjetivo

  if (nome === NomeArea.OUTRO) {
    return nomePersonalizado ? encontrarAreaPorTexto(nomePersonalizado) : undefined
  }

  const id = mapaNomeAreaParaId[nome]
  return id ? obterAreaPorId(id) : undefined
}
