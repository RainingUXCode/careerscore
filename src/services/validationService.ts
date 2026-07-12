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
    if (!arquivo) return 'Anexe seu curriculo em PDF ou DOCX.'
    const nome = arquivo.name.toLowerCase()
    const extensaoValida = nome.endsWith('.pdf') || nome.endsWith('.docx')
    if (!extensaoValida) return 'Formato invalido. Envie um arquivo PDF ou DOCX.'
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
      erros.email = 'Informe um e-mail valido.'
    }
    if (!dados.telefone?.trim()) {
      erros.telefone = 'Informe seu telefone.'
    } else if (!this.validarTelefone(dados.telefone)) {
      erros.telefone = 'Informe um telefone valido com DDD.'
    }
    if (!dados.cidade?.trim()) erros.cidade = 'Informe sua cidade.'
    if (!dados.estado?.trim()) erros.estado = 'Informe seu estado.'
    if (!dados.nivelExperiencia) erros.nivelExperiencia = 'Selecione seu nivel de experiencia.'
    return erros
  },

  validarAreaInteresse(dados: Partial<Candidato>): ErrosValidacao {
    const erros: ErrosValidacao = {}
    if (!dados.areaInteresse?.nome) erros.areaInteresse = 'Selecione uma area de interesse.'
    if (
      dados.areaInteresse?.nome === 'Outro' &&
      !dados.areaInteresse?.nomePersonalizado?.trim()
    ) {
      erros.areaInteressePersonalizada = 'Descreva sua area de interesse.'
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
      if (!objetivo.cargoDesejado?.trim()) erros.cargoDesejado = 'Informe o cargo que voce quer buscar agora.'
      if (!objetivo.nivelAlvo) erros.nivelAlvo = 'Selecione o nivel alvo.'
      if (!objetivo.modalidadesAceitas?.length) erros.modalidadesAceitas = 'Selecione pelo menos uma modalidade.'
      if (!objetivo.tiposContratoAceitos?.length) erros.tiposContratoAceitos = 'Selecione pelo menos um tipo de contrato.'
      if (!objetivo.paisBusca?.trim()) erros.paisBusca = 'Informe o pais de busca.'
    }

    if (objetivo.modo === 'multiplas_opcoes') {
      const opcoes = objetivo.opcoes ?? []
      if (opcoes.length === 0) erros.opcoes = 'Informe pelo menos uma opcao de cargo ou area.'
      if (opcoes.length > 3) erros.opcoes = 'Informe no maximo 3 opcoes.'
      if (opcoes.length > 0 && !opcoes.some((opcao) => opcao.principal)) {
        erros.opcaoPrincipal = 'Marque uma opcao como principal.'
      }
      opcoes.forEach((opcao, indice) => {
        if (!opcao.cargoOuArea?.trim()) erros[`opcao_${indice}`] = 'Informe o cargo ou area desta opcao.'
      })
    }

    if (objetivo.modo === 'exploracao') {
      const preferencias = objetivo.preferenciasExploracao
      const sinaisExploracao =
        (preferencias?.atividadesPreferidas.length ?? 0) +
        (preferencias?.prefereTrabalharCom.length ?? 0) +
        (preferencias?.interesses.length ?? 0) +
        (dados.competencias?.length ?? 0) +
        (dados.escolaridades?.length ?? 0) +
        (dados.experiencias?.length ?? 0) +
        (dados.certificados?.length ?? 0)
      if (sinaisExploracao === 0) {
        erros.preferenciasExploracao = 'Conte ao menos alguns interesses, atividades ou competencias para orientar a exploracao.'
      }
    }
    return erros
  },

  validarLinks(links: Candidato['links']): ErrosValidacao {
    const erros: ErrosValidacao = {}
    links.forEach((link, i) => {
      if (link.url && !this.validarUrl(link.url)) {
        erros[`link_${i}`] = 'URL invalida. Use o formato https://...'
      }
    })
    return erros
  },
}
