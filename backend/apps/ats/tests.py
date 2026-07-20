from django.test import SimpleTestCase
from rest_framework.test import APIClient

from apps.ats.domain.services import AtsScoringService


class AtsTests(SimpleTestCase):
    def test_score_is_deterministic_and_bounded(self):
        profile = {'competencias': [{'nome': 'Python'}], 'escolaridades': [{}]}
        text = 'Resumo Experiência Formação Habilidades Python. Desenvolvi e implementei um projeto.'
        first = AtsScoringService().evaluate(profile, text)
        second = AtsScoringService().evaluate(profile, text)
        self.assertEqual(first, second)
        self.assertGreaterEqual(first.score, 0)
        self.assertLessEqual(first.score, 100)

    def test_endpoint(self):
        response = APIClient().post('/api/v1/ats/evaluate', {'profile': {}, 'resumeText': ''}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['algorithm_version'], 'ats-v1-django')

