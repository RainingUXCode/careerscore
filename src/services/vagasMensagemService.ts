export function mensagemFallbackJSearch(codigos: string[]): string {
  if (codigos.includes('chave_ausente')) {
    return 'O modo de vagas reais não está configurado neste ambiente. Exibimos vagas de demonstração.'
  }
  if (codigos.includes('cota_excedida')) {
    return 'A cota gratuita da fonte real de vagas foi atingida. Exibimos vagas de demonstração temporariamente.'
  }
  if (codigos.includes('timeout')) {
    return 'A fonte real de vagas demorou demais para responder. Exibimos vagas de demonstração nesta consulta.'
  }
  if (codigos.includes('resposta_invalida')) {
    return 'A fonte real respondeu, mas não trouxe resultados utilizáveis para estes filtros. Exibimos vagas de demonstração.'
  }
  if (codigos.includes('falha_normalizacao')) {
    return 'A fonte real retornou dados que não puderam ser interpretados com segurança. Exibimos vagas de demonstração.'
  }
  if (codigos.includes('falha_conexao')) {
    return 'Não foi possível conectar à fonte real de vagas agora. Exibimos vagas de demonstração.'
  }
  return 'A fonte de vagas reais está temporariamente indisponível. Exibimos vagas de demonstração.'
}
