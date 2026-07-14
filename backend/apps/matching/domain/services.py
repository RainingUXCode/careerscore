import unicodedata
from dataclasses import dataclass


WEIGHTS = {
    'area': 20, 'cargo': 10, 'senioridade': 10, 'formacao': 8, 'experiencia': 10,
    'competenciasTecnicas': 20, 'softSkills': 6, 'competenciasTransferiveis': 4,
    'idiomas': 6, 'certificados': 4, 'licencas': 4, 'localizacao': 8,
    'modalidade': 6, 'tipoContrato': 4, 'faixaSalarial': 6,
}


def _text(value: object) -> str:
    raw = str(value or '').lower()
    return ''.join(c for c in unicodedata.normalize('NFD', raw) if unicodedata.category(c) != 'Mn')


def _names(values: object, *keys: str) -> list[str]:
    if not isinstance(values, list):
        return []
    result: list[str] = []
    for value in values:
        if isinstance(value, dict):
            item = next((value.get(key) for key in keys if value.get(key)), '')
        else:
            item = value
        if item:
            result.append(str(item))
    return result


@dataclass(frozen=True)
class MatchDimension:
    key: str
    weight: int
    score: int | None
    evaluated: bool
    reason: str


class JobMatchingService:
    """Compatibilidade determinística em 15 dimensões, independente de IA."""

    def evaluate(self, candidate: dict, job: dict) -> dict:
        candidate_skills = _names(candidate.get('competencias', candidate.get('skills', [])), 'nome', 'name')
        mandatory = _names(job.get('requisitosObrigatorios', job.get('requiredSkills', [])), 'nome', 'name')
        desired = _names(job.get('requisitosDesejaveis', []), 'nome', 'name')
        candidate_text = _text(' '.join(candidate_skills))
        matched = [skill for skill in mandatory if _text(skill) in candidate_text]

        def dim(key: str, score: int | None, reason: str) -> MatchDimension:
            return MatchDimension(key, WEIGHTS[key], score, score is not None, reason)

        area_candidate = candidate.get('areaInteresse', {})
        area_name = area_candidate.get('nome') if isinstance(area_candidate, dict) else area_candidate
        objective = candidate.get('objetivoProfissional', {})
        options = objective.get('opcoes', []) if isinstance(objective, dict) else []
        target_role = options[0].get('cargoOuArea') if options and isinstance(options[0], dict) else candidate.get('professionalTitle')
        title = str(job.get('titulo', job.get('title', '')))
        location = job.get('localizacao', {}) if isinstance(job.get('localizacao'), dict) else {}
        remote = job.get('modalidade') == 'Remoto' or job.get('workplaceType') == 'remote'
        education = candidate.get('escolaridades', candidate.get('education', []))
        experiences = candidate.get('experiencias', candidate.get('experience', []))
        languages = candidate.get('idiomas', candidate.get('languages', []))
        certificates = candidate.get('certificados', [])
        modes = candidate.get('modalidadesPreferidas', [])

        dimensions = [
            dim('area', 10 if area_name and _text(area_name) in _text(f"{title} {job.get('descricao', '')}") else 4 if area_name else None, 'Comparação da área profissional.'),
            dim('cargo', 10 if target_role and _text(target_role) in _text(title) else 4 if target_role else None, 'Comparação com o cargo objetivo.'),
            dim('senioridade', None if not job.get('senioridadeInformada') else 10 if _text(job.get('senioridade')) in _text(options[0].get('nivelAlvo') if options else '') else 4, 'Comparação de senioridade.'),
            dim('formacao', 10 if education and job.get('formacaoRequerida') else None, 'Formação declarada versus requisito.'),
            dim('experiencia', 10 if experiences and job.get('experienciaMinimaMeses') is not None else None, 'Experiência profissional disponível.'),
            dim('competenciasTecnicas', round(len(matched) / len(mandatory) * 10) if mandatory else None, 'Cobertura das competências obrigatórias.'),
            dim('softSkills', round(sum(1 for skill in desired if _text(skill) in candidate_text) / len(desired) * 10) if desired else None, 'Cobertura de competências desejáveis.'),
            dim('competenciasTransferiveis', 5 if mandatory and not matched and experiences else None, 'Evidências transferíveis precisam de confirmação.'),
            dim('idiomas', 10 if languages and job.get('idiomasExigidos') else None, 'Idiomas declarados versus exigidos.'),
            dim('certificados', 10 if certificates and job.get('requisitosObrigatorios') else None, 'Certificados relacionados.'),
            dim('licencas', None, 'A vaga não informou licença estruturada.'),
            dim('localizacao', 10 if remote else 10 if location and candidate.get('cidade') == location.get('cidade') and candidate.get('estado') == location.get('estado') else None, 'Compatibilidade geográfica.'),
            dim('modalidade', 10 if not modes or job.get('modalidade') in modes else 0 if job.get('modalidadeInformada') else None, 'Preferência de modalidade.'),
            dim('tipoContrato', None if not job.get('tipoContrato') else 5, 'Compatibilidade contratual.'),
            dim('faixaSalarial', None, 'Pretensão salarial ainda não coletada.'),
        ]
        evaluated = [item for item in dimensions if item.evaluated and item.score is not None]
        weighted = sum((item.score or 0) * item.weight for item in evaluated)
        total_weight = sum(item.weight for item in evaluated)
        score = round(weighted / total_weight * 10) if total_weight else 0
        return {
            'jobId': job.get('id'),
            'compatibilityScore': max(0, min(100, score)),
            'dimensions': [item.__dict__ for item in dimensions],
            'matchedRequirements': matched,
            'missingRequirements': [item for item in mandatory if item not in matched],
            'confidence': round(len(evaluated) / len(dimensions) * 100),
            'algorithmVersion': 'matching-v1-django',
        }

