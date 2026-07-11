/**
 * Serviço de exportação do CareerScore.
 *
 * Estratégia: usar `window.print()` com folhas de estilo dedicadas
 * (`@media print` em `index.css`) para que o navegador gere o PDF via
 * "Salvar como PDF" do próprio diálogo de impressão. Isso evita adicionar uma
 * biblioteca pesada de geração de PDF no cliente (ex: jsPDF/html2pdf) só para
 * reproduzir o que o navegador já faz bem, com fontes, acentuação e quebras
 * de página nativas.
 *
 * Dois modos de impressão, controlados por um atributo em <body>:
 * - padrão (sem atributo): imprime o relatório completo (todas as abas).
 * - 'curriculo': esconde cabeçalho, navegação e as demais abas, imprimindo
 *   apenas o currículo ATS otimizado, em estilo de papel (ver index.css).
 */
const ATRIBUTO_MODO_IMPRESSAO = 'data-modo-impressao'

function imprimirComModo(modo: string | null): void {
  if (modo) {
    document.body.setAttribute(ATRIBUTO_MODO_IMPRESSAO, modo)
  } else {
    document.body.removeAttribute(ATRIBUTO_MODO_IMPRESSAO)
  }

  const limpar = () => {
    document.body.removeAttribute(ATRIBUTO_MODO_IMPRESSAO)
    window.removeEventListener('afterprint', limpar)
  }
  window.addEventListener('afterprint', limpar)

  window.print()
}

export const exportService = {
  /** Exporta o relatório completo (todas as abas) em PDF. */
  imprimirRelatorio(): void {
    imprimirComModo(null)
  },

  /**
   * Exporta apenas o currículo ATS otimizado em PDF, como um documento de
   * página única, sem o cabeçalho/navegação do relatório.
   *
   * Ponto de extensão futuro: se for necessário um layout totalmente
   * controlado (não dependente do que o navegador decide imprimir), esta é a
   * função onde uma biblioteca dedicada (ex: pdf-lib) ou uma geração via IA
   * (ex: Claude reescrevendo o currículo antes de exportar) entraria — sem
   * exigir mudanças nos componentes que a chamam.
   */
  imprimirCurriculoOtimizado(): void {
    imprimirComModo('curriculo')
  },
}
