import json
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from django.conf import settings

from apps.jobs.domain.entities import Job
from shared.domain.errors import ApplicationError

JSEARCH_ENDPOINT = 'https://api.openwebninja.com/jsearch/search-v2'
JSEARCH_TIMEOUT_SECONDS = 8


def _jobs_data(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict) or payload.get('status') != 'OK':
        raise ApplicationError('resposta_invalida', 'A fonte real de vagas retornou uma resposta inválida.', 502)
    data = payload.get('data')
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict) and isinstance(data.get('jobs'), list):
        return [item for item in data['jobs'] if isinstance(item, dict)]
    raise ApplicationError('resposta_invalida', 'A fonte real de vagas não retornou resultados utilizáveis.', 502)


def _map_job(raw: dict[str, Any]) -> Job:
    external_id = raw.get('job_id') if isinstance(raw.get('job_id'), str) else None
    apply_url = raw.get('job_apply_link') if isinstance(raw.get('job_apply_link'), str) else None
    fallback = external_id or apply_url or f"{raw.get('job_title', 'sem-titulo')}:{raw.get('employer_name', 'sem-empresa')}"
    skills = raw.get('job_required_skills')
    return Job(
        id=f'jsearch-{fallback}',
        external_id=external_id,
        title=str(raw.get('job_title') or 'Título não informado'),
        company=str(raw.get('employer_name') or 'Empresa não informada'),
        description=str(raw.get('job_description') or ''),
        city=raw.get('job_city') if isinstance(raw.get('job_city'), str) else None,
        state=raw.get('job_state') if isinstance(raw.get('job_state'), str) else None,
        country=str(raw.get('job_country') or 'Não informado'),
        remote=True if raw.get('job_is_remote') is True else None,
        apply_url=apply_url,
        required_skills=tuple(item for item in skills if isinstance(item, str)) if isinstance(skills, list) else (),
        published_at=raw.get('job_posted_at_datetime_utc') if isinstance(raw.get('job_posted_at_datetime_utc'), str) else None,
        raw=raw,
    )


class JSearchClient:
    def search(self, query: str, country: str, page: int, remote: bool) -> list[Job]:
        if not settings.JSEARCH_API_KEY:
            raise ApplicationError('chave_ausente', 'A fonte real de vagas não está configurada neste ambiente.', 503)
        country_code = 'br' if country.lower().startswith('br') else country[:2].lower()
        params = {'query': query, 'country': country_code, 'page': page, 'num_pages': 1}
        if remote:
            params['work_from_home'] = 'true'
        request = urllib.request.Request(
            f'{JSEARCH_ENDPOINT}?{urllib.parse.urlencode(params)}',
            headers={'X-API-Key': settings.JSEARCH_API_KEY, 'Accept': 'application/json'},
        )
        try:
            with urllib.request.urlopen(request, timeout=JSEARCH_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                raise ApplicationError('cota_excedida', 'A cota da fonte real de vagas foi atingida.', 429) from exc
            if exc.code in (401, 403):
                raise ApplicationError('credencial_invalida', 'A fonte real de vagas recusou a credencial do servidor.', 502) from exc
            raise ApplicationError('erro_fonte_externa', 'A fonte real de vagas retornou um erro.', 502) from exc
        except (TimeoutError, socket.timeout) as exc:
            raise ApplicationError('timeout', 'A fonte real de vagas demorou demais para responder.', 504) from exc
        except (urllib.error.URLError, json.JSONDecodeError) as exc:
            raise ApplicationError('resposta_invalida', 'A fonte real de vagas retornou uma resposta inválida.', 502) from exc
        return [_map_job(item) for item in _jobs_data(payload)]


def job_to_frontend(job: Job) -> dict[str, Any]:
    raw = job.raw
    requirements = [
        {'id': f'jsearch-skill-{index}', 'nome': skill, 'tipo': 'competencia_tecnica', 'obrigatorio': True}
        for index, skill in enumerate(job.required_skills)
    ]
    now = datetime.now(timezone.utc).isoformat()
    return {
        'id': job.id,
        'idExterno': job.external_id,
        'fonte': {'id': 'jsearch', 'nome': 'JSearch (LinkedIn, Indeed, Glassdoor e outros)', 'tipo': 'real'},
        'titulo': job.title,
        'empresa': job.company,
        'descricao': job.description,
        'areaId': 'outro',
        'senioridadeInformada': False,
        'localizacao': {'cidade': job.city, 'estado': job.state, 'pais': job.country},
        'modalidade': 'Remoto' if job.remote else None,
        'modalidadeInformada': job.remote is True,
        'publico': 'nao_identificado',
        'beneficios': raw.get('job_highlights', {}).get('Benefits', []) if isinstance(raw.get('job_highlights'), dict) else [],
        'requisitosObrigatorios': requirements,
        'requisitosDesejaveis': [],
        'idiomasExigidos': [],
        'dataPublicacao': job.published_at[:10] if job.published_at else None,
        'consultadaEm': now,
        'urlOriginal': job.apply_url,
        'status': 'aberta',
        'confiabilidadeDados': {'nivel': 'media', 'motivo': 'Dados normalizados a partir da fonte externa.'},
    }

