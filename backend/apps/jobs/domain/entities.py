from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Job:
    id: str
    external_id: str | None
    title: str
    company: str
    description: str
    city: str | None
    state: str | None
    country: str
    remote: bool | None
    apply_url: str | None
    required_skills: tuple[str, ...] = ()
    published_at: str | None = None
    raw: dict[str, Any] = field(default_factory=dict, compare=False, repr=False)

