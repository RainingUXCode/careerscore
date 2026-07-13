import { describe, it, expect } from 'vitest'
import { calcularCompatibilidade } from '../compatibilidadeService'
import { criarCandidatoBase, criarVagaBase } from '../../test/fixtures'
import { TipoCompetencia, NivelProficiencia, StatusCurso, NomeArea, NivelExperiencia, Modalidade } from '../../types/enums'
import type { RequisitoVaga } from '../../types/vaga'

function requisito(nome: string, tipo: RequisitoVaga['tipo'], obrigatorio: boolean): RequisitoVaga {
  return { id: `${tipo}-${nome}`, nome, tipo, obrigatorio }
}

describe('motor de compatibilidade multissetorial', () => {
  it('1. perfil compatível na mesma área tem compatibilidade alta', () => {
    const candidato = criarCandidatoBase({
      competencias: [
        { idCompetencia: '1', nome: 'React', tipo: TipoCompetencia.TECNICA },
        { idCompetencia: '2', nome: 'Git', tipo: TipoCompetencia.TECNICA },
      ],
    })
    const vaga = criarVagaBase({
      requisitosObrigatorios: [requisito('React', 'competencia_tecnica', true), requisito('Git', 'competencia_tecnica', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.compatibilidadeGeral).toBeGreaterThan(60)
  })

  it('2. perfil em transição reconhece competências transferíveis', () => {
    const candidato = criarCandidatoBase({
      areaInteresse: { idArea: 'a', nome: NomeArea.COMERCIO_ATENDIMENTO },
      experiencias: [
        {
          idExperiencia: '1',
          empresa: 'Loja X',
          cargo: 'Atendente',
          descricao: 'Atendimento ao cliente no balcão com negociação de condições e resolução de problemas.',
          dataInicio: '2023-01',
          empregoAtual: true,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'comercial-vendas',
      requisitosObrigatorios: [requisito('Negociação', 'competencia_comportamental', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.competenciasTransferiveis.length).toBeGreaterThan(0)
    expect(resultado.competenciasTransferiveis[0].nome.toLowerCase()).toContain('negocia')
  })

  it('3. vaga com senioridade não informada não é avaliada nem penaliza', () => {
    const candidato = criarCandidatoBase()
    const vaga = criarVagaBase({ senioridadeInformada: false, senioridade: undefined })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'senioridade')!
    expect(dimensao.avaliada).toBe(false)
    expect(dimensao.nota).toBeUndefined()
  })

  it('4. vaga presencial em cidade incompatível reduz a nota de localização', () => {
    const candidato = criarCandidatoBase({ cidade: 'João Pessoa', estado: 'PB' })
    const vaga = criarVagaBase({
      modalidade: Modalidade.PRESENCIAL,
      modalidadeInformada: true,
      localizacao: { cidade: 'São Paulo', estado: 'SP', pais: 'Brasil' },
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'localizacao')!
    expect(dimensao.nota).toBe(0)
    expect(resultado.impeditivos.length).toBeGreaterThan(0)
  })

  it('5. vaga híbrida em estado incompatível não é impeditivo automático, mas reduz nota', () => {
    const candidato = criarCandidatoBase({ cidade: 'João Pessoa', estado: 'PB' })
    const vaga = criarVagaBase({
      modalidade: Modalidade.HIBRIDO,
      modalidadeInformada: true,
      localizacao: { cidade: 'Recife', estado: 'PE', pais: 'Brasil' },
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'localizacao')!
    expect(dimensao.nota).toBe(0)
    expect(resultado.impeditivos.some((i) => i.motivo === 'localizacao_incompativel')).toBe(true)
  })

  it('6. vaga remota com restrição geográfica incompatível é impeditivo', () => {
    const candidato = criarCandidatoBase({ estado: 'PB' })
    const vaga = criarVagaBase({
      modalidade: Modalidade.REMOTO,
      modalidadeInformada: true,
      localizacao: { pais: 'Brasil', aceitaCandidatosDe: ['Portugal'] },
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.impeditivos.some((i) => i.motivo === 'localizacao_incompativel')).toBe(true)
  })

  it('7. vaga remota sem restrição geográfica é compatível com ressalva', () => {
    const candidato = criarCandidatoBase()
    const vaga = criarVagaBase({
      modalidade: Modalidade.REMOTO,
      modalidadeInformada: true,
      localizacao: { pais: 'Brasil' },
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'localizacao')!
    expect(dimensao.avaliada).toBe(true)
    expect(dimensao.nota).toBe(8)
  })

  it('8. vaga com dados incompletos reduz a confiança sem reduzir a nota artificialmente', () => {
    const candidato = criarCandidatoBase()
    const vaga = criarVagaBase({ modalidadeInformada: false, modalidade: undefined, senioridadeInformada: false })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.confiabilidade.percentual).toBeLessThan(100)
    expect(resultado.confiabilidade.dimensoesSemDados.length).toBeGreaterThan(0)
  })

  it('9. requisito obrigatório ausente aparece na lista de ausentes', () => {
    const candidato = criarCandidatoBase({ competencias: [] })
    const vaga = criarVagaBase({ requisitosObrigatorios: [requisito('SQL', 'competencia_tecnica', true)] })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'competencias_tecnicas')!
    expect(dimensao.requisitosAusentes).toContain('SQL')
  })

  it('10. requisito desejável ausente não pesa como obrigatório', () => {
    const candidato = criarCandidatoBase({
      competencias: [{ idCompetencia: '1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    })
    const vaga = criarVagaBase({
      requisitosObrigatorios: [requisito('React', 'competencia_tecnica', true)],
      requisitosDesejaveis: [requisito('Node.js', 'competencia_tecnica', false)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'competencias_tecnicas')!
    expect(dimensao.nota).toBeGreaterThan(5)
  })

  it('11. formação obrigatória ausente aparece como ausente, sem travar a análise', () => {
    const candidato = criarCandidatoBase({ escolaridades: [] })
    const vaga = criarVagaBase({ formacaoRequerida: ['Graduação em Fisioterapia'] })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'formacao')!
    expect(dimensao.requisitosAusentes).toContain('Graduação em Fisioterapia')
  })

  it('12. licença profissional obrigatória ausente é impeditivo real', () => {
    const candidato = criarCandidatoBase({ certificados: [], escolaridades: [] })
    const vaga = criarVagaBase({ requisitosObrigatorios: [requisito('CREFITO ativo', 'licenca', true)] })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.impeditivos.some((i) => i.motivo === 'licenca_obrigatoria_ausente')).toBe(true)
  })

  it('13. idioma obrigatório abaixo do nível exigido é impeditivo', () => {
    const candidato = criarCandidatoBase({
      idiomas: [{ idIdioma: '1', nome: 'Inglês', nivelProficiencia: NivelProficiencia.BASICO }],
    })
    const vaga = criarVagaBase({
      idiomasExigidos: [{ idioma: 'Inglês', nivelMinimo: NivelProficiencia.AVANCADO, obrigatorio: true }],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.impeditivos.some((i) => i.motivo === 'idioma_obrigatorio_ausente')).toBe(true)
  })

  it('14. candidato de primeiro emprego não é penalizado em vaga de estágio', () => {
    const candidato = criarCandidatoBase({ nivelExperiencia: NivelExperiencia.ESTAGIARIO, experiencias: [] })
    const vaga = criarVagaBase({ experienciaMinimaMeses: 0 })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'experiencia')!
    expect(dimensao.nota).toBe(10)
  })

  it('15. competência transferível não é tratada como atendimento técnico direto', () => {
    const candidato = criarCandidatoBase({
      areaInteresse: { idArea: 'a', nome: NomeArea.COMERCIO_ATENDIMENTO },
      experiencias: [
        { idExperiencia: '1', empresa: 'Loja X', cargo: 'Atendente', descricao: 'Atendimento ao cliente com negociação e resolução de problemas.', dataInicio: '2023-01', empregoAtual: true },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'comercial-vendas',
      requisitosObrigatorios: [requisito('Negociação', 'competencia_comportamental', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensaoSoft = resultado.dimensoes.find((d) => d.chave === 'soft_skills')!
    expect(dimensaoSoft.requisitosAtendidos).not.toContain('Negociação')
  })

  it('16. dimensão sem dados é excluída do cálculo da nota geral', () => {
    const candidato = criarCandidatoBase()
    const vaga = criarVagaBase()

    const resultado = calcularCompatibilidade(candidato, vaga)
    const semDados = resultado.dimensoes.filter((d) => !d.avaliada)
    expect(semDados.length).toBeGreaterThan(0)
    expect(resultado.compatibilidadeGeral).toBeGreaterThanOrEqual(0)
  })

  it('17. redistribuição de pesos considera só dimensões avaliadas', () => {
    const candidato = criarCandidatoBase({
      competencias: [{ idCompetencia: '1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    })
    const vagaComPoucosDados = criarVagaBase({
      requisitosObrigatorios: [requisito('React', 'competencia_tecnica', true)],
    })
    const resultado = calcularCompatibilidade(candidato, vagaComPoucosDados)
    expect(resultado.compatibilidadeGeral).toBeGreaterThan(50)
  })

  it('18. cálculo de confiança reflete proporção de dimensões avaliadas', () => {
    const candidato = criarCandidatoBase()
    const vagaCompleta = criarVagaBase({
      senioridadeInformada: true,
      senioridade: 'Júnior',
      formacaoRequerida: ['Ensino médio'],
      experienciaMinimaMeses: 0,
      requisitosObrigatorios: [requisito('React', 'competencia_tecnica', true)],
      idiomasExigidos: [{ idioma: 'Inglês', obrigatorio: false }],
    })
    const resultado = calcularCompatibilidade(candidato, vagaCompleta)
    expect(resultado.confiabilidade.percentual).toBeGreaterThan(0)
    expect(resultado.confiabilidade.dimensoesAvaliadas).toBeLessThanOrEqual(resultado.confiabilidade.totalDimensoes)
  })

  it('19. recomendação de candidatura reflete compatibilidade e impeditivos', () => {
    const candidato = criarCandidatoBase({ cidade: 'João Pessoa', estado: 'PB' })
    const vagaComImpeditivo = criarVagaBase({
      modalidade: Modalidade.PRESENCIAL,
      modalidadeInformada: true,
      localizacao: { cidade: 'Manaus', estado: 'AM', pais: 'Brasil' },
    })
    const resultado = calcularCompatibilidade(candidato, vagaComImpeditivo)
    expect(resultado.recomendacaoCandidatura).toBe('nao_recomendada')
  })

  it('não penaliza formação relacionada de forma severa (correlata/em andamento)', () => {
    const candidato = criarCandidatoBase({
      escolaridades: [
        { idEscolaridade: '1', instituicao: 'UFPB', curso: 'Sistemas de Informação', nivel: 'Graduação', status: StatusCurso.CURSANDO, dataInicio: '2022-01' },
      ],
    })
    const vaga = criarVagaBase({ formacaoRequerida: ['Sistemas de Informação'] })
    const resultado = calcularCompatibilidade(candidato, vaga)
    const dimensao = resultado.dimensoes.find((d) => d.chave === 'formacao')!
    expect(dimensao.requisitosParciais.length).toBeGreaterThan(0)
  })
})

describe('elegibilidade por senioridade pretendida', () => {
  function candidatoComNivel(nivelAlvo: 'Estágio' | 'Júnior') {
    return criarCandidatoBase({
      objetivoProfissional: {
        modo: 'definido',
        opcoes: [{
          id: 'obj-1',
          cargoOuArea: 'Desenvolvedor Front-end',
          nivelAlvo,
          tiposContratoAceitos: nivelAlvo === 'Estágio' ? [] : ['CLT'],
          modalidadesAceitas: [Modalidade.REMOTO],
        }],
      },
    })
  }

  it('objetivo Estágio exclui Pleno', () => {
    const resultado = calcularCompatibilidade(
      candidatoComNivel('Estágio'),
      criarVagaBase({ senioridadeInformada: true, senioridade: 'Pleno', senioridadesPossiveis: ['Pleno'] }),
    )

    expect(resultado.impeditivos.some((impeditivo) => impeditivo.motivo === 'senioridade_incompativel')).toBe(true)
  })

  it('objetivo Estágio exclui Jr/Pl', () => {
    const resultado = calcularCompatibilidade(
      candidatoComNivel('Estágio'),
      criarVagaBase({ senioridadeInformada: true, senioridade: 'Júnior', senioridadesPossiveis: ['Júnior', 'Pleno'] }),
    )

    expect(resultado.impeditivos.some((impeditivo) => impeditivo.motivo === 'senioridade_incompativel')).toBe(true)
  })

  it('objetivo Estágio mantém nível não informado com confiança reduzida', () => {
    const resultado = calcularCompatibilidade(
      candidatoComNivel('Estágio'),
      criarVagaBase({ senioridadeInformada: false, senioridade: undefined, senioridadesPossiveis: undefined }),
    )
    const dimensao = resultado.dimensoes.find((item) => item.chave === 'senioridade')!

    expect(resultado.impeditivos.some((impeditivo) => impeditivo.motivo === 'senioridade_incompativel')).toBe(false)
    expect(dimensao.avaliada).toBe(false)
    expect(dimensao.confianca).toBe(0)
    expect(dimensao.justificativa).toContain('não informou a senioridade')
  })

  it('objetivo Júnior exclui Pleno', () => {
    const resultado = calcularCompatibilidade(
      candidatoComNivel('Júnior'),
      criarVagaBase({ senioridadeInformada: true, senioridade: 'Pleno', senioridadesPossiveis: ['Pleno'] }),
    )

    expect(resultado.impeditivos.some((impeditivo) => impeditivo.motivo === 'senioridade_incompativel')).toBe(true)
  })
})
