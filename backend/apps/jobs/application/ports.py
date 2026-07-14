from typing import Protocol

from apps.jobs.domain.entities import Job


class JobSearchProvider(Protocol):
    def search(self, query: str, country: str, page: int, remote: bool) -> list[Job]: ...

