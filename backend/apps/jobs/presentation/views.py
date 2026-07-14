from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.application.search_jobs import SearchJobsInput, SearchJobsUseCase
from apps.jobs.infrastructure.jsearch import JSearchClient, job_to_frontend
from .serializers import JobSearchQuerySerializer


class JobSearchView(APIView):
    @method_decorator(cache_page(15 * 60))
    def get(self, request):
        serializer = JobSearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        role_values = request.query_params.getlist('cargo')
        if data.get('roles'):
            role_values.append(data['roles'])
        elif data.get('cargo') and not role_values:
            role_values.append(data['cargo'])
        result = SearchJobsUseCase(JSearchClient()).execute(SearchJobsInput(
            roles=role_values,
            term=data.get('termo') or None,
            area=data.get('area') or None,
            city=data.get('cidade') or None,
            state=data.get('estado') or None,
            country=data.get('pais') or 'Brasil',
            remote=data.get('modalidade') == 'Remoto',
            page=data.get('page') or data.get('pagina') or 1,
        ))
        jobs = [job_to_frontend(job) for job in result.jobs]
        body = {
            'vagas': jobs,
            'pagina': data.get('page') or data.get('pagina') or 1,
            'fonte': {'id': 'jsearch', 'nome': 'JSearch (LinkedIn, Indeed, Glassdoor e outros)', 'tipo': 'real'},
            'diagnostico': {
                'brutas': result.raw_count,
                'normalizadas': result.normalized_count,
                'aposFiltroLocalizacao': result.location_count,
                'finais': len(jobs),
            },
            'queries': result.queries,
        }
        response = Response(body)
        response['Cache-Control'] = 'public, max-age=900' if jobs else 'no-store'
        return response

