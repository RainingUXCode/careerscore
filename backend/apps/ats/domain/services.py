import re
from dataclasses import dataclass


@dataclass(frozen=True)
class AtsCategory:
    key: str
    name: str
    score: int
    evaluated: bool
    evidence: tuple[str, ...] = ()


@dataclass(frozen=True)
class AtsResult:
    score: int
    categories: tuple[AtsCategory, ...]
    algorithm_version: str = 'ats-v1-django'


class AtsScoringService:
    """Motor determinístico: IA não participa do cálculo da nota."""

    def evaluate(self, profile: dict, text: str | None) -> AtsResult:
        clean = re.sub(r'\s+', ' ', text or '').strip()
        lower = clean.lower()
        skills = [str(item.get('nome', item)) if isinstance(item, dict) else str(item) for item in profile.get('competencias', profile.get('skills', []))]
        education = profile.get('escolaridades', profile.get('education', []))
        languages = profile.get('idiomas', profile.get('languages', []))
        links = profile.get('links', [])
        experiences = profile.get('experiencias', profile.get('experience', []))

        def category(key: str, name: str, condition: bool, partial: bool = False, evidence: tuple[str, ...] = ()) -> AtsCategory:
            return AtsCategory(key, name, 10 if condition else 5 if partial else 0, bool(clean), evidence)

        headings = sum(1 for term in ('experiência', 'experiencia', 'formação', 'formacao', 'habilidades', 'competências', 'educação') if term in lower)
        matched_skills = tuple(skill for skill in skills if skill.lower() in lower)[:10]
        action_terms = sum(1 for term in ('desenvolvi', 'implementei', 'liderei', 'criei', 'otimizei', 'reduzi', 'aumentei') if term in lower)
        categories = (
            category('estrutura', 'Estrutura', headings >= 3, headings > 0, (f'{headings} seções reconhecidas',)),
            category('organizacao', 'Organização', len(clean) >= 400 and headings >= 2, len(clean) >= 100),
            category('palavras-chave', 'Palavras-chave', len(matched_skills) >= 3, len(matched_skills) > 0, matched_skills),
            category('tecnologias', 'Tecnologias', len(matched_skills) >= min(3, len(skills)) if skills else False, bool(matched_skills)),
            category('projetos', 'Projetos', any(term in lower for term in ('projeto', 'github.com', 'portfolio')), action_terms > 0),
            category('formacao', 'Formação', bool(education) and any(term in lower for term in ('formação', 'formacao', 'educação', 'gradu')), bool(education)),
            category('idiomas', 'Idiomas', bool(languages) and any(str(item.get('nome', item.get('language', ''))).lower() in lower for item in languages if isinstance(item, dict)), bool(languages)),
            category('links', 'Links', bool(links) and ('http' in lower or '@' in lower), bool(links)),
            category('legibilidade', 'Legibilidade', 400 <= len(clean) <= 12000, 100 <= len(clean) < 400),
            category('clareza', 'Clareza', action_terms >= 3, action_terms > 0, (f'{action_terms} verbos de ação encontrados',)),
        )
        evaluated = [item for item in categories if item.evaluated]
        score = round(sum(item.score for item in evaluated) / len(evaluated) * 10) if evaluated else 0
        return AtsResult(score=max(0, min(100, score)), categories=categories)

