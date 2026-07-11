export interface Plataforma {
  nome: string
  url: string
  nota: string
}

export const plataformasMonitoramento: Plataforma[] = [
  { nome: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', nota: 'Ative alertas de vaga para sua área e ative o modo "Aberto a oportunidades".' },
  { nome: 'Gupy', url: 'https://portal.gupy.io/', nota: 'Concentra processos seletivos de médias e grandes empresas no Brasil.' },
  { nome: 'Programathor', url: 'https://programathor.com.br/', nota: 'Focado em vagas de tecnologia, com boa presença de startups e squads de produto.' },
  { nome: 'Revelo', url: 'https://www.revelo.com.br/', nota: 'Vagas de tecnologia com triagem técnica prévia — bom para quem já tem base sólida.' },
  { nome: 'Glassdoor', url: 'https://www.glassdoor.com.br/', nota: 'Use também para checar avaliações e faixa salarial antes de se candidatar.' },
  { nome: 'Sites de carreira das empresas', url: '', nota: 'Programas de estágio de grandes empresas costumam abrir primeiro no próprio site.' },
]
