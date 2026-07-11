import type { Candidato } from '../types/models'
import type { VagaNormalizada } from '../types/vaga'
import { NomeArea, NivelExperiencia, Modalidade } from '../types/enums'

export function criarCandidatoBase(sobrescreve: Partial<Candidato> = {}): Candidato {
  return {
    idCandidato: 'cand-1',
    nome: 'Candidato Teste',
    email: 'teste@example.com',
    telefone: '83999999999',
    cidade: 'João Pessoa',
    estado: 'PB',
    areaInteresse: { idArea: 'area-1', nome: NomeArea.TECNOLOGIA_DADOS },
    modalidadesPreferidas: [Modalidade.REMOTO],
    nivelExperiencia: NivelExperiencia.JUNIOR,
    escolaridades: [],
    experiencias: [],
    competencias: [],
    certificados: [],
    idiomas: [],
    links: [],
    ...sobrescreve,
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
