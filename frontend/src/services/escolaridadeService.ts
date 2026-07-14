import type { Escolaridade, TipoFormacao } from '../types/models'
import { StatusCurso } from '../types/enums'
import { normalizarTexto } from '../utils/texto'

export type MaiorNivelEscolaridade =
  | 'fundamental_em_andamento'
  | 'fundamental_completo'
  | 'medio_em_andamento'
  | 'medio_completo'
  | 'tecnico_em_andamento'
  | 'tecnico_completo'
  | 'superior_em_andamento'
  | 'superior_completo'
  | 'pos_em_andamento'
  | 'pos_completa'
  | 'mestrado_em_andamento'
  | 'mestrado_completo'
  | 'doutorado_em_andamento'
  | 'doutorado_completo'
  | 'nao_informado'

const ordemNivel: Record<MaiorNivelEscolaridade, number> = {
  nao_informado: 0,
  fundamental_em_andamento: 1,
  fundamental_completo: 2,
  medio_em_andamento: 3,
  medio_completo: 4,
  tecnico_em_andamento: 5,
  tecnico_completo: 6,
  superior_em_andamento: 7,
  superior_completo: 8,
  pos_em_andamento: 9,
  pos_completa: 10,
  mestrado_em_andamento: 11,
  mestrado_completo: 12,
  doutorado_em_andamento: 13,
  doutorado_completo: 14,
}

export function inferirTipoFormacao(escolaridade: Pick<Escolaridade, 'tipoFormacao' | 'nivel' | 'curso'>): TipoFormacao | undefined {
  if (escolaridade.tipoFormacao) return escolaridade.tipoFormacao
  const texto = normalizarTexto(`${escolaridade.nivel} ${escolaridade.curso}`)
  if (/doutorado|doutor/.test(texto)) return 'doutorado'
  if (/mestrado|mestre/.test(texto)) return 'mestrado'
  if (/mba/.test(texto)) return 'mba'
  if (/pos|pós|especializacao|especialização/.test(texto)) return 'pos_graduacao'
  if (/tecnologo|tecnólogo/.test(texto)) return 'tecnologo'
  if (/bacharel|graduacao|graduação|superior/.test(texto)) return 'bacharelado'
  if (/licenciatura/.test(texto)) return 'licenciatura'
  if (/tecnico|técnico/.test(texto)) return 'ensino_tecnico'
  if (/medio|médio/.test(texto)) return 'ensino_medio'
  if (/fundamental/.test(texto)) return 'ensino_fundamental'
  return undefined
}

function nivelPorFormacao(tipo: TipoFormacao | undefined, concluida: boolean): MaiorNivelEscolaridade {
  switch (tipo) {
    case 'ensino_fundamental':
      return concluida ? 'fundamental_completo' : 'fundamental_em_andamento'
    case 'ensino_medio':
      return concluida ? 'medio_completo' : 'medio_em_andamento'
    case 'ensino_tecnico':
      return concluida ? 'tecnico_completo' : 'tecnico_em_andamento'
    case 'tecnologo':
    case 'bacharelado':
    case 'licenciatura':
      return concluida ? 'superior_completo' : 'superior_em_andamento'
    case 'pos_graduacao':
    case 'mba':
      return concluida ? 'pos_completa' : 'pos_em_andamento'
    case 'mestrado':
      return concluida ? 'mestrado_completo' : 'mestrado_em_andamento'
    case 'doutorado':
      return concluida ? 'doutorado_completo' : 'doutorado_em_andamento'
    default:
      return 'nao_informado'
  }
}

export function inferirMaiorNivelEscolaridade(escolaridades: Escolaridade[]): MaiorNivelEscolaridade {
  return escolaridades.reduce<MaiorNivelEscolaridade>((maior, escolaridade) => {
    const tipo = inferirTipoFormacao(escolaridade)
    const concluida = escolaridade.status === StatusCurso.CONCLUIDO
    const nivel = nivelPorFormacao(tipo, concluida)
    return ordemNivel[nivel] > ordemNivel[maior] ? nivel : maior
  }, 'nao_informado')
}

export function rotuloMaiorNivelEscolaridade(nivel: MaiorNivelEscolaridade): string {
  const rotulos: Record<MaiorNivelEscolaridade, string> = {
    fundamental_em_andamento: 'Ensino Fundamental em andamento',
    fundamental_completo: 'Ensino Fundamental completo',
    medio_em_andamento: 'Ensino Médio em andamento',
    medio_completo: 'Ensino Médio completo',
    tecnico_em_andamento: 'Ensino Técnico em andamento',
    tecnico_completo: 'Ensino Técnico completo',
    superior_em_andamento: 'Ensino Superior em andamento',
    superior_completo: 'Ensino Superior completo',
    pos_em_andamento: 'Pós-graduação em andamento',
    pos_completa: 'Pós-graduação completa',
    mestrado_em_andamento: 'Mestrado em andamento',
    mestrado_completo: 'Mestrado completo',
    doutorado_em_andamento: 'Doutorado em andamento',
    doutorado_completo: 'Doutorado completo',
    nao_informado: 'Não informado',
  }
  return rotulos[nivel]
}
