from django.test import SimpleTestCase
from rest_framework.test import APIClient


class HealthTests(SimpleTestCase):
    def test_health(self):
        response = APIClient().get('/api/v1/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok', 'service': 'careerscore-api'})
