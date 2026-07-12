import { describe, expect, it } from 'vitest'
import { mensagemFallbackJSearch } from '../services/vagasMensagemService'

describe('mensagemFallbackJSearch', () => {
  it('diferencia timeout da fonte real', () => {
    expect(mensagemFallbackJSearch(['timeout'])).toContain('demorou demais')
  })

  it('diferencia resposta invalida da fonte real', () => {
    expect(mensagemFallbackJSearch(['resposta_invalida'])).toContain('não trouxe resultados utilizáveis')
  })
})
