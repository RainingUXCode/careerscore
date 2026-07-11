// Enums derivados do diagrama de classes e dos requisitos funcionais.
// Não alterar os valores sem revisar a documentação original.

export enum NomeArea {
  SAUDE = 'Saúde',
  TECNOLOGIA_DADOS = 'Tecnologia e Dados',
  GESTAO_NEGOCIOS = 'Gestão e Negócios',
  ENGENHARIA = 'Engenharia',
  COMERCIO_ATENDIMENTO = 'Comércio e Atendimento',
  OUTRO = 'Outro',
}

export enum TipoLink {
  LINKEDIN = 'LinkedIn',
  GITHUB = 'GitHub',
  PORTFOLIO = 'Portfólio',
  BEHANCE = 'Behance',
  DRIBBBLE = 'Dribbble',
  OUTRO = 'Outro',
}

export enum StatusCurso {
  CONCLUIDO = 'Concluído',
  CURSANDO = 'Cursando',
  TRANCADO = 'Trancado',
  NAO_CONCLUIDO = 'Não concluído',
}

export enum TipoCompetencia {
  TECNICA = 'Técnica',
  COMPORTAMENTAL = 'Comportamental',
}

export enum NivelProficiencia {
  BASICO = 'Básico',
  INTERMEDIARIO = 'Intermediário',
  AVANCADO = 'Avançado',
  FLUENTE = 'Fluente',
  NATIVO = 'Nativo',
}

export enum Modalidade {
  REMOTO = 'Remoto',
  HIBRIDO = 'Híbrido',
  PRESENCIAL = 'Presencial',
}

export enum ChanceEntrevista {
  MUITO_ALTA = 'Muito Alta',
  ALTA = 'Alta',
  MEDIA = 'Média',
  BAIXA = 'Baixa',
}

export enum NivelExperiencia {
  ESTAGIARIO = 'Estagiário',
  JUNIOR = 'Júnior',
  PLENO = 'Pleno',
  SENIOR = 'Sênior',
  ESPECIALISTA = 'Especialista',
}

export enum FormatoCurriculo {
  PDF = 'PDF',
  DOCX = 'DOCX',
}
