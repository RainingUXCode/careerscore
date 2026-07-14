import { NomeArea } from '../types/enums'

// Competências técnicas mais demandadas por área, usadas para identificar
// "competências faltantes" na análise simulada.
export const competenciasReferenciaPorArea: Record<string, string[]> = {
  [NomeArea.TECNOLOGIA_DADOS]: [
    'JavaScript',
    'TypeScript',
    'React',
    'Git',
    'SQL',
    'APIs REST',
    'Testes automatizados',
    'Cloud (AWS/Azure/GCP)',
  ],
  [NomeArea.SAUDE]: [
    'Atendimento ao paciente',
    'Prontuário eletrônico',
    'Protocolos de segurança',
    'Trabalho em equipe multidisciplinar',
  ],
  [NomeArea.GESTAO_NEGOCIOS]: [
    'Excel avançado',
    'Power BI',
    'Gestão de projetos',
    'Análise de dados',
    'Comunicação executiva',
  ],
  [NomeArea.ENGENHARIA]: [
    'AutoCAD',
    'Gestão de obras',
    'Normas técnicas',
    'Segurança do trabalho',
  ],
  [NomeArea.COMERCIO_ATENDIMENTO]: [
    'CRM',
    'Técnicas de negociação',
    'Atendimento multicanal',
    'Resolução de conflitos',
  ],
  [NomeArea.OUTRO]: ['Comunicação', 'Organização', 'Resolução de problemas'],
}
