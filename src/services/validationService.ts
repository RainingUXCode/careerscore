import type { Candidato } from '../types/models'

export interface ErrosValidacao {
  [campo: string]: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/[^\s]+\.[^\s]+$/

export const validationService = {
  validarEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim())
  },

  validarUrl(url: string): boolean {
    return URL_REGEX.test(url.trim())
  },

  validarTelefone(telefone: string): boolean {
    const digitos = telefone.replace(/\D/g, '')
    return digitos.length >= 10 && digitos.length <= 11
  },

  validarCurriculo(arquivo?: File): string | null {
    if (!arquivo) return 'Anexe seu currículo em PDF ou DOCX.'
    const nome = arquivo.name.toLowerCase()
    const extensaoValida = nome.endsWith('.pdf') || nome.endsWith('.docx')
    if (!extensaoValida) return 'Formato inválido. Envie um arquivo PDF ou DOCX.'
    const tamanhoMaximoMB = 10
    if (arquivo.size > tamanhoMaximoMB * 1024 * 1024) {
      return `O arquivo excede o limite de ${tamanhoMaximoMB}MB.`
    }
    return null
  },

  validarDadosPessoais(dados: Partial<Candidato>): ErrosValidacao {
    const erros: ErrosValidacao = {}
    if (!dados.nome?.trim()) erros.nome = 'Informe seu nome completo.'
    if (!dados.email?.trim()) {
      erros.email = 'Informe seu e-mail.'
    } else if (!this.validarEmail(dados.email)) {
      erros.email = 'Informe um e-mail válido.'
    }
    if (!dados.telefone?.trim()) {
      erros.telefone = 'Informe seu telefone.'
    } else if (!this.validarTelefone(dados.telefone)) {
      erros.telefone = 'Informe um telefone válido com DDD.'
    }
    if (!dados.cidade?.trim()) erros.cidade = 'Informe sua cidade.'
    if (!dados.estado?.trim()) erros.estado = 'Informe seu estado.'
    if (!dados.nivelExperiencia) erros.nivelExperiencia = 'Selecione seu nível de experiência.'
    return erros
  },

  validarAreaInteresse(dados: Partial<Candidato>): ErrosValidacao {
    const erros: ErrosValidacao = {}
    if (!dados.areaInteresse?.nome) erros.areaInteresse = 'Selecione uma área de interesse.'
    if (
      dados.areaInteresse?.nome === 'Outro' &&
      !dados.areaInteresse?.nomePersonalizado?.trim()
    ) {
      erros.areaInteressePersonalizada = 'Descreva sua área de interesse.'
    }
    return erros
  },

  validarObjetivoProfissional(dados: Partial<Candidato>): ErrosValidacao {
    const erros: ErrosValidacao = {}
    const objetivo = dados.objetivoProfissional
    if (!objetivo?.modo) {
      erros.modo = 'Escolha como quer orientar sua busca profissional.'
      return erros
    }

    if (objetivo.modo === 'definido') {
      const opcoes = objetivo.opcoes ?? []
      if (opcoes.length === 0) erros.opcoes = 'Informe pelo menos um objetivo.'
      if (opcoes.length > 3) erros.opcoes = 'Informe no máximo 3 objetivos.'
      opcoes.forEach((opcao, indice) => {
        if (!opcao.cargoOuArea?.trim()) erros[`opcao_${indice}`] = 'Informe o cargo ou área deste objetivo.'
        if (!opcao.modalidadesAceitas?.length) erros[`modalidades_${indice}`] = 'Selecione pelo menos uma modalidade.'
        if (!opcao.tiposContratoAceitos?.length) erros[`contratos_${indice}`] = 'Selecione pelo menos um tipo de contrato.'
      })
    }

    if (objetivo.modo === 'exploracao') {
      const preferencias = objetivo.preferenciasExploracao
      const sinaisExploracao =
        (preferencias?.interesses.length ?? 0) +
        (dados.competencias?.length ?? 0) +
        (dados.escolaridades?.length ?? 0) +
        (dados.experiencias?.length ?? 0) +
        (dados.certificados?.length ?? 0) +
        (dados.idiomas?.length ?? 0)
      if (sinaisExploracao === 0) {
        erros.preferenciasExploracao = 'Conte ao menos alguns interesses ou preencha competências, formação, experiências, certificados ou idiomas.'
      }
    }
    return erros
  },

  validarLinks(links: Candidato['links']): ErrosValidacao {
    const erros: ErrosValidacao = {}
    links.forEach((link, i) => {
      if (link.url && !this.validarUrl(link.url)) {
        erros[`link_${i}`] = 'URL inválida. Use o formato https://...'
      }
    })
    return erros
  },
}
