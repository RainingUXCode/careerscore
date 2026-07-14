export function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  const ddd = digitos.slice(0, 2)
  const inicio = digitos.slice(2, digitos.length > 10 ? 7 : 6)
  const fim = digitos.slice(digitos.length > 10 ? 7 : 6)

  if (digitos.length <= 2) return ddd ? `(${ddd}` : ''
  if (!fim) return `(${ddd}) ${inicio}`
  return `(${ddd}) ${inicio}-${fim}`
}

/** Aceita tanto "YYYY-MM" quanto apenas "YYYY" (quando o mes nao e lembrado). */
export function formatarData(valor?: string): string {
  if (!valor) return '—'
  const [ano, mes] = valor.split('-')
  if (!mes) return ano
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ]
  return `${meses[Number(mes) - 1]}/${ano}`
}

/** Converte "YYYY-MM" ou "YYYY" (assume junho como meio do ano) em uma Date válida. */
function paraData(valor: string): Date | null {
  const data = valor.trim()
  if (/^\d{4}$/.test(data)) {
    const ano = Number(data)
    return Number.isFinite(ano) ? new Date(ano, 5) : null
  }

  const partes = data.match(/^(\d{4})-(\d{2})$/)
  if (!partes) return null

  const ano = Number(partes[1])
  const mes = Number(partes[2])
  if (!Number.isFinite(ano) || mes < 1 || mes > 12) return null

  return new Date(ano, mes - 1)
}

export function calcularDuracaoMeses(inicio: string, fim?: string): number {
  if (!inicio) return 0
  const start = paraData(inicio)
  const end = fim ? paraData(fim) : new Date()
  if (!start || !end) return 0

  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()),
  )
}
