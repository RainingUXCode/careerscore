from dataclasses import asdict

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ats.domain.services import AtsScoringService
from .serializers import AtsEvaluateSerializer


class AtsEvaluateView(APIView):
    def post(self, request):
        serializer = AtsEvaluateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AtsScoringService().evaluate(
            serializer.validated_data['profile'],
            serializer.validated_data.get('resumeText'),
        )
        return Response(asdict(result))

