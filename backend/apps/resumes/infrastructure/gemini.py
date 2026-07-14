import base64
import json
import socket
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

from apps.resumes.domain.entities import CandidateExperience, ExtractedCandidateProfile, ResumeDocument
from shared.domain.errors import ApplicationError

GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'
GEMINI_TIMEOUT_SECONDS = 15
PROMPT = """
Extraia deste currículo um perfil profissional. Retorne somente JSON válido.
Não invente dados. Arrays devem ser vazios quando não houver evidência.
Formato: {"name":null,"professionalTitle":null,"summary":null,"location":null,
"seniority":null,"skills":[],"preferredRoles":[],"experience":[{"role":"",
"company":null,"startDate":null,"endDate":null,"description":null,"skills":[]}],
"education":[],"languages":[],"totalExperienceMonths":null}
""".strip()


def _optional_string(value: Any, maximum: int = 1000) -> str | None:
    return value.strip()[:maximum] if isinstance(value, str) and value.strip() else None


def _strings(value: Any, limit: int = 50) -> tuple[str, ...]:
    if not isinstance(value, list):
        return ()
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        text = _optional_string(item, 120)
        key = text.lower() if text else ''
        if text and key not in seen:
            seen.add(key)
            result.append(text)
    return tuple(result[:limit])


def _profile(payload: Any) -> ExtractedCandidateProfile:
    if not isinstance(payload, dict):
        raise ApplicationError('resposta_invalida', 'A IA retornou um perfil inválido.', 502)
    experiences: list[CandidateExperience] = []
    for raw in payload.get('experience', []) if isinstance(payload.get('experience'), list) else []:
        if not isinstance(raw, dict) or not _optional_string(raw.get('role'), 160):
            continue
        experiences.append(CandidateExperience(
            role=_optional_string(raw.get('role'), 160) or '',
            company=_optional_string(raw.get('company'), 160),
            start_date=_optional_string(raw.get('startDate'), 40),
            end_date=_optional_string(raw.get('endDate'), 40),
            description=_optional_string(raw.get('description'), 2000),
            skills=_strings(raw.get('skills')),
        ))
    education = tuple(item for item in payload.get('education', []) if isinstance(item, dict))[:30] if isinstance(payload.get('education'), list) else ()
    languages = tuple(item for item in payload.get('languages', []) if isinstance(item, dict))[:20] if isinstance(payload.get('languages'), list) else ()
    months = payload.get('totalExperienceMonths')
    return ExtractedCandidateProfile(
        name=_optional_string(payload.get('name'), 160),
        professional_title=_optional_string(payload.get('professionalTitle'), 160),
        summary=_optional_string(payload.get('summary'), 2000),
        location=_optional_string(payload.get('location'), 160),
        seniority=_optional_string(payload.get('seniority'), 80),
        skills=_strings(payload.get('skills')),
        preferred_roles=_strings(payload.get('preferredRoles'), 10),
        experience=tuple(experiences[:30]),
        education=education,
        languages=languages,
        total_experience_months=months if isinstance(months, int) and months >= 0 else None,
    )


class GeminiResumeAnalysisProvider:
    def analyze(self, document: ResumeDocument) -> ExtractedCandidateProfile:
        if not settings.GEMINI_API_KEY:
            raise ApplicationError('chave_ausente', 'A análise por IA não está configurada neste ambiente.', 503)
        request = urllib.request.Request(
            GEMINI_ENDPOINT,
            method='POST',
            headers={'Content-Type': 'application/json', 'x-goog-api-key': settings.GEMINI_API_KEY},
            data=json.dumps({
                'model': settings.GEMINI_MODEL,
                'input': [
                    {'type': 'text', 'text': PROMPT},
                    {'type': 'document', 'data': base64.b64encode(document.content).decode('ascii'), 'mime_type': 'application/pdf'},
                ],
            }).encode('utf-8'),
        )
        try:
            with urllib.request.urlopen(request, timeout=GEMINI_TIMEOUT_SECONDS) as response:
                body = json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                raise ApplicationError('cota_excedida', 'A cota do provedor de IA foi atingida.', 429) from exc
            if exc.code in (401, 403):
                raise ApplicationError('credencial_invalida', 'O provedor de IA recusou a credencial do servidor.', 502) from exc
            raise ApplicationError('erro_provedor', 'O provedor de IA retornou um erro.', 502) from exc
        except (TimeoutError, socket.timeout) as exc:
            raise ApplicationError('timeout', 'A análise por IA demorou demais para responder.', 504) from exc
        except (urllib.error.URLError, json.JSONDecodeError) as exc:
            raise ApplicationError('resposta_invalida', 'A IA retornou uma resposta inválida.', 502) from exc
        text = body.get('output_text') or body.get('outputText') if isinstance(body, dict) else None
        if not isinstance(text, str):
            raise ApplicationError('resposta_invalida', 'A IA retornou uma resposta inválida.', 502)
        clean = text.strip()
        if clean.startswith('```'):
            clean = clean.removeprefix('```json').removeprefix('```').removesuffix('```').strip()
        try:
            return _profile(json.loads(clean))
        except json.JSONDecodeError as exc:
            raise ApplicationError('resposta_invalida', 'A IA retornou um perfil inválido.', 502) from exc


def profile_to_dict(profile: ExtractedCandidateProfile) -> dict[str, Any]:
    return {
        'name': profile.name,
        'professionalTitle': profile.professional_title,
        'summary': profile.summary,
        'location': profile.location,
        'seniority': profile.seniority,
        'skills': list(profile.skills),
        'preferredRoles': list(profile.preferred_roles),
        'experience': [{
            'role': item.role, 'company': item.company, 'startDate': item.start_date,
            'endDate': item.end_date, 'description': item.description, 'skills': list(item.skills),
        } for item in profile.experience],
        'education': list(profile.education),
        'languages': list(profile.languages),
        'totalExperienceMonths': profile.total_experience_months,
        'status': profile.status,
    }
