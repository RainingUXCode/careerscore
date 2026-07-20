import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DadosPessoaisSection } from './DadosPessoaisSection'
import { criarCandidatoBase } from '../../test/fixtures'

describe('DadosPessoaisSection', () => {
  it('nao renderiza o campo nivel de experiencia na primeira etapa', () => {
    const html = renderToStaticMarkup(
      <DadosPessoaisSection candidato={criarCandidatoBase()} atualizarCampo={vi.fn()} erros={{}} />,
    )

    expect(html).toContain('Nome completo')
    expect(html).toContain('E-mail')
    expect(html).toContain('Telefone')
    expect(html).toContain('Cidade')
    expect(html).toContain('Estado')
    expect(html).not.toContain('Nível de experiência')
    expect(html).not.toContain('nivelExperiencia')
  })
})
