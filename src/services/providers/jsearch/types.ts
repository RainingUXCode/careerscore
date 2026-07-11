/**
 * Tipos da resposta bruta da JSearch (API oficial da OpenWeb Ninja:
 * https://api.openwebninja.com/jsearch/search-v2, autenticação via X-API-Key).
 *
 * IMPORTANTE — nível de confiança destes campos:
 * - Confirmados via documentação/exemplos localizados nesta pesquisa: envelope
 *   {status, request_id, parameters, data}, paginação via `page`/`num_pages`,
 *   filtro `employment_types`, `work_from_home`, `date_posted`, país via `country`.
 * - Nomes de campo dentro de cada vaga (`job_title`, `employer_name`, etc.) são
 *   os nomes de fato usados pela JSearch e amplamente documentados por
 *   integrações de terceiros, mas não foram confirmados linha a linha num
 *   payload oficial ao vivo nesta sessão — a normalização abaixo trata
 *   qualquer campo ausente/undefined como "não informado", nunca como erro,
 *   exatamente para tolerar diferenças caso algum nome não bata exatamente.
 * - Campo de expiração (`job_offer_expiration_datetime_utc` abaixo) é o nome
 *   mais citado em fontes de terceiros, mas fica marcado como PENDÊNCIA DE
 *   CONFIRMAÇÃO — ver README/relatório desta etapa.
 * - `search-v2` é o endpoint atual segundo a documentação oficial mais
 *   recente; a paridade exata de parâmetros/campos com versões anteriores do
 *   endpoint não foi reconfirmada nesta sessão — validar com o script
 *   `scripts/validar-jsearch.mjs` antes de confiar cegamente nestes tipos.
 */
export interface JSearchRawJob {
  job_id?: string
  job_title?: string
  employer_name?: string
  employer_logo?: string | null
  job_publisher?: string
  job_employment_type?: string // ex: "FULLTIME", "PARTTIME", "CONTRACTOR", "INTERN"
  job_apply_link?: string
  job_apply_is_direct?: boolean
  job_description?: string
  job_is_remote?: boolean
  job_posted_at_datetime_utc?: string
  /** PENDÊNCIA: nome exato não confirmado ao vivo — tratar ausência normalmente. */
  job_offer_expiration_datetime_utc?: string
  job_city?: string | null
  job_state?: string | null
  job_country?: string | null
  job_min_salary?: number | null
  job_max_salary?: number | null
  job_salary_currency?: string | null
  job_salary_period?: string | null
  job_salary_is_predicted?: boolean | string | null
  job_required_experience?: {
    no_experience_required?: boolean
    required_experience_in_months?: number | null
  } | null
  job_required_education?: {
    postgraduate_degree?: boolean
    professional_certification?: boolean
    high_school?: boolean
    associates_degree?: boolean
    bachelors_degree?: boolean
    degree_mentioned?: boolean
    degree_preferred?: boolean
  } | null
  job_required_skills?: string[] | null
  job_highlights?: {
    Qualifications?: string[]
    Responsibilities?: string[]
    Benefits?: string[]
  } | null
}

export interface JSearchJobsData {
  jobs?: JSearchRawJob[]
  cursor?: string
}

export interface JSearchSearchResponse {
  status: 'OK' | 'ERROR'
  request_id?: string
  parameters?: Record<string, unknown>
  data?: JSearchRawJob[] | JSearchJobsData
  error?: { message: string; code: number }
}
