from apps.resumes.domain.entities import ExtractedCandidateProfile, ResumeDocument
from apps.resumes.domain.ports import ResumeAnalysisProvider
from apps.resumes.domain.validation import validate_resume


class AnalyzeResumeUseCase:
    def __init__(self, provider: ResumeAnalysisProvider):
        self.provider = provider

    def execute(self, document: ResumeDocument) -> ExtractedCandidateProfile:
        validate_resume(document)
        return self.provider.analyze(document)

