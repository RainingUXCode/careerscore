from dataclasses import dataclass


@dataclass(frozen=True)
class CandidateExperience:
    role: str
    company: str | None
    start_date: str | None
    end_date: str | None
    description: str | None
    skills: tuple[str, ...]


@dataclass(frozen=True)
class ExtractedCandidateProfile:
    name: str | None
    professional_title: str | None
    summary: str | None
    location: str | None
    seniority: str | None
    skills: tuple[str, ...]
    preferred_roles: tuple[str, ...]
    experience: tuple[CandidateExperience, ...]
    education: tuple[dict, ...]
    languages: tuple[dict, ...]
    total_experience_months: int | None
    status: str = 'preliminary'


@dataclass(frozen=True)
class ResumeDocument:
    filename: str
    mime_type: str
    size: int
    content: bytes

