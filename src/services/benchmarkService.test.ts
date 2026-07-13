import { describe, expect, it } from 'vitest'
import { criarCandidatoBase } from '../test/fixtures'
import { NomeArea, TipoCompetencia } from '../types/enums'
import { analysisService } from './analysisService'
import { benchmarkService, categoriasPontuacao } from './benchmarkService'

describe('benchmarkService score v2', () => {
  it('usa apenas as cinco novas categorias do score', () => {
    const chaves = categoriasPontuacao.map((categoria) => categoria.chave)

    expect(chaves).toEqual([
      'competenciasRelevantes',
      'experienciaEvidencias',
      'projetosEntregas',
      'consistenciaPerfil',
      'curriculoApresentacao',
    ])
    expect(categoriasPontuacao.reduce((soma, categoria) => soma + categoria.maximo, 0)).toBe(100)
  })

  it('calcula referência heurística sem comparar escolaridade, idiomas ou certificados como notas universais', () => {
    const analise = analysisService.gerarAnalise(criarCandidatoBase({
      areaInteresse: { idArea: 'area-1', nome: NomeArea.TECNOLOGIA_DADOS },
      competencias: [{ idCompetencia: 'comp-1', nome: 'React', tipo: TipoCompetencia.TECNICA }],
    }))
    const resultado = benchmarkService.calcular(analise, NomeArea.TECNOLOGIA_DADOS)

    expect(resultado.observacao).toContain('heurística')
    expect(Object.keys(resultado.referencia)).not.toContain('escolaridade')
    expect(Object.keys(resultado.referencia)).not.toContain('idiomas')
    expect(Object.keys(resultado.referencia)).not.toContain('certificados')
  })
})
