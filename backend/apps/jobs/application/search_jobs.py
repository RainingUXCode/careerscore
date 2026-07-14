from dataclasses import dataclass

from apps.jobs.domain.entities import Job
from apps.jobs.domain.services import deduplicate_jobs, keep_for_location, normalize_roles
from .ports import JobSearchProvider


@dataclass(frozen=True)
class SearchJobsInput:
    roles: list[str]
    term: str | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = 'Brasil'
    remote: bool = False
    page: int = 1
    limit: int = 10


@dataclass(frozen=True)
class SearchJobsResult:
    jobs: list[Job]
    raw_count: int
    normalized_count: int
    location_count: int
    queries: list[str]


class SearchJobsUseCase:
    def __init__(self, provider: JobSearchProvider):
        self.provider = provider

    def execute(self, data: SearchJobsInput) -> SearchJobsResult:
        roles = normalize_roles(data.roles)
        query_roles: list[str | None] = roles or [None]
        groups: list[list[Job]] = []
        queries: list[str] = []
        for role in query_roles:
            parts = [data.term, role, data.area]
            query = ' '.join(dict.fromkeys(word for part in parts if part for word in part.split())) or 'vaga'
            queries.append(query)
            groups.append(self.provider.search(query, data.country, data.page, data.remote))

        raw = [job for group in groups for job in group]
        selected: list[Job] = []
        index = 0
        while len(selected) < data.limit:
            added = False
            for group in groups:
                if index < len(group):
                    selected.append(group[index])
                    added = True
                    if len(selected) == data.limit:
                        break
            if not added:
                break
            index += 1

        location_filtered = [job for job in selected if keep_for_location(job, data.city, data.state)]
        final = deduplicate_jobs(location_filtered)
        return SearchJobsResult(final, len(raw), len(selected), len(location_filtered), queries)

