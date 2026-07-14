export function separarValoresLista(valor: string): string[] {
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
