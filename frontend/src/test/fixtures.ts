import type { Candidato } from '../types/models'
import type { VagaNormalizada } from '../types/vaga'
import { NomeArea, Modalidade } from '../types/enums'
import { objetivoProfissionalPadrao, normalizarObjetivoProfissional } from '../services/objetivoProfissionalService'

type ObjetivoFixture = Partial<Candidato['objetivoProfissional']> & Record<string, unknown>

type CandidatoFixture = Partial<Omit<Candidato, 'objetivoProfissional'>> & {
  objetivoProfissional?: ObjetivoFixture
}

export function criarCandidatoBase(sobrescreve: CandidatoFixture = {}): Candidato {
  const { objetivoProfissional, ...demaisCampos } = sobrescreve
  return {
    idCandidato: 'cand-1',
    nome: 'Candidato Teste',
    email: 'teste@example.com',
    telefone: '83999999999',
    cidade: 'João Pessoa',
    estado: 'PB',
    areaInteresse: { idArea: 'area-1', nome: NomeArea.TECNOLOGIA_DADOS },
    objetivoProfissional: normalizarObjetivoProfissional(objetivoProfissional ?? objetivoProfissionalPadrao),
    modalidadesPreferidas: [Modalidade.REMOTO],
    escolaridades: [],
    experiencias: [],
    competencias: [],
    certificados: [],
    idiomas: [],
    links: [],
    ...demaisCampos,
  }
}

export function criarVagaBase(sobrescreve: Partial<VagaNormalizada> = {}): VagaNormalizada {
  return {
    id: 'vaga-1',
    idExterno: 'v1',
    fonte: { id: 'mock', nome: 'Vagas de demonstração', tipo: 'demonstracao' },
    titulo: 'Desenvolvedor(a) Front-end Júnior',
    empresa: 'Empresa Teste',
    descricao: 'Descrição de teste.',
    areaId: 'tecnologia',
    senioridadeInformada: false,
    localizacao: { pais: 'Brasil' },
    modalidadeInformada: true,
    modalidade: Modalidade.REMOTO,
    publico: 'geral',
    beneficios: [],
    requisitosObrigatorios: [],
    requisitosDesejaveis: [],
    idiomasExigidos: [],
    consultadaEm: new Date().toISOString(),
    status: 'demonstracao',
    confiabilidadeDados: { nivel: 'media', motivo: 'teste' },
    ...sobrescreve,
  }
}
