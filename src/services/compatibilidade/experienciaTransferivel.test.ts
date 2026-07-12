import { describe, expect, it } from 'vitest'
import { calcularCompatibilidade } from '../compatibilidadeService'
import { criarCandidatoBase, criarVagaBase } from '../../test/fixtures'
import { NomeArea, TipoCompetencia } from '../../types/enums'
import type { RequisitoVaga } from '../../types/vaga'

function requisito(nome: string, tipo: RequisitoVaga['tipo'], obrigatorio: boolean): RequisitoVaga {
  return { id: `${tipo}-${nome}`, nome, tipo, obrigatorio }
}

describe('experiencia previa e transicao de carreira', () => {
  it('experiencia anterior na mesma area tem peso maior', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-direta',
          empresa: 'Tech',
          cargo: 'Desenvolvedor',
          descricao: 'Atuacao em desenvolvimento de software com documentacao, analise e trabalho em equipe.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const resultado = calcularCompatibilidade(candidato, criarVagaBase({ areaId: 'tecnologia', experienciaMinimaMeses: 12 }))
    const experiencia = resultado.dimensoes.find((d) => d.chave === 'experiencia')!

    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('direta')
    expect(experiencia.nota).toBe(10)
  })

  it('experiencia anterior em area relacionada tem peso intermediario', () => {
    const candidato = criarCandidatoBase({
      areaInteresse: { idArea: 'area-1', nome: NomeArea.SAUDE },
      experiencias: [
        {
          idExperiencia: 'exp-relacionada',
          empresa: 'Clinica',
          cargo: 'Fisioterapeuta',
          descricao: 'Atendimento a pacientes, analise de evolucao, organizacao de prontuarios e trabalho multidisciplinar.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const resultado = calcularCompatibilidade(candidato, criarVagaBase({ areaId: 'saude', experienciaMinimaMeses: 12 }))
    const experiencia = resultado.dimensoes.find((d) => d.chave === 'experiencia')!

    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('relacionada')
    expect(experiencia.nota).toBe(6)
  })

  it('experiencia em area diferente gera competencias transferiveis com evidencia', () => {
    const candidato = criarCandidatoBase({
      areaInteresse: { idArea: 'area-1', nome: NomeArea.GESTAO_NEGOCIOS },
      experiencias: [
        {
          idExperiencia: 'exp-transferivel',
          empresa: 'Loja',
          cargo: 'Atendente',
          descricao: 'Atendimento ao cliente com comunicacao, empatia, resolucao de problemas e negociacao.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'recursos-humanos',
      requisitosObrigatorios: [requisito('Comunicacao', 'competencia_comportamental', true)],
    })
    const resultado = calcularCompatibilidade(candidato, vaga)

    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('transferivel')
    expect(resultado.competenciasTransferiveis.some((item) => item.nome === 'Comunicação' && item.evidencia)).toBe(true)
  })

  it('experiencia sem descricao suficiente fica com baixa confianca', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-baixa',
          empresa: 'Empresa',
          cargo: 'Assistente',
          descricao: 'Rotina.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const resultado = calcularCompatibilidade(candidato, criarVagaBase({ areaId: 'administracao', experienciaMinimaMeses: 12 }))

    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('sem_evidencia')
    expect(resultado.experienciasAnteriores[0].confianca).toBeLessThan(0.5)
    expect(resultado.experienciasAnteriores[0].competenciasTransferiveis).toEqual([])
  })

  it('competencia transferivel nao vira requisito tecnico atendido', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'definido',
        cargoDesejado: 'Desenvolvedor Front-end',
      },
      competencias: [],
      experiencias: [
        {
          idExperiencia: 'exp-tech-transfer',
          empresa: 'Suporte',
          cargo: 'Atendente',
          descricao: 'Atendimento ao cliente, comunicacao, documentacao e resolucao de problemas.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'tecnologia',
      requisitosObrigatorios: [requisito('Documentacao', 'competencia_tecnica', true)],
    })
    const resultado = calcularCompatibilidade(candidato, vaga)
    const tecnicas = resultado.dimensoes.find((d) => d.chave === 'competencias_tecnicas')!

    expect(tecnicas.requisitosAtendidos).not.toContain('Documentacao')
    expect(resultado.competenciasTransferiveis.some((item) => item.nome === 'Documentação')).toBe(true)
  })

  it('transicao de carreira tem aumento parcial por competencia transferivel', () => {
    const vaga = criarVagaBase({
      areaId: 'recursos-humanos',
      requisitosObrigatorios: [requisito('Comunicacao', 'competencia_comportamental', true)],
    })
    const semEvidencia = calcularCompatibilidade(
      criarCandidatoBase({
        experiencias: [
          {
            idExperiencia: 'exp-sem',
            empresa: 'Loja',
            cargo: 'Atendente',
            descricao: 'Rotina interna sem detalhes suficientes.',
            dataInicio: '2024-01',
            dataFim: '2025-01',
            empregoAtual: false,
          },
        ],
      }),
      vaga,
    )
    const comEvidencia = calcularCompatibilidade(
      criarCandidatoBase({
        experiencias: [
          {
            idExperiencia: 'exp-com',
            empresa: 'Loja',
            cargo: 'Atendente',
            descricao: 'Atendimento ao cliente com comunicacao, empatia e resolucao de problemas.',
            dataInicio: '2024-01',
            dataFim: '2025-01',
            empregoAtual: false,
          },
        ],
      }),
      vaga,
    )

    expect(comEvidencia.compatibilidadeGeral).toBeGreaterThan(semEvidencia.compatibilidadeGeral)
  })

  it('experiencia irrelevante nao recebe peso indevido', () => {
    const candidato = criarCandidatoBase({
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
      experiencias: [
        {
          idExperiencia: 'exp-irrelevante',
          empresa: 'Arquivo',
          cargo: 'Ajudante geral',
          descricao: 'Separacao manual de caixas em arquivo fechado durante rotina repetitiva.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const resultado = calcularCompatibilidade(candidato, criarVagaBase({ areaId: 'tecnologia', experienciaMinimaMeses: 12 }))
    const experiencia = resultado.dimensoes.find((d) => d.chave === 'experiencia')!

    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('transferivel')
    expect(resultado.experienciasAnteriores[0].competenciasTransferiveis).toEqual([])
    expect(experiencia.nota).toBe(0)
  })

  it('mesma competencia presente em multiplas experiencias conta uma unica vez', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-1',
          empresa: 'Loja A',
          cargo: 'Atendente',
          descricao: 'Atendimento ao cliente com comunicacao e resolucao de problemas.',
          dataInicio: '2024-01',
          dataFim: '2024-06',
          empregoAtual: false,
        },
        {
          idExperiencia: 'exp-2',
          empresa: 'Loja B',
          cargo: 'Recepcionista',
          descricao: 'Comunicacao com clientes, suporte e organizacao de demandas.',
          dataInicio: '2024-07',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'recursos-humanos',
      requisitosObrigatorios: [
        requisito('Comunicacao', 'competencia_comportamental', true),
        requisito('Comunicacao', 'competencia_comportamental', true),
      ],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.competenciasTransferiveis.filter((item) => item.nome === 'Comunicação')).toHaveLength(1)
    expect(resultado.dimensoes.find((d) => d.chave === 'competencias_transferiveis')?.nota).toBe(10)
  })

  it('competencia transferivel duplicada nao infla a dimensao', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-duplicada',
          empresa: 'Central',
          cargo: 'Atendente',
          descricao: 'Atendimento ao cliente com comunicacao, comunicar atualizacoes e apresentacao de solucoes.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'recursos-humanos',
      requisitosObrigatorios: [requisito('Comunicacao', 'competencia_comportamental', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.competenciasTransferiveis.filter((item) => item.nome === 'Comunicação')).toHaveLength(1)
  })

  it('mesma experiencia contribuindo para cargo e experiencia nao pontua transferiveis nem soft skills', () => {
    const candidato = criarCandidatoBase({
      objetivoProfissional: {
        modo: 'definido',
        cargoDesejado: 'Desenvolvedor Front-end',
      },
      competencias: [],
      experiencias: [
        {
          idExperiencia: 'exp-cargo',
          empresa: 'Tech',
          cargo: 'Desenvolvedor Front-end',
          descricao: 'Tecnologia e desenvolvimento de software com documentacao, analise e trabalho em equipe.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'tecnologia',
      cargoNormalizado: 'Desenvolvedor Front-end',
      experienciaMinimaMeses: 12,
      requisitosObrigatorios: [requisito('Comunicacao', 'competencia_comportamental', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    const cargo = resultado.dimensoes.find((d) => d.chave === 'cargo')!
    const experiencia = resultado.dimensoes.find((d) => d.chave === 'experiencia')!
    const softSkills = resultado.dimensoes.find((d) => d.chave === 'soft_skills')!
    const transferiveis = resultado.dimensoes.find((d) => d.chave === 'competencias_transferiveis')!

    expect(cargo.nota).toBe(10)
    expect(experiencia.nota).toBe(10)
    expect(softSkills.requisitosAtendidos).toEqual([])
    expect(transferiveis.avaliada).toBe(false)
    expect(resultado.experienciasAnteriores[0].competenciasTransferiveis).toEqual([])
  })

  it('experiencia direta nao duplica peso como competencia transferivel', () => {
    const candidato = criarCandidatoBase({
      experiencias: [
        {
          idExperiencia: 'exp-direta-sem-duplicar',
          empresa: 'Tech',
          cargo: 'Desenvolvedor',
          descricao: 'Tecnologia e desenvolvimento de software com documentacao, analise e resolucao de problemas.',
          dataInicio: '2024-01',
          dataFim: '2025-01',
          empregoAtual: false,
        },
      ],
    })
    const vaga = criarVagaBase({
      areaId: 'tecnologia',
      requisitosObrigatorios: [requisito('Comunicacao', 'competencia_comportamental', true)],
    })

    const resultado = calcularCompatibilidade(candidato, vaga)
    expect(resultado.experienciasAnteriores[0].tipoRelacao).toBe('direta')
    expect(resultado.experienciasAnteriores[0].competenciasTransferiveis).toEqual([])
    expect(resultado.competenciasTransferiveis).toEqual([])
  })
})
