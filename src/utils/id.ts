export function gerarId(prefixo: string): string {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
