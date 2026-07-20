export interface Plataforma {
  nome: string
  url: string
  nota: string
}

/** Plataformas relevantes para qualquer área profissional. */
const plataformasGerais: Plataforma[] = [
  { nome: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', nota: 'Ative alertas de vaga para sua área e ative o modo "Aberto a oportunidades".' },
  { nome: 'Gupy', url: 'https://portal.gupy.io/', nota: 'Concentra processos seletivos de médias e grandes empresas de diversos setores no Brasil.' },
  { nome: 'Catho', url: 'https://www.catho.com.br/', nota: 'Um dos maiores portais de vagas do Brasil, com filtros por área e senioridade.' },
  { nome: 'Vagas.com', url: 'https://www.vagas.com.br/', nota: 'Boa cobertura de vagas administrativas, comerciais e operacionais.' },
  { nome: 'Indeed', url: 'https://www.indeed.com.br/', nota: 'Agrega vagas de várias fontes — bom para uma visão ampla do mercado.' },
  { nome: 'CIEE', url: 'https://www.ciee.org.br/', nota: 'Referência em vagas de estágio no Brasil, em qualquer área.' },
  { nome: 'Sites de carreira das empresas', url: '', nota: 'Programas de estágio e trainee de grandes empresas costumam abrir primeiro no próprio site.' },
]

/** Plataformas específicas de uma área — só mostradas quando aplicável a ela. */
const plataformasPorAreaId: Record<string, Plataforma[]> = {
  tecnologia: [
    { nome: 'Programathor', url: 'https://programathor.com.br/', nota: 'Focado em vagas de tecnologia, com boa presença de startups e squads de produto.' },
    { nome: 'Revelo', url: 'https://www.revelo.com.br/', nota: 'Vagas de tecnologia com triagem técnica prévia — bom para quem já tem base sólida.' },
  ],
  saude: [
    { nome: 'Portal de Empregos em Saúde (CFM/Conselhos)', url: '', nota: 'Conselhos profissionais (CRM, COREN, CREFITO) costumam divulgar vagas em seus portais regionais.' },
  ],
  direito: [
    { nome: 'Empregos Jurídicos', url: '', nota: 'Portais especializados em vagas para advogados e áreas correlatas costumam ter melhor cobertura que os generalistas.' },
  ],
  design: [
    { nome: 'Behance Jobs', url: 'https://www.behance.net/joblist', nota: 'Vagas de design divulgadas junto a portfólios da comunidade.' },
  ],
}

/** Retorna as plataformas gerais + as específicas da área do candidato, quando aplicável. */
export function obterPlataformasRecomendadas(areaId?: string): Plataforma[] {
  const especificas = areaId ? (plataformasPorAreaId[areaId] ?? []) : []
  return [...especificas, ...plataformasGerais]
}
