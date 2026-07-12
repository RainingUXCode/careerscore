export type ChaveFaixaCompatibilidade = 'agora' | 'tentar' | 'entrada' | 'preparo'

export interface FaixaCompatibilidade {
  chave: ChaveFaixaCompatibilidade
  min: number
  max: number
  tituloReal: string
  tituloDemo: string
  descricaoReal: string
  descricaoDemo: string
  tone: 'high' | 'primary' | 'mid' | 'low'
}

/**
 * Quatro faixas de compatibilidade — nenhuma é promessa de contratação, só
 * uma leitura de aderência. Cobrem 0-100% sem sobreposição nem lacuna.
 */
export const faixasCompatibilidade: FaixaCompatibilidade[] = [
  {
    chave: 'agora',
    min: 80,
    max: Infinity,
    tituloReal: 'Boa oportunidade agora',
    tituloDemo: 'Alta aderência em demonstração',
    descricaoReal: 'Vagas reais recentes, dentro da sua modalidade e com alta aderência ao seu perfil.',
    descricaoDemo: 'Exemplos usados para validar a compatibilidade. Não são oportunidades para candidatura real.',
    tone: 'high',
  },
  {
    chave: 'tentar',
    min: 60,
    max: 79,
    tituloReal: 'Vale a pena tentar',
    tituloDemo: 'Vale a pena tentar (demonstração)',
    descricaoReal: 'Boa aderência — vale reforçar algum requisito antes ou se candidatar mesmo assim.',
    descricaoDemo: 'Exemplo de demonstração nesta faixa de aderência.',
    tone: 'primary',
  },
  {
    chave: 'entrada',
    min: 40,
    max: 59,
    tituloReal: 'Pode ser uma porta de entrada',
    tituloDemo: 'Pode ser uma porta de entrada (demonstração)',
    descricaoReal: 'Aderência parcial — pode valer a candidatura como forma de ganhar experiência ou entrar na área.',
    descricaoDemo: 'Exemplo de demonstração nesta faixa de aderência.',
    tone: 'mid',
  },
  {
    chave: 'preparo',
    min: 0,
    max: 39,
    tituloReal: 'Ainda exige preparação',
    tituloDemo: 'Ainda exige preparação (demonstração)',
    descricaoReal: 'Aderência baixa hoje — útil para mapear o que desenvolver, não como prioridade de candidatura.',
    descricaoDemo: 'Exemplo de demonstração nesta faixa de aderência.',
    tone: 'low',
  },
]

/** Classifica um percentual de compatibilidade (0-100) em uma das quatro faixas. */
export function classificarFaixa(percentual: number): ChaveFaixaCompatibilidade {
  const faixa = faixasCompatibilidade.find((item) => percentual >= item.min && percentual <= item.max)
  return faixa?.chave ?? 'preparo'
}
