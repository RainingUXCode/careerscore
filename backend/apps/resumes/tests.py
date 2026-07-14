from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APIClient

from apps.resumes.domain.entities import ExtractedCandidateProfile


class ResumeRouteTests(SimpleTestCase):
    def test_rejects_invalid_pdf(self):
        upload = SimpleUploadedFile('cv.pdf', b'not-pdf', content_type='application/pdf')
        response = APIClient().post('/api/v1/resumes/analyze', {'resume': upload, 'consent': True}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['erro'], 'pdf_invalido')

    @patch('apps.resumes.presentation.views.GeminiResumeAnalysisProvider.analyze')
    def test_returns_preliminary_profile(self, analyze):
        analyze.return_value = ExtractedCandidateProfile(
            None, 'Backend Developer', None, None, None, ('Python',), (), (), (), (), None
        )
        upload = SimpleUploadedFile('cv.pdf', b'%PDF-1.7 valid-test', content_type='application/pdf')
        response = APIClient().post('/api/resume/analyze', {'resume': upload, 'consent': True}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['profile']['professionalTitle'], 'Backend Developer')
        self.assertTrue(response.json()['requiresConfirmation'])

    def test_requires_explicit_consent(self):
        upload = SimpleUploadedFile('cv.pdf', b'%PDF-1.7 valid-test', content_type='application/pdf')
        response = APIClient().post('/api/v1/resumes/analyze', {'resume': upload}, format='multipart')
        self.assertEqual(response.status_code, 400)

