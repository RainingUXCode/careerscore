#!/usr/bin/env node
/**
 * Validação manual e controlada do payload real da JSearch — rode isto uma
 * única vez, localmente, com sua própria chave. Faz UMA chamada e imprime só
 * um relatório sanitizado (nomes de campos, tipos, presença/ausência e um
 * exemplo reduzido) — nunca a chave, nunca o payload bruto completo.
 *
 * Como rodar:
 *   JSEARCH_API_KEY=sua_chave node scripts/validar-jsearch.mjs
 *   JSEARCH_API_KEY=sua_chave node scripts/validar-jsearch.mjs "fisioterapeuta"
 *
 * Não roda como parte do build/lint/test do projeto — é uma ferramenta manual.
 */

const apiKey = process.env.JSEARCH_API_KEY
if (!apiKey) {
  console.error('Defina JSEARCH_API_KEY antes de rodar este script. Exemplo:')
  console.error('  JSEARCH_API_KEY=sua_chave node scripts/validar-jsearch.mjs')
  process.exit(1)
}

const termo = process.argv[2] || 'desenvolvedor'
const url = `https://api.openwebninja.com/jsearch/search-v2?query=${encodeURIComponent(termo)}&country=br&page=1&num_pages=1`

// Campos que nosso normalizador hoje espera (src/services/providers/jsearch/types.ts).
const CAMPOS_ESPERADOS = [
  'job_id', 'job_title', 'employer_name', 'job_employment_type', 'job_apply_link',
  'job_apply_is_direct', 'job_description', 'job_is_remote', 'job_posted_at_datetime_utc',
  'job_offer_expiration_datetime_utc', 'job_city', 'job_state', 'job_country',
  'job_min_salary', 'job_max_salary', 'job_salary_currency', 'job_salary_period',
  'job_salary_is_predicted', 'job_required_experience', 'job_required_education',
  'job_required_skills', 'job_highlights',
]

function truncarUrl(valor) {
  if (typeof valor !== 'string') return valor
  try {
    const u = new URL(valor)
    return `${u.origin}${u.pathname} (query string omitida — pode conter token de rastreamento)`
  } catch {
    return '[url inválida]'
  }
}

function sanitizarExemplo(job) {
  const copia = { ...job }
  if (copia.job_apply_link) copia.job_apply_link = truncarUrl(copia.job_apply_link)
  if (copia.job_description) copia.job_description = `${String(copia.job_description).slice(0, 120)}... (truncado)`
  if (copia.employer_logo) copia.employer_logo = '[omitido]'
  return copia
}

async function main() {
  console.log(`Consultando JSearch (1 chamada) — termo: "${termo}", país: br...`)

  const resposta = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
    },
  })

  console.log(`Status HTTP: ${resposta.status}`)

  const corpo = await resposta.json()

  if (corpo.status !== 'OK' || !Array.isArray(corpo.data)) {
    console.log('Resposta não veio no formato esperado ({status:"OK", data:[...]}). Corpo (sanitizado):')
    console.log(JSON.stringify({ status: corpo.status, error: corpo.error }, null, 2))
    return
  }

  console.log(`\nTotal de vagas retornadas: ${corpo.data.length}\n`)

  if (corpo.data.length === 0) {
    console.log('Nenhuma vaga retornada para este termo — tente outro termo de busca.')
    return
  }

  const primeira = corpo.data[0]
  const camposPresentes = Object.keys(primeira)

  console.log('=== Campos presentes na primeira vaga (nome: tipo) ===')
  for (const campo of camposPresentes) {
    const valor = primeira[campo]
    const tipo = valor === null ? 'null' : Array.isArray(valor) ? 'array' : typeof valor
    console.log(`  ${campo}: ${tipo}`)
  }

  console.log('\n=== Checklist: campos esperados pelo nosso normalizador ===')
  for (const campo of CAMPOS_ESPERADOS) {
    const presente = campo in primeira
    console.log(`  [${presente ? 'x' : ' '}] ${campo}${presente ? '' : '  <-- AUSENTE nesta vaga'}`)
  }

  console.log('\n=== Exemplo sanitizado (1 vaga, URLs/descrição truncadas) ===')
  console.log(JSON.stringify(sanitizarExemplo(primeira), null, 2))

  console.log('\nCopie as duas seções acima (campos presentes + checklist + exemplo sanitizado)')
  console.log('e cole de volta na conversa — nenhuma chave ou header aparece nelas.')
}

main().catch((erro) => {
  console.error('Falha ao consultar a JSearch:', erro.message)
  process.exit(1)
})
