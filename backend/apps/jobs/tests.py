from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient

from apps.jobs.application.search_jobs import SearchJobsInput, SearchJobsUseCase
from apps.jobs.domain.entities import Job


def job(identifier='1', remote=None, city=None, state=None, url=None):
    return Job(f'job-{identifier}', identifier, 'Backend Developer', 'Empresa', '', city, state, 'BR', remote, url)


class SearchJobsUseCaseTests(SimpleTestCase):
    def test_normalizes_multiple_roles_keeps_remote_and_deduplicates(self):
        provider = Mock()
        provider.search.side_effect = [[job('1', True, 'Recife', 'PE')], [job('1', True, 'Recife', 'PE')]]
        result = SearchJobsUseCase(provider).execute(SearchJobsInput(
            roles=['Engenhario de Software, Back-end'], city='João Pessoa', state='PB'
        ))
        self.assertEqual(len(result.jobs), 1)
        self.assertEqual(provider.search.call_count, 2)
        self.assertIn('Engenheiro de Software', result.queries[0])

    def test_keeps_unknown_location(self):
        provider = Mock()
        provider.search.return_value = [job('1')]
        result = SearchJobsUseCase(provider).execute(SearchJobsInput(roles=[], city='Recife', state='PE'))
        self.assertEqual(len(result.jobs), 1)


class JobRouteTests(SimpleTestCase):
    @override_settings(JSEARCH_API_KEY='')
    def test_missing_key_returns_json_error(self):
        response = APIClient().get('/api/vagas?cargo=Backend')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()['erro'], 'chave_ausente')

    @patch('apps.jobs.presentation.views.JSearchClient.search')
    def test_route_returns_normalized_json(self, search):
        search.return_value = []
        response = APIClient().get('/api/v1/jobs/search?roles=Node.js')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['vagas'], [])
        self.assertTrue(response['Content-Type'].startswith('application/json'))
