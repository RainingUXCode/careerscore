from django.test import SimpleTestCase
from rest_framework.test import APIClient

from apps.matching.domain.services import JobMatchingService


class MatchingTests(SimpleTestCase):
    def test_matching_is_deterministic_and_has_fifteen_dimensions(self):
        candidate = {'competencias': [{'nome': 'Python'}], 'modalidadesPreferidas': ['Remoto']}
        job = {
            'id': '1', 'titulo': 'Python Developer', 'modalidade': 'Remoto', 'modalidadeInformada': True,
            'requisitosObrigatorios': [{'nome': 'Python'}],
        }
        result = JobMatchingService().evaluate(candidate, job)
        self.assertEqual(len(result['dimensions']), 15)
        self.assertEqual(result['matchedRequirements'], ['Python'])
        self.assertGreaterEqual(result['compatibilityScore'], 0)
        self.assertLessEqual(result['compatibilityScore'], 100)

    def test_endpoint_ranks_jobs(self):
        payload = {
            'candidate': {'competencias': [{'nome': 'Python'}]},
            'jobs': [
                {'id': 'low', 'titulo': 'Designer', 'requisitosObrigatorios': [{'nome': 'Figma'}]},
                {'id': 'high', 'titulo': 'Python', 'requisitosObrigatorios': [{'nome': 'Python'}]},
            ],
        }
        response = APIClient().post('/api/v1/matching/jobs', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['matches'][0]['jobId'], 'high')

