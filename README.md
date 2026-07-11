# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Vagas reais (JSearch) — configuração

O CareerScore busca vagas reais via [JSearch](https://www.openwebninja.com/api/jsearch) (API oficial da OpenWeb Ninja), com o `MockJobProvider` sempre disponível como rede de segurança.

### 1. Obter uma chave

1. Crie uma conta gratuita em [openwebninja.com](https://www.openwebninja.com) e assine o plano gratuito da API **JSearch**.
2. Copie sua chave de API (usada no header `X-API-Key`).

### 2. Configurar a variável de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```
JSEARCH_API_KEY=sua_chave_aqui
```

**Nunca** use prefixo `VITE_`/`NEXT_PUBLIC_`/`PUBLIC_` nessa variável — isso faria a chave ser incluída no bundle enviado ao navegador. `.env` já está no `.gitignore` e nunca deve ser commitado.

Na hospedagem (ex: Vercel), configure a mesma variável no painel do projeto (Settings → Environment Variables), nunca no código.

### 3. Evitar cobrança

O plano gratuito da JSearch tem **200 requisições/mês, limite rígido** (confirmar o número exato no seu painel, pois planos podem mudar). Ao criar sua conta na OpenWeb Ninja:

- **Não** adicione um cartão de crédito ao assinar o plano gratuito.
- Confirme no painel da OpenWeb Ninja que não há upgrade automático para um plano pago configurado.
- Se a plataforma oferecer alguma opção de "hard limit"/bloqueio automático ao atingir a cota, ative-a.

O CareerScore nunca tenta contornar isso: ao receber `429` (cota excedida) da JSearch, ele automaticamente cai para vagas de demonstração e mostra um aviso — não há nenhuma lógica de "pagar para continuar".

### 4. Cache e economia de cota

- Cada busca é feita só quando o usuário conclui uma análise pela primeira vez, ou clica em "Atualizar vagas" — nunca automaticamente ao trocar de aba, editar o formulário ou recalcular o currículo.
- Resultado é cacheado no navegador (`localStorage`) por 24h, por combinação de filtros.
- A resposta do `/api/vagas` também inclui `Cache-Control: s-maxage=86400`, para que a CDN da hospedagem sirva a mesma consulta sem gastar cota nova, quando a hospedagem suportar isso.
- Se a hospedagem escolhida não garantir esse cache de CDN, o cache do navegador citado acima continua funcionando de qualquer forma.

### 5. Hospedagem da função serverless

`api/vagas.ts` foi escrito no formato de **Vercel Edge Function** (Web Standard `Request`/`Response`, sem depender do pacote `@vercel/node`). Não há hospedagem definida oficialmente para o projeto ainda — ao publicar, use a Vercel (free tier, zero configuração para este formato) ou adapte o mesmo arquivo para Netlify Functions/Cloudflare Workers, que usam a mesma assinatura de `Request`/`Response`.

### 6. Validação manual do payload real

Antes de confiar cegamente nos tipos em `src/services/providers/jsearch/types.ts`, rode `scripts/validar-jsearch.mjs` localmente com sua própria chave (ver comentário no topo do arquivo) — ele faz uma única chamada real e imprime um relatório sanitizado dos campos retornados, sem nunca expor a chave.

