export interface ExtractedCandidateExperience {
  role: string
  company?: string
  startDate?: string
  endDate?: string
  description?: string
  skills: string[]
}

export interface ExtractedCandidateProfile {
  name?: string
  professionalTitle?: string
  summary?: string
  location?: string
  seniority?: string
  skills: string[]
  preferredRoles: string[]
  experience: ExtractedCandidateExperience[]
  education: Array<Record<string, unknown>>
  languages: Array<Record<string, unknown>>
  totalExperienceMonths?: number
  status?: 'preliminary'
}

export interface ResumeAnalysisResponse {
  profile: ExtractedCandidateProfile
  searchedQueries: string[]
  jobsFound: number
  matches: unknown[]
  jobErrors: string[]
  requiresConfirmation?: boolean
}
