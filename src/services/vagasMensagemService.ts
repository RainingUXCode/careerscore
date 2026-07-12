const MOTIVOS_FALHA: Record<string, string> = {
  chave_ausente: 'O modo de vagas reais não está configurado neste ambiente.',
  cota_excedida: 'A cota gratuita da fonte real de vagas foi atingida.',
  timeout: 'A fonte real de vagas demorou demais para responder.',
  resposta_invalida: 'A fonte real respondeu, mas não trouxe resultados utilizáveis para estes filtros.',
  falha_normalizacao: 'A fonte real retornou dados que não puderam ser interpretados com segurança.',
  falha_conexao: 'Não foi possível conectar à fonte real de vagas agora.',
}

function motivoFalha(codigos: string[]): string {
  const codigoConhecido = codigos.find((codigo) => codigo in MOTIVOS_FALHA)
  return codigoConhecido ? MOTIVOS_FALHA[codigoConhecido] : 'A fonte de vagas reais está temporariamente indisponível.'
}

/**
 * Mensagem de fallback — nunca afirma que vagas de demonstração estão sendo
 * exibidas quando, na prática, o fallback também não retornou nenhuma vaga
 * (evita a contradição "exibimos demonstração" ao lado de uma lista vazia).
 *
 * Só deve ser usada quando a fonte real de fato FALHOU (statusFonteReal ===
 * 'falhou') — nunca para uma resposta real vazia com sucesso, que tem sua
 * própria mensagem (`mensagemFonteRealVazia`) e não deve dizer "não
 * configurado" nem nenhum motivo de erro que não aconteceu.
 */
export function mensagemFallbackJSearch(codigos: string[], temVagasFallback: boolean): string {
  const motivo = motivoFalha(codigos)
  return temVagasFallback
    ? `${motivo} Exibimos vagas de demonstração.`
    : `${motivo} Nenhuma vaga de demonstração pôde ser exibida para os filtros atuais desta consulta.`
}

/**
 * Mensagem para quando a fonte real respondeu com sucesso, mas não encontrou
 * nenhuma vaga para os filtros usados — não é uma falha, não deve soar como
 * uma.
 */
export function mensagemFonteRealVazia(): string {
  return 'A fonte real respondeu, mas não encontrou vagas para esta busca. Tente atualizar mais tarde ou ajustar o objetivo profissional.'
}
