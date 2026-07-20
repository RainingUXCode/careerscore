from typing import Protocol

from .entities import ExtractedCandidateProfile, ResumeDocument


class ResumeAnalysisProvider(Protocol):
    def analyze(self, document: ResumeDocument) -> ExtractedCandidateProfile: ...

