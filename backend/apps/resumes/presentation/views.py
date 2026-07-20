from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.resumes.application.analyze_resume import AnalyzeResumeUseCase
from apps.resumes.domain.entities import ResumeDocument
from apps.resumes.infrastructure.gemini import GeminiResumeAnalysisProvider, profile_to_dict
from .serializers import ResumeAnalyzeSerializer


class ResumeAnalyzeView(APIView):
    throttle_scope = 'resume_analysis'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        payload = request.data.copy()
        if 'resume' not in payload and 'curriculo' in payload:
            payload['resume'] = payload['curriculo']
        serializer = ResumeAnalyzeSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data['resume']
        document = ResumeDocument(
            filename=upload.name,
            mime_type=upload.content_type or '',
            size=upload.size,
            content=upload.read(),
        )
        profile = AnalyzeResumeUseCase(GeminiResumeAnalysisProvider()).execute(document)
        body = {
            'profile': profile_to_dict(profile),
            'searchedQueries': [],
            'jobsFound': 0,
            'matches': [],
            'jobErrors': [],
            'requiresConfirmation': True,
        }
        return Response(body)
