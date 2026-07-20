export interface RecursoEstudo {
  competencia: string
  descricao: string
  url: string
}

const dicionarioRecursos: Record<string, { descricao: string; url: string }> = {
  'react': { descricao: 'Documentação oficial, com tutorial interativo passo a passo.', url: 'https://react.dev/learn' },
  'typescript': { descricao: 'Handbook oficial, direto ao ponto para quem já sabe JavaScript.', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  'javascript': { descricao: 'Guia gratuito e completo, do básico ao avançado.', url: 'https://javascript.info/' },
  'node.js': { descricao: 'Roteiro estruturado de aprendizado, gratuito.', url: 'https://roadmap.sh/nodejs' },
  'sql': { descricao: 'Exercícios interativos de SQL direto no navegador.', url: 'https://sqlbolt.com/' },
  'git': { descricao: 'Guia visual e interativo para entender comandos e fluxo.', url: 'https://learngitbranching.js.org/' },
  'testes automatizados': { descricao: 'Documentação do Vitest, o padrão atual para testes em projetos React/Vite.', url: 'https://vitest.dev/guide/' },
  'apis rest': { descricao: 'Guia prático sobre consumo e design de APIs REST.', url: 'https://roadmap.sh/backend' },
  'cloud (aws/azure/gcp)': { descricao: 'Trilha gratuita de fundamentos de nuvem.', url: 'https://aws.amazon.com/pt/training/digital/aws-cloud-practitioner-essentials/' },
  'excel avançado': { descricao: 'Cursos gratuitos de Excel do básico ao avançado.', url: 'https://support.microsoft.com/pt-br/excel' },
  'power bi': { descricao: 'Trilha oficial de aprendizado da Microsoft.', url: 'https://learn.microsoft.com/pt-br/training/powerplatform/power-bi' },
  'gestão de projetos': { descricao: 'Fundamentos gratuitos de gestão ágil de projetos.', url: 'https://www.atlassian.com/agile' },
  'autocad': { descricao: 'Tutoriais oficiais Autodesk para iniciantes.', url: 'https://www.autodesk.com/certification/learn' },
  'crm': { descricao: 'Trilha gratuita de fundamentos de atendimento e CRM.', url: 'https://trailhead.salesforce.com/' },
}

function normalizar(valor: string): string {
  return valor.trim().toLowerCase()
}

export function obterRecursosEstudo(competencias: string[]): RecursoEstudo[] {
  return competencias.map((competencia) => {
    const chave = normalizar(competencia)
    const encontrado = dicionarioRecursos[chave]
    if (encontrado) {
      return { competencia, ...encontrado }
    }
    return {
      competencia,
      descricao: 'Roteiro de estudo estruturado e gratuito para começar do zero.',
      url: `https://roadmap.sh/search?q=${encodeURIComponent(competencia)}`,
    }
  })
}
