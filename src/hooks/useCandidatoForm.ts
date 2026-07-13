import { useEffect, useState } from 'react'
import type {
  Candidato,
  Escolaridade,
  ExperienciaProfissional,
  Competencia,
  Certificado,
  Idioma,
  LinkProfissional,
  Curriculo,
} from '../types/models'
import { NomeArea, TipoLink, TipoCompetencia, NivelProficiencia, StatusCurso, FormatoCurriculo, Modalidade } from '../types/enums'
import { gerarId } from '../utils/id'
import { draftService } from '../services/draftService'
import { objetivoProfissionalPadrao } from '../services/objetivoProfissionalService'
import { proximoTipoLinkDisponivel, substituirLink } from '../services/linksService'
import { separarValoresLista } from '../utils/listas'

function candidatoVazio(): Candidato {
  return {
    idCandidato: gerarId('cand'),
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
    areaInteresse: { idArea: gerarId('area'), nome: NomeArea.TECNOLOGIA_DADOS },
    objetivoProfissional: objetivoProfissionalPadrao,
    modalidadesPreferidas: [Modalidade.REMOTO, Modalidade.HIBRIDO, Modalidade.PRESENCIAL],
    modalidadePreferida: undefined,
    disponibilidadeMudanca: 'prefiro_nao_informar',
    preferenciaVagasPcd: 'prefiro_nao_informar',
    escolaridades: [],
    experiencias: [],
    competencias: [],
    certificados: [],
    idiomas: [],
    links: [],
    curriculo: undefined,
  }
}

export function useCandidatoForm() {
  const [candidato, setCandidato] = useState<Candidato>(() => draftService.carregar(candidatoVazio()))

  useEffect(() => {
    draftService.salvar(candidato)
  }, [candidato])

  function atualizarCampo<K extends keyof Candidato>(campo: K, valor: Candidato[K]) {
    setCandidato((atual) => ({ ...atual, [campo]: valor }))
  }

  function atualizarAreaInteresse(nome: NomeArea, nomePersonalizado?: string) {
    setCandidato((atual) => ({
      ...atual,
      areaInteresse: { ...atual.areaInteresse, nome, nomePersonalizado },
    }))
  }

  // Escolaridade
  function adicionarEscolaridade() {
    const nova: Escolaridade = {
      idEscolaridade: gerarId('esc'),
      instituicao: '',
      curso: '',
      nivel: '',
      tipoFormacao: undefined,
      status: StatusCurso.CURSANDO,
      dataInicio: '',
      dataFim: '',
    }
    setCandidato((atual) => ({ ...atual, escolaridades: [...atual.escolaridades, nova] }))
  }
  function atualizarEscolaridade(id: string, patch: Partial<Escolaridade>) {
    setCandidato((atual) => ({
      ...atual,
      escolaridades: atual.escolaridades.map((e) => (e.idEscolaridade === id ? { ...e, ...patch } : e)),
    }))
  }
  function removerEscolaridade(id: string) {
    setCandidato((atual) => ({
      ...atual,
      escolaridades: atual.escolaridades.filter((e) => e.idEscolaridade !== id),
    }))
  }

  // Experiência
  function adicionarExperiencia() {
    const nova: ExperienciaProfissional = {
      idExperiencia: gerarId('exp'),
      empresa: '',
      cargo: '',
      descricao: '',
      dataInicio: '',
      dataFim: '',
      empregoAtual: false,
    }
    setCandidato((atual) => ({ ...atual, experiencias: [...atual.experiencias, nova] }))
  }
  function atualizarExperiencia(id: string, patch: Partial<ExperienciaProfissional>) {
    setCandidato((atual) => ({
      ...atual,
      experiencias: atual.experiencias.map((e) => (e.idExperiencia === id ? { ...e, ...patch } : e)),
    }))
  }
  function removerExperiencia(id: string) {
    setCandidato((atual) => ({
      ...atual,
      experiencias: atual.experiencias.filter((e) => e.idExperiencia !== id),
    }))
  }

  // Competências
  function adicionarCompetencia(nome: string, tipo: TipoCompetencia) {
    const nomes = separarValoresLista(nome)
    if (nomes.length === 0) return
    setCandidato((atual) => {
      const existentes = new Set(atual.competencias.map((competencia) => `${competencia.tipo}:${competencia.nome.toLowerCase()}`))
      const novas: Competencia[] = nomes
        .filter((item) => !existentes.has(`${tipo}:${item.toLowerCase()}`))
        .map((item) => ({ idCompetencia: gerarId('comp'), nome: item, tipo }))
      return novas.length ? { ...atual, competencias: [...atual.competencias, ...novas] } : atual
    })
  }
  function removerCompetencia(id: string) {
    setCandidato((atual) => ({
      ...atual,
      competencias: atual.competencias.filter((c) => c.idCompetencia !== id),
    }))
  }

  // Certificados
  function adicionarCertificado(titulo = '') {
    const novo: Certificado = {
      idCertificado: gerarId('cert'),
      titulo,
      instituicao: '',
      cargaHoraria: '',
      dataEmissao: '',
    }
    setCandidato((atual) => ({ ...atual, certificados: [...atual.certificados, novo] }))
  }
  function atualizarCertificado(id: string, patch: Partial<Certificado>) {
    setCandidato((atual) => ({
      ...atual,
      certificados: atual.certificados.map((c) => (c.idCertificado === id ? { ...c, ...patch } : c)),
    }))
  }
  function removerCertificado(id: string) {
    setCandidato((atual) => ({
      ...atual,
      certificados: atual.certificados.filter((c) => c.idCertificado !== id),
    }))
  }
  function definirArquivoCertificado(id: string, arquivo: File) {
    atualizarCertificado(id, {
      nomeArquivo: arquivo.name,
      tipoArquivo: arquivo.type || arquivo.name.split('.').pop()?.toUpperCase(),
      arquivo,
    })
  }
  function removerArquivoCertificado(id: string) {
    atualizarCertificado(id, {
      nomeArquivo: undefined,
      tipoArquivo: undefined,
      arquivo: undefined,
    })
  }

  // Idiomas
  function adicionarIdioma(nome = '') {
    const novo: Idioma = { idIdioma: gerarId('idi'), nome, nivelProficiencia: NivelProficiencia.BASICO }
    setCandidato((atual) => ({ ...atual, idiomas: [...atual.idiomas, novo] }))
  }
  function atualizarIdioma(id: string, patch: Partial<Idioma>) {
    setCandidato((atual) => ({
      ...atual,
      idiomas: atual.idiomas.map((i) => (i.idIdioma === id ? { ...i, ...patch } : i)),
    }))
  }
  function removerIdioma(id: string) {
    setCandidato((atual) => ({ ...atual, idiomas: atual.idiomas.filter((i) => i.idIdioma !== id) }))
  }

  // Links
  function adicionarLink() {
    setCandidato((atual) => {
      const tipo = proximoTipoLinkDisponivel(atual.links) ?? TipoLink.OUTRO
      const novo: LinkProfissional = { idLink: gerarId('link'), tipo, url: '' }
      return { ...atual, links: [...atual.links, novo] }
    })
  }
  function atualizarLink(id: string, patch: Partial<LinkProfissional>) {
    setCandidato((atual) => ({
      ...atual,
      links: substituirLink(atual.links, id, patch),
    }))
  }
  function removerLink(id: string) {
    setCandidato((atual) => ({ ...atual, links: atual.links.filter((l) => l.idLink !== id) }))
  }

  // Currículo
  function definirCurriculo(arquivo: File) {
    const formato = arquivo.name.toLowerCase().endsWith('.pdf') ? FormatoCurriculo.PDF : FormatoCurriculo.DOCX
    const curriculo: Curriculo = {
      idCurriculo: gerarId('curr'),
      nomeArquivo: arquivo.name,
      formato,
      dataUpload: new Date().toISOString(),
      arquivo,
    }
    setCandidato((atual) => ({ ...atual, curriculo }))
  }
  function removerCurriculo() {
    setCandidato((atual) => ({ ...atual, curriculo: undefined }))
  }

  function limparRascunho() {
    draftService.limpar()
    setCandidato(candidatoVazio())
  }

  return {
    candidato,
    atualizarCampo,
    atualizarAreaInteresse,
    adicionarEscolaridade,
    atualizarEscolaridade,
    removerEscolaridade,
    adicionarExperiencia,
    atualizarExperiencia,
    removerExperiencia,
    adicionarCompetencia,
    removerCompetencia,
    adicionarCertificado,
    atualizarCertificado,
    removerCertificado,
    definirArquivoCertificado,
    removerArquivoCertificado,
    adicionarIdioma,
    atualizarIdioma,
    removerIdioma,
    adicionarLink,
    atualizarLink,
    removerLink,
    definirCurriculo,
    removerCurriculo,
    limparRascunho,
  }
}

export type UseCandidatoFormReturn = ReturnType<typeof useCandidatoForm>
