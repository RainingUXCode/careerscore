import { describe, expect, it } from 'vitest'
import { mensagemFallbackJSearch } from '../services/vagasMensagemService'

describe('mensagemFallbackJSearch', () => {
  it('diferencia timeout da fonte real', () => {
    expect(mensagemFallbackJSearch(['timeout'], true)).toContain('demorou demais')
  })

  it('diferencia resposta invalida da fonte real', () => {
    expect(mensagemFallbackJSearch(['resposta_invalida'], true)).toContain('não trouxe resultados utilizáveis')
  })

  it('afirma que exibe vagas de demonstração apenas quando elas realmente existem', () => {
    expect(mensagemFallbackJSearch(['cota_excedida'], true)).toContain('Exibimos vagas de demonstração')
  })

  it('não afirma que exibe vagas de demonstração quando o fallback também retornou vazio', () => {
    const mensagem = mensagemFallbackJSearch(['cota_excedida'], false)
    expect(mensagem).not.toContain('Exibimos vagas de demonstração')
    expect(mensagem).toContain('Nenhuma vaga de demonstração')
  })

  it('nunca menciona um corte fixo de 70%', () => {
    expect(mensagemFallbackJSearch(['chave_ausente'], true)).not.toContain('70%')
    expect(mensagemFallbackJSearch(['chave_ausente'], false)).not.toContain('70%')
  })
})
