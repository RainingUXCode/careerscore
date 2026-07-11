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

  /** Valida a seção 1 (Dados pessoais) */
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
