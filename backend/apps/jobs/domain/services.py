import re
import unicodedata

from .entities import Job


def normalize_text(value: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', value.lower()) if unicodedata.category(c) != 'Mn').strip()


def normalize_roles(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw in values:
        for part in re.split(r'[,;|]+', raw):
            role = re.sub(r'\s+', ' ', part.strip())[:80]
            role = re.sub(r'\bEngenhario\b', 'Engenheiro', role, flags=re.IGNORECASE)
            role = re.sub(r'\bEngenharia de Software\b', 'Engenheiro de Software', role, flags=re.IGNORECASE)
            key = normalize_text(role)
            if key and key not in seen:
                seen.add(key)
                result.append(role)
    return result[:6]


def deduplicate_jobs(jobs: list[Job]) -> list[Job]:
    result: list[Job] = []
    seen: set[str] = set()
    for job in jobs:
        key = (
            f'url:{job.apply_url}' if job.apply_url else
            f'id:{job.external_id}' if job.external_id else
            f'signature:{normalize_text(job.company)}:{normalize_text(job.title)}:{normalize_text(job.city or "")}:{normalize_text(job.state or "")}'
        )
        if key not in seen:
            seen.add(key)
            result.append(job)
    return result


def keep_for_location(job: Job, city: str | None, state: str | None) -> bool:
    # A JSearch só confirma modalidade quando job_is_remote=true. False não
    # prova presencial/híbrido; dados desconhecidos nunca devem ser excluídos.
    if job.remote is True or job.remote is None:
        return True
    if not city or not state or not job.city or not job.state:
        return True
    return normalize_text(city) == normalize_text(job.city) and normalize_text(state) == normalize_text(job.state)

