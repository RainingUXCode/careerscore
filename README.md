# CareerScore

Aplicação React + TypeScript com API Django REST Framework.

## Desenvolvimento

1. Crie um ambiente Python e instale `backend/requirements.txt`.
2. Copie `.env.example` para `.env` e configure apenas no servidor.
3. Instale as dependências em `frontend/`.
4. Dentro de `frontend/`, execute `npm run dev`.

O comando inicia:

- Django em `http://127.0.0.1:8000`;
- Vite em `http://127.0.0.1:5173`;
- proxy de `/api/*` do Vite para o Django.

## Rotas

- `GET /api/v1/health`
- `POST /api/v1/resumes/analyze`
- `GET /api/v1/jobs/search`
- `POST /api/v1/ats/evaluate`
- `POST /api/v1/matching/jobs`

Aliases compatíveis durante a migração:

- `GET /api/vagas`
- `POST /api/resume/analyze`

As chaves `GEMINI_API_KEY`, `GEMINI_MODEL` e `JSEARCH_API_KEY` são carregadas
exclusivamente pelo Django. Nunca use prefixos públicos como `VITE_`.

Formato de erro padronizado:

```json
{
  "error": {
    "code": "gemini_timeout",
    "message": "A análise demorou mais que o esperado.",
    "details": {}
  }
}
```

## Variáveis

- Públicas:
  - `FRONTEND_URL`
  - `VITE_API_BASE_URL`
- Secretas:
  - `DJANGO_SECRET_KEY`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `JSEARCH_API_KEY`

## Docker

Para subir com Docker:

```bash
docker compose up --build
```

Isso inicia:

- backend Django em `http://localhost:8000`
- frontend em `http://localhost:5173`
- proxy do frontend para o backend via `/api`

O SQLite fica persistido no volume `backend-data` apontando para `/data/db.sqlite3`.

## Arquitetura

Os módulos Django separam domínio puro, casos de uso, infraestrutura e
apresentação DRF. Gemini e JSearch são adapters; seus formatos externos não são
modelos de domínio. O matching e o ATS oficiais são determinísticos.
