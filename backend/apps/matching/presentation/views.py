from rest_framework.response import Response
from rest_framework.views import APIView

from apps.matching.domain.services import JobMatchingService
from .serializers import MatchJobsSerializer


class MatchJobsView(APIView):
    def post(self, request):
        serializer = MatchJobsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = JobMatchingService()
        matches = [service.evaluate(data['candidate'], job) for job in data['jobs']]
        matches.sort(key=lambda item: item['compatibilityScore'], reverse=True)
        return Response({'matches': matches})

