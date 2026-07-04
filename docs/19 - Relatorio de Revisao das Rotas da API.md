# 19 - Relatorio de Revisao das Rotas da API

## 1. Objetivo

Revisar todas as rotas da API para identificar padroes atuais, inconsistencias, endpoints duplicados, endpoints legados e oportunidades de padronizacao.

Esta revisao nao altera regras de negocio, banco de dados, services, importacao, classificacao ou comportamento. O foco e documentar o estado atual e propor um padrao oficial para uma futura refatoracao segura.

## 2. Visao geral da API atual

Backend atual:

- Node.js;
- Express;
- TypeScript;
- Prisma;
- Zod em parte das rotas;
- Multer para upload;
- Base path atual: `/api`;
- Sem versionamento explicito;
- Sem controllers separados;
- Rotas chamam services diretamente e, em alguns casos, tambem acessam Prisma diretamente.

Arquivos de rotas:

| Arquivo | Base path | Responsabilidade atual |
| --- | --- | --- |
| `backend/src/routes/FinanceRoutes.ts` | `/api` | Dashboard, lancamentos, contas, cartoes, categorias, relatorios, conciliacao, configuracoes financeiras e busca. |
| `backend/src/routes/ImportRoutes.ts` | `/api/imports` | Importacao individual, lote e fluxo inteligente. |
| `backend/src/routes/AiRoutes.ts` | `/api/ai` | Chat, historico, contexto, recomendacoes e configuracoes da IA. |

Health check:

| Metodo | Endpoint | Observacao |
| --- | --- | --- |
| `GET` | `/api/health` | Endpoint simples, retorna `{ ok: true }`. |

## 3. Mapa completo de endpoints

### 3.1 FinanceRoutes

| Metodo | Endpoint final | Uso atual | Observacao |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard` | Usado pelo frontend | Dashboard mensal/legado. |
| `GET` | `/api/executive-dashboard` | Usado pelo frontend | Dashboard executivo. Nome nao segue padrao REST por recurso. |
| `GET` | `/api/analytics-dashboard` | Nao identificado no frontend atual | Possivel endpoint novo de analytics ainda nao consumido ou preparado. |
| `GET` | `/api/transactions` | Nao identificado no frontend atual | Endpoint consolidado/legado, sobrepoe `financial-entries`. |
| `GET` | `/api/financial-entries` | Usado pelo frontend | Listagem principal de lancamentos. |
| `POST` | `/api/financial-entries` | Usado pelo frontend | Criacao manual de lancamento. |
| `GET` | `/api/financial-entries/:id` | Nao identificado no frontend atual | Detalhe individual. |
| `PATCH` | `/api/financial-entries/:id` | Usado pelo frontend | Atualizacao de lancamento/status. |
| `DELETE` | `/api/financial-entries/:id` | Usado pelo frontend | Nao remove fisicamente; ignora lancamento. Semantica REST divergente. |
| `GET` | `/api/categories` | Usado pelo frontend | Lista categorias com subcategorias. |
| `POST` | `/api/categories` | Nao identificado no frontend atual | Cria categoria diretamente via Prisma. |
| `GET` | `/api/accounts` | Usado no painel financeiro | Lista contas. |
| `POST` | `/api/accounts` | Usado no painel financeiro | Cria conta. |
| `PATCH` | `/api/accounts/:id` | Nao identificado no frontend atual | Atualiza conta. |
| `DELETE` | `/api/accounts/:id` | Nao identificado no frontend atual | Arquiva conta, nao remove fisicamente. |
| `GET` | `/api/cards` | Usado no painel financeiro | Lista cartoes. |
| `POST` | `/api/cards` | Usado no painel financeiro | Cria cartao. |
| `PATCH` | `/api/cards/:id` | Nao identificado no frontend atual | Atualiza cartao. |
| `DELETE` | `/api/cards/:id` | Nao identificado no frontend atual | Arquiva cartao, nao remove fisicamente. |
| `GET` | `/api/payment-methods` | Usado no painel financeiro | Lista formas de pagamento. |
| `POST` | `/api/payment-methods` | Usado no painel financeiro | Faz upsert, mas metodo sugere apenas criacao. |
| `GET` | `/api/tags` | Nao identificado no frontend atual | Lista tags. |
| `POST` | `/api/tags` | Nao identificado no frontend atual | Cria tag. |
| `GET` | `/api/saved-filters` | Usado no painel financeiro | Lista filtros salvos. |
| `POST` | `/api/saved-filters` | Usado no painel financeiro | Cria filtro salvo. |
| `GET` | `/api/recurring-entries` | Usado no painel financeiro | Lista recorrencias. |
| `POST` | `/api/recurring-entries` | Usado no painel financeiro | Cria recorrencia. |
| `POST` | `/api/transfers` | Nao identificado no frontend atual | Cria transferencia com dois lancamentos. |
| `GET` | `/api/search` | Usado no painel financeiro | Busca global. |
| `PATCH` | `/api/transactions/:source/:id` | Nao identificado no frontend atual | Endpoint legado de classificacao/edicao. O parametro `source` nao e usado. |
| `GET` | `/api/reports/uber` | Usado pelo frontend | Relatorio especifico de Uber. |
| `GET` | `/api/reports/farm-personal` | Nao identificado no frontend atual | Relatorio pessoal/fazenda. |
| `POST` | `/api/reconcile` | Nao identificado no frontend atual | Acao de conciliacao; rota verbal. |
| `GET` | `/api/reconciliations` | Nao identificado no frontend atual | Lista pagamentos de cartao para conciliacao. |

### 3.2 ImportRoutes

| Metodo | Endpoint final | Uso atual | Observacao |
| --- | --- | --- | --- |
| `POST` | `/api/imports/smart/preview` | Usado pelo frontend | Fluxo principal de importacao inteligente em lote. |
| `POST` | `/api/imports/smart/confirm` | Usado pelo frontend | Confirma lote inteligente. |
| `GET` | `/api/imports/smart/history` | Usado pelo frontend | Historico de importacoes inteligentes. |
| `POST` | `/api/imports/batch/preview` | Usado pelo frontend | Fluxo de lote anterior/paralelo ao smart. |
| `POST` | `/api/imports/batch/confirm` | Usado pelo frontend | Confirma lote anterior/paralelo ao smart. |
| `POST` | `/api/imports/account/preview` | Usado pelo frontend | Previa individual de conta. |
| `POST` | `/api/imports/account` | Usado pelo frontend | Importacao individual de conta. |
| `POST` | `/api/imports/card/preview` | Usado pelo frontend | Previa individual de cartao. |
| `POST` | `/api/imports/card` | Usado pelo frontend | Importacao individual de cartao. |

### 3.3 AiRoutes

| Metodo | Endpoint final | Uso atual | Observacao |
| --- | --- | --- | --- |
| `POST` | `/api/ai/chat` | Usado pelo frontend | Envia mensagem e recebe resposta. |
| `GET` | `/api/ai/history` | Usado pelo frontend | Lista conversas ou busca conversa por query param. |
| `GET` | `/api/ai/context` | Usado pelo frontend | Retorna contexto financeiro para IA. |
| `GET` | `/api/ai/recommendations` | Usado pelo frontend | Lista recomendacoes. |
| `GET` | `/api/ai/settings` | Usado pelo frontend | Busca configuracoes. |
| `PATCH` | `/api/ai/settings` | Usado pelo frontend | Atualiza configuracoes. |

## 4. Analise REST

### Pontos positivos

- A maior parte dos recursos usa substantivos no plural: `accounts`, `cards`, `categories`, `financial-entries`.
- Operacoes basicas usam metodos HTTP adequados em varios pontos:
  - `GET` para listagem;
  - `POST` para criacao;
  - `PATCH` para atualizacao parcial;
  - `DELETE` para arquivar/ignorar.
- Uploads usam `POST`, que e adequado.
- Criacoes principais retornam `201` em alguns endpoints.

### Inconsistencias

| Tema | Situacao atual | Risco |
| --- | --- | --- |
| Rotas verbais | `/reconcile`, `/imports/*/preview`, `/imports/*/confirm`, `/ai/chat` | Aceitavel para acoes, mas precisa padrao oficial de actions. |
| Dashboards como recursos soltos | `/dashboard`, `/executive-dashboard`, `/analytics-dashboard` | Dificulta versionamento e descoberta. |
| Duplicidade conceitual | `/transactions` e `/financial-entries` | Pode gerar confusao sobre fonte oficial de lancamentos. |
| `DELETE` nao remove | `DELETE /financial-entries/:id`, `DELETE /accounts/:id`, `DELETE /cards/:id` arquivam/ignoram | Semantica pode confundir integracoes futuras. |
| Upsert em `POST` | `POST /payment-methods` cria ou atualiza | Metodo nao comunica bem o comportamento. |
| Parametro nao utilizado | `/transactions/:source/:id` recebe `source`, mas usa apenas `id` | Sinal forte de endpoint legado. |
| Prisma direto na rota | Categorias, reconciliations e patch legado de transactions | Mistura controller, regra e persistencia. |

## 5. Versionamento

### Estado atual

A API nao possui versionamento. Todos os endpoints estao sob:

```text
/api
```

### Padrao recomendado

Adotar versionamento explicito:

```text
/api/v1
```

Sugestao de estrutura:

| Atual | Recomendado |
| --- | --- |
| `/api/financial-entries` | `/api/v1/transactions` ou `/api/v1/financial-entries` |
| `/api/imports/smart/preview` | `/api/v1/imports/preview` |
| `/api/imports/smart/confirm` | `/api/v1/imports/:batchId/confirm` |
| `/api/analytics-dashboard` | `/api/v1/analytics/dashboard` |
| `/api/reports/uber` | `/api/v1/reports/uber` |
| `/api/ai/chat` | `/api/v1/ai/chat` |

Recomendacao: criar `/api/v1` mantendo `/api` como compatibilidade por uma fase de transicao.

## 6. Nomenclatura

### Padrao atual

O sistema mistura:

- Ingles: `accounts`, `cards`, `payment-methods`, `saved-filters`;
- Conceito de dominio em ingles composto: `financial-entries`;
- Relatorios especificos: `reports/uber`, `reports/farm-personal`;
- Acoes: `reconcile`, `confirm`, `preview`;
- Dashboards como nomes diretos.

### Padrao recomendado

Usar nomes em ingles, kebab-case, plural para recursos:

| Tipo | Padrao |
| --- | --- |
| Recursos | `/transactions`, `/accounts`, `/cards`, `/categories`, `/imports`, `/reports` |
| Sub-recursos | `/imports/:batchId/files`, `/accounts/:id/transactions` |
| Acoes inevitaveis | `/imports/:batchId/confirm`, `/transactions/:id/ignore` |
| Analytics | `/analytics/dashboard`, `/analytics/cash-flow`, `/analytics/categories` |
| IA | `/ai/conversations`, `/ai/conversations/:id/messages`, `/ai/recommendations` |

## 7. Payload

### Estado atual

Ha validacao com Zod em:

- `POST /financial-entries`;
- `PATCH /financial-entries/:id`;
- `PATCH /transactions/:source/:id`;
- `POST /categories`;
- `POST /ai/chat`.

Ha payload livre em:

- contas;
- cartoes;
- formas de pagamento;
- tags;
- filtros salvos;
- recorrencias;
- transferencia;
- configuracoes de IA;
- confirmacoes de importacao.

### Risco

Payloads livres permitem campos inesperados, coercao silenciosa e respostas inconsistentes de erro. Isso dificulta manutencao e integracoes futuras.

### Padrao recomendado

Criar validators/DTOs por rota:

```text
backend/src/validators
backend/src/dtos
```

Formato recomendado:

```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

Para criacao/edicao:

```json
{
  "name": "Nubank",
  "type": "Conta Corrente",
  "initialBalance": 0
}
```

Para erro de validacao:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload invalido.",
    "details": [
      { "field": "name", "message": "Campo obrigatorio." }
    ]
  }
}
```

## 8. Response

### Estado atual

As respostas retornam diretamente o resultado do service ou Prisma:

- arrays puros;
- objetos de dominio;
- mensagens simples em erro manual;
- objetos agregados sem envelope;
- respostas com `message` em erro.

### Problemas

- Sem envelope padrao;
- Sem `meta`;
- Sem paginacao;
- Sem `requestId`;
- Erros de Zod caem como `500` pelo middleware atual;
- `findUniqueOrThrow` tende a cair como `500`, nao `404`;
- Upload sem arquivo retorna `400` manual, mas com formato diferente dos demais erros.

### Padrao recomendado

Sucesso:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-04T00:00:00.000Z"
  }
}
```

Lista paginada:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

Erro:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Registro nao encontrado.",
    "details": []
  }
}
```

## 9. Status HTTP

### Estado atual

| Situacao | Status atual |
| --- | --- |
| Listagem | `200` |
| Criacao de lancamento/conta/cartao/etc. | `201` em varios endpoints |
| Criacao de categoria | `200` |
| Confirmacao de importacao | `200` |
| Upload sem arquivo | `400` |
| Erros de validacao Zod | Provavelmente `500` pelo middleware atual |
| Registro nao encontrado | Provavelmente `500` pelo middleware atual |
| Erros inesperados | `500` |

### Padrao recomendado

| Situacao | Status recomendado |
| --- | --- |
| Listagem/detalhe | `200 OK` |
| Criacao | `201 Created` |
| Atualizacao | `200 OK` ou `204 No Content` |
| Arquivar/ignorar | `200 OK` com recurso atualizado |
| Validacao | `400 Bad Request` ou `422 Unprocessable Entity` |
| Nao autenticado futuro | `401 Unauthorized` |
| Sem permissao futuro | `403 Forbidden` |
| Nao encontrado | `404 Not Found` |
| Conflito/duplicidade | `409 Conflict` |
| Upload muito grande | `413 Payload Too Large` |
| Erro interno | `500 Internal Server Error` |

## 10. Tratamento de erros

### Estado atual

Middleware atual:

```ts
res.status(500).json({ message: error instanceof Error ? error.message : "Erro inesperado" });
```

### Problemas

- Todo erro vira `500`;
- Erros de validacao nao sao tratados como `400/422`;
- Erros Prisma de registro nao encontrado nao viram `404`;
- Erros de unicidade nao viram `409`;
- Mensagem tecnica pode vazar para frontend;
- Nao ha codigo de erro padronizado.

### Padrao recomendado

Criar:

- `AppError`;
- `ValidationError`;
- `NotFoundError`;
- `ConflictError`;
- `UnauthorizedError` futuro;
- `errorHandler` com mapeamento Zod/Prisma.

Formato:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Registro duplicado.",
    "details": []
  }
}
```

## 11. Paginacao

### Estado atual

Nao ha paginacao padronizada nos endpoints principais.

Endpoints que podem crescer muito:

- `GET /financial-entries`;
- `GET /transactions`;
- `GET /imports/smart/history`;
- `GET /accounts`;
- `GET /cards`;
- `GET /recurring-entries`;
- `GET /ai/history`;
- `GET /reports/*` dependendo do periodo.

### Padrao recomendado

Query params:

```text
page=1
pageSize=25
```

Limites:

- `pageSize` padrao: `25`;
- `pageSize` maximo: `100`.

Resposta:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

## 12. Filtros

### Estado atual

Filtros existem principalmente em:

- `GET /dashboard?month=`;
- `GET /analytics-dashboard?month=&range=&account=&card=&category=&type=&institution=&tag=`;
- `GET /transactions?month=&source=&q=`;
- `GET /financial-entries?month=&source=&q=&category=&subcategory=&type=&nature=&status=&origin=&institution=&account=&card=`;
- `GET /reports/uber?month=`;
- `GET /reports/farm-personal?month=`;
- `GET /search?q=`.

### Problemas

- Filtros nao sao validados;
- Datas/competencias possuem formatos mistos;
- `type` e `nature` podem se sobrepor;
- `source` usa `Conta`/`Cartao`, enquanto importacao usa `account`/`card` em alguns mapeamentos internos;
- Sem padrao para campos multi-valor;
- Sem padrao para `from`/`to`.

### Padrao recomendado

Para lancamentos:

```text
GET /api/v1/transactions?startDate=2026-01-01&endDate=2026-01-31&type=expense&status=pending&accountId=1&cardId=2&categoryId=3&q=mercado&page=1&pageSize=25&sort=-date
```

Filtros padrao:

| Query | Uso |
| --- | --- |
| `startDate` | Data inicial ISO. |
| `endDate` | Data final ISO. |
| `competence` | Competencia `MM/YYYY` quando fizer sentido. |
| `type` | Receita, despesa, transferencia ou ajuste. |
| `source` | Conta, cartao, manual, importado. |
| `status` | pending, paid, reviewed, ignored etc. |
| `accountId` | Conta vinculada. |
| `cardId` | Cartao vinculado. |
| `categoryId` | Categoria vinculada. |
| `q` | Busca textual. |

## 13. Ordenacao

### Estado atual

Ordenacao esta fixa nos services:

- transacoes por data desc;
- contas/cartoes por nome asc;
- recorrencias por proxima data asc;
- historicos por criacao/importacao.

Nao ha query param de ordenacao.

### Padrao recomendado

Parametro:

```text
sort=date
sort=-date
sort=amount
sort=-amount
```

Para multiplos campos:

```text
sort=-date,description
```

Campos permitidos devem ser whitelistados por endpoint.

## 14. Endpoints duplicados ou sobrepostos

| Endpoint | Sobreposicao | Recomendacao |
| --- | --- | --- |
| `/api/transactions` | Sobrepoe `/api/financial-entries` | Definir um unico recurso oficial. Recomenda-se `transactions` ou `financial-entries`, nao ambos. |
| `/api/transactions/:source/:id` | Edita/classifica o mesmo conceito de `/financial-entries/:id` | Migrar comportamento para `PATCH /financial-entries/:id` ou action especifica. |
| `/api/dashboard`, `/api/executive-dashboard`, `/api/analytics-dashboard` | Tres dashboards sem hierarquia clara | Agrupar em `/analytics/dashboard`, `/analytics/executive`, `/analytics/legacy`. |
| `/api/imports/smart/*` e `/api/imports/batch/*` | Dois fluxos de lote paralelos | Tornar smart o fluxo principal e manter batch como legado temporario. |
| `/api/imports/account/*` e `/api/imports/card/*` | Fluxos individuais separados | Futuramente unificar em `/imports/preview` com deteccao automatica. |
| `/api/reconcile` e `/api/reconciliations` | Acao e listagem soltas | Agrupar em `/reconciliations` e `/reconciliations/run`. |

## 15. Endpoints legados ou candidatos a depreciacao

| Endpoint | Motivo | Acao recomendada |
| --- | --- | --- |
| `GET /api/transactions` | Historico consolidado anterior ao conceito principal de lancamentos. | Deprecar apos migrar frontend para endpoint oficial. |
| `PATCH /api/transactions/:source/:id` | Parametro `source` nao usado e regra inline na rota. | Migrar para service/controller de lancamentos. |
| `GET /api/dashboard` | Dashboard mensal legado. | Manter por compatibilidade e mover para `/analytics/dashboard/legacy`. |
| `GET /api/executive-dashboard` | Nome especifico fora de grupo. | Mover para `/analytics/executive-dashboard`. |
| `GET /api/analytics-dashboard` | Nome especifico fora de grupo. | Mover para `/analytics/dashboard`. |
| `POST /api/imports/batch/*` | Fluxo paralelo ao smart import. | Deprecar quando smart virar fluxo unico. |
| `POST /api/imports/account` e `/api/imports/card` | Fluxo individual separado por tipo. | Manter temporariamente; evoluir para importacao unificada. |

## 16. Acesso direto ao Prisma nas rotas

Rotas com Prisma direto:

- `GET /api/categories`;
- `POST /api/categories`;
- `PATCH /api/transactions/:source/:id`;
- `GET /api/reconciliations`;
- partes de `reports/farm-personal` usam service para buscar transacoes, mas fazem agregacao dentro da rota.

Risco:

- Controller vira service;
- Regras ficam espalhadas;
- Mais dificil testar;
- Mais dificil padronizar payload/response;
- Maior chance de comportamento divergente.

Recomendacao:

- Criar `CategoryService`;
- Criar `ReconciliationService`;
- Mover classificacao manual de `/transactions/:source/:id` para `TransactionService` ou `ClassificationService`;
- Mover agregacao `farm-personal` para `ReportService`.

## 17. Padrao oficial sugerido para a API

### 17.1 Estrutura de rotas

```text
/api/v1
  /health
  /transactions
  /imports
  /accounts
  /cards
  /categories
  /payment-methods
  /tags
  /recurring-entries
  /saved-filters
  /analytics
  /reports
  /reconciliations
  /ai
  /search
```

### 17.2 Controllers

Criar controllers para retirar responsabilidade das rotas:

```text
backend/src/controllers
  TransactionController.ts
  ImportController.ts
  AccountController.ts
  CardController.ts
  CategoryController.ts
  AnalyticsController.ts
  ReportController.ts
  ReconciliationController.ts
  AiController.ts
```

Rotas devem apenas:

1. receber request;
2. validar params/query/body;
3. chamar controller ou service;
4. retornar response padronizada.

### 17.3 Validators

Criar validators:

```text
backend/src/validators
  TransactionValidator.ts
  ImportValidator.ts
  AccountValidator.ts
  CardValidator.ts
  CategoryValidator.ts
  PaginationValidator.ts
  SortValidator.ts
```

### 17.4 Response helpers

Criar helpers:

```text
ok(res, data, meta?)
created(res, data, meta?)
noContent(res)
paginated(res, data, pagination)
```

### 17.5 Error helpers

Criar:

```text
AppError
errorMiddleware
notFoundMiddleware
asyncHandler
```

## 18. Proposta de endpoints futuros

### Transactions

```text
GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id
POST   /api/v1/transactions/:id/ignore
POST   /api/v1/transactions/:id/review
POST   /api/v1/transfers
```

### Imports

```text
GET    /api/v1/imports
POST   /api/v1/imports/preview
POST   /api/v1/imports/:batchId/confirm
DELETE /api/v1/imports/:batchId/files/:fileId
GET    /api/v1/imports/:batchId
```

### Analytics

```text
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/cash-flow
GET /api/v1/analytics/categories
GET /api/v1/analytics/accounts
GET /api/v1/analytics/cards
```

### Reports

```text
GET /api/v1/reports/uber
GET /api/v1/reports/farm-personal
GET /api/v1/reports/categories
GET /api/v1/reports/cards
```

### Reconciliations

```text
GET  /api/v1/reconciliations
POST /api/v1/reconciliations/run
POST /api/v1/reconciliations/:id/confirm
```

### AI

```text
GET   /api/v1/ai/conversations
POST  /api/v1/ai/conversations
GET   /api/v1/ai/conversations/:id
POST  /api/v1/ai/conversations/:id/messages
GET   /api/v1/ai/context
GET   /api/v1/ai/recommendations
GET   /api/v1/ai/settings
PATCH /api/v1/ai/settings
```

## 19. Plano de padronizacao sem quebrar o sistema

### Fase 1 - Infraestrutura sem mudar comportamento

1. Criar `asyncHandler`.
2. Criar helpers de resposta.
3. Criar `AppError`.
4. Melhorar `errorMiddleware` para Zod e Prisma.
5. Criar validators compartilhados de query, paginacao e ordenacao.
6. Manter endpoints atuais funcionando.

### Fase 2 - Controllers

1. Extrair handlers de `FinanceRoutes`.
2. Extrair handlers de `ImportRoutes`.
3. Extrair handlers de `AiRoutes`.
4. Remover Prisma direto das rotas.

### Fase 3 - Versionamento

1. Criar `/api/v1`.
2. Montar novas rotas versionadas.
3. Manter `/api` como alias temporario.
4. Atualizar frontend para `/api/v1`.

### Fase 4 - Depreciacao controlada

1. Marcar endpoints legados com header:

```text
Deprecation: true
Sunset: <data futura>
```

2. Registrar no documento de API.
3. Remover somente depois que o frontend nao depender mais deles.

### Fase 5 - Paginacao e filtros

1. Adicionar paginacao primeiro em `transactions` e historico de importacoes.
2. Padronizar filtros de periodo.
3. Adicionar ordenacao com whitelist.

## 20. Cuidados tecnicos

Arquivos sensiveis:

- `backend/src/routes/FinanceRoutes.ts`;
- `backend/src/routes/ImportRoutes.ts`;
- `backend/src/routes/AiRoutes.ts`;
- `backend/src/middlewares/ErrorMiddleware.ts`;
- `frontend/src/shared/services/api.ts`;
- componentes que consomem diretamente endpoints atuais.

Riscos principais:

- Quebrar frontend ao mudar nomes de endpoints;
- Alterar status HTTP esperado por componentes;
- Alterar formato de resposta sem adaptar consumidores;
- Mudar semantica de `DELETE`, que hoje arquiva/ignora;
- Remover endpoints aparentemente legados que ainda podem ser usados manualmente ou em fluxo futuro;
- Padronizar imports sem preservar upload multipart/form-data.

Mitigacao:

- Introduzir `/api/v1` em paralelo;
- Usar testes de smoke para endpoints principais;
- Atualizar frontend em pequenas etapas;
- Criar camada de compatibilidade temporaria;
- Documentar endpoints deprecated antes de remover.

## 21. Conclusao

A API atual funciona, mas cresceu de forma organica acompanhando as fases do produto. O maior ponto de atencao e a mistura de endpoints novos, legados e experimentais no mesmo namespace `/api`, sem versionamento e sem formato padrao de resposta/erro.

A recomendacao principal e padronizar sem quebrar: criar infraestrutura comum de controllers, validators, response helpers e error handling, depois introduzir `/api/v1` em paralelo. Somente apos o frontend migrar para os endpoints oficiais os endpoints legados devem ser removidos.
