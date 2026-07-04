# 15 - API Guide

## 1. Proposito do Documento

Este documento e o guia oficial das APIs do sistema.

Ele documenta:

- endpoints existentes;
- payloads;
- responses;
- erros;
- filtros;
- ordenacao;
- paginacao;
- versionamento;
- boas praticas;
- padrao oficial para futuras APIs.

Este documento nao altera codigo. Ele descreve o estado atual e define convencoes para evolucao.

## 2. Visao Geral

A API atual e uma API REST em Node.js com Express.

Base local:

```text
http://localhost:3333/api
```

Principais grupos:

```text
/api/health
/api/imports
/api/ai
/api/dashboard
/api/analytics-dashboard
/api/transactions
/api/financial-entries
/api/categories
/api/accounts
/api/cards
/api/payment-methods
/api/tags
/api/saved-filters
/api/recurring-entries
/api/transfers
/api/search
/api/reports
/api/reconcile
/api/reconciliations
```

## 3. Stack da API

### Node.js

Runtime do backend.

### Express

Framework HTTP usado para rotas, middlewares, CORS, JSON body e tratamento de erros.

### Prisma

ORM usado para persistencia no banco.

### Zod

Validador usado em alguns endpoints para validar payloads.

### Multer

Middleware usado para upload de arquivos CSV, XLS e XLSX.

### SQLite

Banco atual do projeto.

## 4. Convencoes Atuais

### Formato de dados

APIs comuns usam JSON:

```http
Content-Type: application/json
```

APIs de importacao usam multipart:

```http
Content-Type: multipart/form-data
```

### Prefixo

Todas as rotas passam pelo prefixo:

```text
/api
```

### Datas

Padroes aceitos no sistema:

- `YYYY-MM-DD` para datas de lancamento;
- `YYYY-MM` para filtros de mes vindos do frontend;
- `MM/YYYY` como competencia interna em varias respostas.

### Valores monetarios

Valores podem chegar como numero ou string em alguns endpoints.

Exemplos:

```json
{
  "amount": 120.5
}
```

```json
{
  "amount": "120,50"
}
```

Internamente o backend normaliza para numero decimal.

### Status HTTP usados

- `200` para sucesso comum.
- `201` para criacao.
- `400` para arquivo/lote ausente em importacoes.
- `500` para erro inesperado ou erro repassado pelo middleware atual.

## 5. Tratamento de Erros Atual

O middleware global retorna:

```json
{
  "message": "Descricao do erro"
}
```

Exemplo:

```json
{
  "message": "Arquivo nao enviado."
}
```

### Pontos de atencao

Atualmente validacoes Zod tambem caem no handler global e podem retornar `500`.

Padrao futuro recomendado:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload invalido.",
    "details": [
      {
        "field": "date",
        "message": "Campo obrigatorio."
      }
    ]
  }
}
```

## 6. Paginacao

### Estado atual

A maioria dos endpoints atuais nao possui paginacao formal.

Alguns limites existem diretamente nos servicos:

- busca global retorna ate 20 lancamentos;
- busca global retorna ate 10 contas, cartoes e categorias;
- historico de importacoes retorna ate 30 lotes;
- recorrencias no analytics retornam ate 20 itens.

### Padrao futuro

Todo endpoint de lista deve aceitar:

```text
page
pageSize
```

Response recomendado:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 130,
    "totalPages": 6
  }
}
```

Valores padrao recomendados:

- `page`: `1`
- `pageSize`: `25`
- limite maximo: `100`

## 7. Filtros

### Padrao atual

Filtros sao enviados por query string.

Exemplo:

```http
GET /api/financial-entries?month=2026-07&category=Alimentacao&status=pending
```

### Padrao futuro

Filtros devem continuar em query string para consultas simples.

Para relatorios complexos, pode ser usado `POST /reports/.../query` futuramente.

Nomes recomendados:

- `month`
- `startDate`
- `endDate`
- `q`
- `category`
- `subcategory`
- `type`
- `nature`
- `status`
- `origin`
- `institution`
- `account`
- `card`
- `tag`

## 8. Ordenacao

### Estado atual

A ordenacao e definida no backend por endpoint.

Exemplos:

- lancamentos: data decrescente;
- contas: nome crescente;
- cartoes: nome crescente;
- categorias: nome crescente;
- historico de importacao: criacao decrescente;
- recorrencias: proxima data crescente.

### Padrao futuro

Endpoints de lista devem aceitar:

```text
sortBy
sortDir
```

Exemplo:

```http
GET /api/financial-entries?sortBy=date&sortDir=desc
```

Valores permitidos para `sortDir`:

- `asc`
- `desc`

## 9. Versionamento

### Estado atual

A API atual nao possui versionamento na URL.

Padrao atual:

```text
/api/financial-entries
```

### Padrao futuro recomendado

Quando houver consumo externo, aplicativo mobile ou integracoes, adotar:

```text
/api/v1/financial-entries
```

Regras:

- mudancas compativeis podem permanecer na mesma versao;
- mudancas que removem campos exigem nova versao;
- manter versao antiga durante janela de migracao;
- documentar deprecacoes.

## 10. Health Check

## GET /api/health

Verifica se a API esta ativa.

### Payload

Nao possui.

### Response

```json
{
  "ok": true
}
```

### Erros

Nao ha erros especificos previstos.

## 11. Dashboard

## GET /api/dashboard

Retorna dados consolidados do dashboard mensal legado.

### Query params

```text
month?: string
```

Exemplo:

```http
GET /api/dashboard?month=2026-07
```

### Response

Objeto com indicadores consolidados do mes.

Formato depende do `reportService.dashboard`.

### Boas praticas

- Usar para compatibilidade.
- Preferir `/api/analytics-dashboard` para Dashboard Executivo.

## GET /api/executive-dashboard

Retorna consolidacao executiva legada.

### Payload

Nao possui.

### Response

Objeto consolidado para painel executivo.

### Boas praticas

- Endpoint de apoio.
- Pode ser unificado futuramente ao analytics.

## GET /api/analytics-dashboard

Retorna a camada principal de analytics do Dashboard Executivo.

### Query params

```text
month?: string
range?: "7d" | "30d" | "90d" | "12m"
account?: string
card?: string
category?: string
type?: string
institution?: string
tag?: string
```

Exemplo:

```http
GET /api/analytics-dashboard?month=2026-07&range=30d&category=Alimentacao
```

### Response

```json
{
  "filters": {
    "accounts": [],
    "cards": [],
    "categories": [],
    "types": [],
    "institutions": [],
    "tags": []
  },
  "summary": [
    {
      "key": "receitas",
      "title": "Receitas do mes",
      "value": 1000,
      "variation": 12.5,
      "sparkline": [100, 200],
      "tone": "green"
    }
  ],
  "flow": [
    {
      "period": "2026-07-01",
      "receitas": 1000,
      "despesas": 600,
      "resultado": 400
    }
  ],
  "categories": {},
  "accounts": [],
  "creditCards": [],
  "calendar": {
    "upcoming": [],
    "overdue": []
  },
  "top": {
    "expenses": [],
    "revenues": [],
    "establishments": [],
    "categories": []
  },
  "indicators": {}
}
```

### Erros

- `500` em falhas de consulta ou processamento.

### Observacoes

- Possui cache interno de 45 segundos por conjunto de filtros.
- Todos os indicadores partem de `financialTransaction`.

## 12. Lancamentos Consolidados

## GET /api/transactions

Retorna transacoes consolidadas no formato legado de movimentacoes.

### Query params

```text
month?: string
source?: string
q?: string
```

Exemplo:

```http
GET /api/transactions?month=2026-07&source=Conta&q=uber
```

### Response

Array de transacoes consolidadas.

### Boas praticas

- Usar preferencialmente `/api/financial-entries` para o historico unico.
- Manter para compatibilidade.

## 13. Financial Entries

## GET /api/financial-entries

Lista o historico unico de lancamentos financeiros.

### Query params

```text
month?: string
source?: string
q?: string
category?: string
subcategory?: string
type?: string
nature?: string
status?: string
origin?: string
institution?: string
account?: string
card?: string
```

Exemplo:

```http
GET /api/financial-entries?month=2026-07&status=pending&origin=Pessoal
```

### Response

```json
[
  {
    "id": "uuid",
    "rawId": "uuid",
    "date": "2026-07-01T00:00:00.000Z",
    "month": "07/2026",
    "competence": "07/2026",
    "type": "Saida",
    "source": "Conta",
    "institution": "Nubank",
    "accountName": "Conta Nubank",
    "cardName": null,
    "description": "Supermercado",
    "normalizedDescription": "SUPERMERCADO",
    "personName": "Supermercado",
    "category": "Alimentacao",
    "subcategory": "Mercado",
    "financialNature": "Despesa",
    "origin": "Pessoal",
    "paymentMethod": "Pix",
    "amount": -120.5,
    "status": "pending",
    "statusLabel": "Pendente",
    "isInternalTransfer": false,
    "isCreditCardPayment": false,
    "isReconciled": false,
    "notes": null,
    "hash": "hash",
    "importBatchId": "batch-id",
    "importFileId": "file-id",
    "rawRecordId": "raw-id"
  }
]
```

### Ordenacao atual

`transactionDate desc`.

### Erros

- `500` em falhas de consulta.

## POST /api/financial-entries

Cria lancamento financeiro manual.

### Payload

```json
{
  "type": "Despesa",
  "date": "2026-07-01",
  "competence": "07/2026",
  "description": "Supermercado",
  "amount": "120,50",
  "accountName": "Conta Nubank",
  "cardName": null,
  "category": "Alimentacao",
  "subcategory": "Mercado",
  "paymentMethod": "Pix",
  "status": "paid",
  "origin": "Pessoal",
  "institution": "Manual",
  "notes": "Compra semanal"
}
```

### Campos obrigatorios

- `date`
- `description`
- `amount`

### Response

Retorna o lancamento criado no mesmo formato de `GET /api/financial-entries`.

### Regras

- Se `cardName` existir, `sourceType` interno vira `Cartao`.
- Sem `cardName`, `sourceType` interno vira `Conta`.
- `type` define natureza financeira.
- Se categoria nao for enviada, o sistema tenta classificar automaticamente.
- Lancamentos manuais recebem hash unico.

## GET /api/financial-entries/:id

Busca um lancamento especifico.

### Path params

```text
id: string
```

### Response

Objeto de lancamento.

### Erros

- `500` quando o registro nao existe ou ocorre erro de consulta.

## PATCH /api/financial-entries/:id

Atualiza um lancamento financeiro.

### Payload

Todos os campos sao opcionais:

```json
{
  "type": "Receita",
  "date": "2026-07-02",
  "competence": "07/2026",
  "description": "Servico prestado",
  "amount": 500,
  "accountName": "Conta Principal",
  "cardName": null,
  "category": "Receitas",
  "subcategory": "Servicos",
  "paymentMethod": "Pix",
  "status": "cleared",
  "origin": "Pessoal",
  "institution": "Manual",
  "notes": "Atualizado manualmente"
}
```

### Response

Objeto atualizado.

## DELETE /api/financial-entries/:id

Ignora um lancamento financeiro.

### Observacao

O endpoint nao remove fisicamente o registro. Ele marca como `Ignored` e remove impacto financeiro.

### Response

Objeto atualizado com status ignorado.

## 14. Categorias

## GET /api/categories

Lista categorias com subcategorias.

### Response

```json
[
  {
    "id": 1,
    "name": "Alimentacao",
    "type": "expense",
    "subcategories": []
  }
]
```

### Ordenacao

`name asc`.

## POST /api/categories

Cria categoria.

### Payload

```json
{
  "name": "Alimentacao",
  "type": "expense"
}
```

### Campos obrigatorios

- `name`

### Response

Categoria criada.

## 15. Contas

## GET /api/accounts

Lista contas.

### Response

```json
[
  {
    "id": 1,
    "name": "Conta Nubank",
    "bank": "Nubank",
    "type": "Conta Corrente",
    "initialBalance": "0",
    "currentBalance": 2500,
    "color": "#3454D1",
    "icon": null,
    "status": "Active",
    "defaultAccount": false
  }
]
```

### Observacao

`currentBalance` e calculado considerando lancamentos com impacto em fluxo de caixa.

## POST /api/accounts

Cria conta.

### Payload

```json
{
  "name": "Conta Nubank",
  "bank": "Nubank",
  "type": "Conta Corrente",
  "initialBalance": 0,
  "currentBalance": 0,
  "color": "#3454D1",
  "icon": "banknote",
  "status": "Active",
  "defaultAccount": true
}
```

### Response

Conta criada.

## PATCH /api/accounts/:id

Atualiza conta.

### Payload

Campos opcionais:

```json
{
  "name": "Conta Principal",
  "bank": "Nubank",
  "type": "Conta Corrente",
  "initialBalance": 100,
  "currentBalance": 100,
  "color": "#17202A",
  "icon": "banknote",
  "status": "Active",
  "defaultAccount": false
}
```

### Response

Conta atualizada.

## DELETE /api/accounts/:id

Arquiva conta.

### Observacao

Nao remove fisicamente. Atualiza `status` para `Archived`.

### Response

Conta atualizada.

## 16. Cartoes

## GET /api/cards

Lista cartoes.

### Response

```json
[
  {
    "id": 1,
    "name": "Nubank Credit",
    "bank": "Nubank",
    "brand": "Mastercard",
    "color": "#820AD1",
    "limitAmount": "5000",
    "availableLimit": 3200,
    "usedLimit": 1800,
    "utilization": 36,
    "closingDay": 20,
    "dueDay": 28,
    "status": "Active",
    "paymentAccountId": null
  }
]
```

### Observacao

`usedLimit`, `availableLimit` e `utilization` sao calculados com base em lancamentos de cartao.

## POST /api/cards

Cria cartao.

### Payload

```json
{
  "name": "Nubank Credit",
  "bank": "Nubank",
  "brand": "Mastercard",
  "color": "#820AD1",
  "limitAmount": 5000,
  "availableLimit": 5000,
  "closingDay": 20,
  "dueDay": 28,
  "status": "Active",
  "paymentAccountId": null
}
```

### Response

Cartao criado.

## PATCH /api/cards/:id

Atualiza cartao.

### Payload

Campos opcionais:

```json
{
  "name": "Cartao Principal",
  "bank": "Nubank",
  "brand": "Mastercard",
  "color": "#820AD1",
  "limitAmount": 6000,
  "availableLimit": 4000,
  "closingDay": 20,
  "dueDay": 28,
  "status": "Active",
  "paymentAccountId": 1
}
```

### Response

Cartao atualizado.

## DELETE /api/cards/:id

Arquiva cartao.

### Observacao

Nao remove fisicamente. Atualiza `status` para `Archived`.

### Response

Cartao atualizado.

## 17. Formas de Pagamento

## GET /api/payment-methods

Lista formas de pagamento.

### Response

```json
[
  {
    "id": 1,
    "name": "Pix",
    "type": "Transfer",
    "icon": "send",
    "color": "#16A34A",
    "status": "Active",
    "sortOrder": 1
  }
]
```

### Ordenacao

`sortOrder asc`, depois `name asc`.

## POST /api/payment-methods

Cria ou atualiza forma de pagamento.

### Payload

```json
{
  "id": 1,
  "name": "Pix",
  "type": "Transfer",
  "icon": "send",
  "color": "#16A34A",
  "status": "Active",
  "sortOrder": 1
}
```

### Regra

- Com `id`, atualiza.
- Sem `id`, cria.

### Response

Forma de pagamento criada ou atualizada.

## 18. Tags

## GET /api/tags

Lista tags.

### Response

```json
[
  {
    "id": 1,
    "name": "viagem",
    "color": "#3454D1"
  }
]
```

## POST /api/tags

Cria tag.

### Payload

```json
{
  "name": "viagem",
  "color": "#3454D1"
}
```

### Response

Tag criada.

## 19. Filtros Salvos

## GET /api/saved-filters

Lista filtros salvos.

### Response

```json
[
  {
    "id": 1,
    "name": "Gastos com Uber",
    "scope": "financial_entries",
    "filters": {
      "q": "uber"
    },
    "favorite": true,
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
]
```

## POST /api/saved-filters

Cria filtro salvo.

### Payload

```json
{
  "name": "Gastos com Uber",
  "scope": "financial_entries",
  "filters": {
    "q": "uber"
  },
  "favorite": true
}
```

### Response

Filtro salvo criado.

## 20. Recorrencias

## GET /api/recurring-entries

Lista lancamentos recorrentes.

### Response

```json
[
  {
    "id": 1,
    "name": "Internet",
    "description": "Internet residencial",
    "amount": "120",
    "frequency": "Mensal",
    "nextDate": "2026-07-10T00:00:00.000Z",
    "endDate": null,
    "status": "Active",
    "category": "Casa",
    "subcategory": "Internet",
    "accountName": "Conta Principal",
    "cardName": null,
    "paymentMethodId": 1,
    "paymentMethod": {}
  }
]
```

## POST /api/recurring-entries

Cria recorrencia.

### Payload

```json
{
  "name": "Internet",
  "description": "Internet residencial",
  "amount": 120,
  "frequency": "Mensal",
  "nextDate": "2026-07-10",
  "endDate": null,
  "status": "Active",
  "category": "Casa",
  "subcategory": "Internet",
  "accountName": "Conta Principal",
  "cardName": null,
  "paymentMethodId": 1,
  "notes": "Contrato anual"
}
```

### Response

Recorrencia criada.

## 21. Transferencias

## POST /api/transfers

Cria transferencia entre contas.

### Payload

```json
{
  "date": "2026-07-01",
  "fromAccount": "Conta Principal",
  "toAccount": "Conta Reserva",
  "amount": 500,
  "notes": "Reserva mensal"
}
```

### Response

```json
{
  "out": {},
  "incoming": {}
}
```

### Regra

Cria dois lancamentos:

- saida na conta de origem;
- entrada na conta de destino.

## 22. Busca Global

## GET /api/search

Executa busca global.

### Query params

```text
q: string
```

Exemplo:

```http
GET /api/search?q=uber
```

### Response

```json
{
  "entries": [],
  "accounts": [],
  "cards": [],
  "categories": []
}
```

### Limites atuais

- `entries`: ate 20;
- `accounts`: ate 10;
- `cards`: ate 10;
- `categories`: ate 10.

## 23. Atualizacao de Transacao Classificada

## PATCH /api/transactions/:source/:id

Atualiza classificacao de uma transacao.

### Path params

```text
source: string
id: string
```

Observacao: atualmente `source` esta na rota, mas o servico usa o `id` para buscar `financialTransaction`.

### Payload

```json
{
  "categoryId": 1,
  "subcategoryId": 2,
  "category": "Transporte",
  "subcategory": "Aplicativo",
  "financialNature": "Despesa",
  "origin": "Pessoal",
  "notes": "Revisado manualmente",
  "saveRule": true
}
```

### Response

Transacao atualizada.

### Regra

Quando `saveRule` for verdadeiro e houver categoria:

- cria feedback de classificacao;
- cria regra de classificacao baseada nas primeiras palavras da descricao normalizada.

## 24. Relatorios

## GET /api/reports/uber

Retorna relatorio de gastos com Uber.

### Query params

```text
month?: string
```

Exemplo:

```http
GET /api/reports/uber?month=2026-07
```

### Response

Objeto com consolidacao do relatorio de Uber.

## GET /api/reports/farm-personal

Retorna consolidacao por origem.

### Query params

```text
month?: string
```

### Response

```json
{
  "fazenda": {
    "entradas": 0,
    "saidas": 0
  },
  "pessoal": {
    "entradas": 0,
    "saidas": 0
  },
  "investimentos": {
    "entradas": 0,
    "saidas": 0
  }
}
```

## 25. Conciliacao

## POST /api/reconcile

Executa conciliacao de faturas.

### Payload

```json
{
  "invoiceMonth": "2026-07"
}
```

### Response

Objeto retornado por `reconcileInvoices`.

### Observacao

Atualmente tambem pode ser usado apenas para dar retorno visual de conferencia, dependendo da camada de frontend.

## GET /api/reconciliations

Lista transacoes candidatas/relacionadas a conciliacao.

### Response

Array de `financialTransaction` com:

```text
sourceType = Conta
financialNature = Transferencia
category = Cartao de Credito
```

## 26. Importacoes Inteligentes

## POST /api/imports/smart/preview

Analisa multiplos arquivos e prepara previa consolidada.

### Content-Type

```text
multipart/form-data
```

### Payload

Campo:

```text
files: File[]
```

Limite atual:

```text
50 arquivos
```

### Response

```json
{
  "importBatchId": "batch-id",
  "files": [
    {
      "importFileId": "file-id",
      "fileName": "Nubank.csv",
      "sourceType": "Cartao",
      "detectedKind": "Cartao de Credito",
      "institution": "Nubank",
      "accountName": "NubankCredit",
      "accountOrCard": "NubankCredit",
      "parser": "NubankCreditCardParser",
      "totalRows": 87,
      "validRows": 87,
      "duplicateRows": 0,
      "errorRows": 0,
      "status": "Ready",
      "duplicateStatus": "Novo registro",
      "issues": [],
      "columns": ["date", "title", "amount"],
      "mappedColumns": {
        "data_compra": "date",
        "descricao": "title",
        "valor": "amount"
      },
      "rows": []
    }
  ],
  "smartSummary": {
    "importedFiles": 1,
    "totalRecords": 87,
    "validRecords": 87,
    "duplicates": 0,
    "errors": 0,
    "revenues": 0,
    "expenses": 0,
    "transfers": 0,
    "totalAmount": 0,
    "processingTimeMs": 120
  }
}
```

### Erros

```json
{
  "message": "Nenhum arquivo enviado."
}
```

## POST /api/imports/smart/confirm

Confirma importacao inteligente.

### Payload

```json
{
  "importBatchId": "batch-id",
  "selectedFileIds": ["file-id-1", "file-id-2"]
}
```

### Campos obrigatorios

- `importBatchId`

### Response

```json
{
  "summary": {
    "totalFilesProcessed": 2,
    "totalImportedRecords": 100,
    "totalDuplicates": 3,
    "totalErrors": 0,
    "totalEntradas": 1000,
    "totalSaidas": 500,
    "totalComprasCartao": 300,
    "pendingReview": 2
  },
  "finalReport": {
    "files": 2,
    "created": 100,
    "duplicates": 3,
    "ignored": 3,
    "errors": 0,
    "totalAmount": 1800,
    "revenues": 1000,
    "expenses": 800,
    "processingTimeMs": 300
  }
}
```

### Erros

```json
{
  "message": "Lote nao informado."
}
```

## GET /api/imports/smart/history

Lista historico de importacoes.

### Response

```json
[
  {
    "id": "batch-id",
    "date": "2026-07-01T00:00:00.000Z",
    "importedAt": "2026-07-01T00:00:00.000Z",
    "files": 2,
    "fileNames": ["arquivo.csv"],
    "institutions": "Nubank",
    "quantity": 100,
    "imported": 97,
    "duplicates": 3,
    "errors": 0,
    "user": "Usuario local",
    "status": "Imported",
    "details": []
  }
]
```

### Limite atual

Retorna ate 30 lotes.

## 27. Importacoes em Lote Legadas

## POST /api/imports/batch/preview

Prepara previa de importacao em lote.

### Content-Type

```text
multipart/form-data
```

### Payload

```text
files: File[]
```

Limite atual:

```text
30 arquivos
```

### Response

```json
{
  "importBatchId": "batch-id",
  "files": [],
  "summary": {
    "totalFiles": 1,
    "validFiles": 1,
    "errorFiles": 0,
    "totalRows": 87,
    "validRows": 87,
    "duplicateRows": 0,
    "errorRows": 0
  }
}
```

## POST /api/imports/batch/confirm

Confirma lote legado.

### Payload

```json
{
  "importBatchId": "batch-id",
  "selectedFileIds": ["file-id"]
}
```

### Response

```json
{
  "summary": {
    "totalFilesProcessed": 1,
    "totalImportedRecords": 87,
    "totalDuplicates": 0,
    "totalErrors": 0,
    "totalEntradas": 0,
    "totalSaidas": 0,
    "totalComprasCartao": 1200,
    "pendingReview": 0
  }
}
```

## 28. Importacao Individual

## POST /api/imports/account/preview

Pre-visualiza extrato de conta corrente.

### Content-Type

```text
multipart/form-data
```

### Payload

```text
file: File
institution?: string
accountName?: string
```

### Response

```json
{
  "parser": "GenericAccountParser",
  "columns": ["data", "valor", "identificador", "descricao"],
  "mappedColumns": {
    "data_movimentacao": "data",
    "descricao": "descricao",
    "valor": "valor",
    "tipo_movimentacao": null,
    "origem_dados": null
  },
  "requiredFound": ["data", "descricao", "valor"],
  "missingRequired": [],
  "optionalFound": [],
  "totalRows": 70,
  "rows": []
}
```

## POST /api/imports/account

Importa extrato de conta corrente.

### Content-Type

```text
multipart/form-data
```

### Payload

```text
file: File
institution?: string
accountName?: string
```

### Response

```json
{
  "created": 70,
  "skipped": 0
}
```

## POST /api/imports/card/preview

Pre-visualiza arquivo de cartao.

### Content-Type

```text
multipart/form-data
```

### Payload

```text
file: File
invoiceMonth?: string
institution?: string
accountName?: string
```

### Response

```json
{
  "parser": "NubankCreditCardParser",
  "columns": ["date", "title", "amount"],
  "mappedColumns": {
    "data_compra": "date",
    "descricao": "title",
    "valor": "amount",
    "cartao": null,
    "competencia": "calculada"
  },
  "requiredFound": ["data_compra", "descricao", "valor"],
  "missingRequired": [],
  "optionalFound": [],
  "totalRows": 87,
  "rows": []
}
```

## POST /api/imports/card

Importa arquivo de cartao.

### Content-Type

```text
multipart/form-data
```

### Payload

```text
file: File
invoiceMonth?: string
institution?: string
accountName?: string
```

### Response

```json
{
  "created": 87,
  "skipped": 0
}
```

## 29. AI Engine

## POST /api/ai/chat

Envia mensagem ao Assistente Financeiro.

### Payload

```json
{
  "conversationId": "conversation-id",
  "message": "Quanto gastei com Uber este mes?"
}
```

### Campos obrigatorios

- `message`

### Response

```json
{
  "conversationId": "conversation-id",
  "answer": "Resposta do assistente",
  "provider": "local"
}
```

O formato exato depende do `aiEngine`.

## GET /api/ai/history

Lista conversas ou busca uma conversa especifica.

### Query params

```text
conversationId?: string
```

### Response sem `conversationId`

```json
[
  {
    "id": "conversation-id",
    "title": "Analise de gastos",
    "favorite": false,
    "updatedAt": "2026-07-01T00:00:00.000Z"
  }
]
```

### Response com `conversationId`

```json
{
  "id": "conversation-id",
  "title": "Analise de gastos",
  "favorite": false,
  "messages": [
    {
      "role": "user",
      "content": "Pergunta"
    },
    {
      "role": "assistant",
      "content": "Resposta"
    }
  ]
}
```

## GET /api/ai/context

Retorna contexto financeiro resumido para IA.

### Response

Objeto com resumo financeiro, indicadores e contexto seguro.

### Regra

Nao deve expor lancamentos brutos desnecessariamente.

## GET /api/ai/recommendations

Lista recomendacoes financeiras.

### Response

```json
[
  {
    "id": "recommendation-id",
    "title": "Reduzir gastos",
    "message": "Mensagem da recomendacao",
    "impact": 250,
    "priority": "Alta"
  }
]
```

## GET /api/ai/settings

Retorna configuracoes da IA.

### Response

Objeto de configuracoes.

## PATCH /api/ai/settings

Atualiza configuracoes da IA.

### Payload

Objeto parcial com configuracoes.

Exemplo:

```json
{
  "provider": "ollama",
  "model": "llama3",
  "enabled": true
}
```

### Response

Configuracoes atualizadas.

## 30. Catalogo Resumido de Endpoints

| Metodo | Endpoint | Objetivo |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Dashboard mensal legado |
| GET | `/api/executive-dashboard` | Dashboard executivo legado |
| GET | `/api/analytics-dashboard` | Dashboard analytics principal |
| GET | `/api/transactions` | Transacoes consolidadas legadas |
| GET | `/api/financial-entries` | Listar lancamentos |
| POST | `/api/financial-entries` | Criar lancamento manual |
| GET | `/api/financial-entries/:id` | Buscar lancamento |
| PATCH | `/api/financial-entries/:id` | Atualizar lancamento |
| DELETE | `/api/financial-entries/:id` | Ignorar lancamento |
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Criar categoria |
| GET | `/api/accounts` | Listar contas |
| POST | `/api/accounts` | Criar conta |
| PATCH | `/api/accounts/:id` | Atualizar conta |
| DELETE | `/api/accounts/:id` | Arquivar conta |
| GET | `/api/cards` | Listar cartoes |
| POST | `/api/cards` | Criar cartao |
| PATCH | `/api/cards/:id` | Atualizar cartao |
| DELETE | `/api/cards/:id` | Arquivar cartao |
| GET | `/api/payment-methods` | Listar formas de pagamento |
| POST | `/api/payment-methods` | Criar/atualizar forma de pagamento |
| GET | `/api/tags` | Listar tags |
| POST | `/api/tags` | Criar tag |
| GET | `/api/saved-filters` | Listar filtros salvos |
| POST | `/api/saved-filters` | Criar filtro salvo |
| GET | `/api/recurring-entries` | Listar recorrencias |
| POST | `/api/recurring-entries` | Criar recorrencia |
| POST | `/api/transfers` | Criar transferencia |
| GET | `/api/search` | Busca global |
| PATCH | `/api/transactions/:source/:id` | Atualizar classificacao |
| GET | `/api/reports/uber` | Relatorio Uber |
| GET | `/api/reports/farm-personal` | Relatorio Fazenda/Pessoal |
| POST | `/api/reconcile` | Conciliar faturas |
| GET | `/api/reconciliations` | Listar conciliacoes |
| POST | `/api/imports/smart/preview` | Previa inteligente |
| POST | `/api/imports/smart/confirm` | Confirmar importacao inteligente |
| GET | `/api/imports/smart/history` | Historico de importacoes |
| POST | `/api/imports/batch/preview` | Previa de lote legado |
| POST | `/api/imports/batch/confirm` | Confirmar lote legado |
| POST | `/api/imports/account/preview` | Previa conta individual |
| POST | `/api/imports/account` | Importar conta individual |
| POST | `/api/imports/card/preview` | Previa cartao individual |
| POST | `/api/imports/card` | Importar cartao individual |
| POST | `/api/ai/chat` | Chat com IA |
| GET | `/api/ai/history` | Historico de conversas |
| GET | `/api/ai/context` | Contexto da IA |
| GET | `/api/ai/recommendations` | Recomendacoes da IA |
| GET | `/api/ai/settings` | Configuracoes da IA |
| PATCH | `/api/ai/settings` | Atualizar configuracoes da IA |

## 31. Padrao Oficial para Futuras APIs

### Estrutura de rota

Usar substantivos no plural:

```text
GET /api/v1/financial-entries
POST /api/v1/accounts
PATCH /api/v1/cards/:id
DELETE /api/v1/categories/:id
```

### Padrao de response de item

```json
{
  "id": "id",
  "createdAt": "2026-07-01T00:00:00.000Z",
  "updatedAt": "2026-07-01T00:00:00.000Z"
}
```

### Padrao de response de lista

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "totalPages": 0
  },
  "filters": {}
}
```

### Padrao de erro

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Registro nao encontrado.",
    "details": []
  }
}
```

### Codigos de erro recomendados

```text
VALIDATION_ERROR
RESOURCE_NOT_FOUND
CONFLICT
DUPLICATE_RECORD
UNAUTHORIZED
FORBIDDEN
UPLOAD_ERROR
IMPORT_ERROR
INTERNAL_ERROR
```

### Status HTTP recomendados

- `200 OK`: consulta ou atualizacao bem-sucedida.
- `201 Created`: criacao bem-sucedida.
- `204 No Content`: exclusao sem body.
- `400 Bad Request`: payload invalido.
- `401 Unauthorized`: usuario nao autenticado.
- `403 Forbidden`: usuario sem permissao.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: conflito de regra ou duplicidade.
- `422 Unprocessable Entity`: validacao semantica.
- `500 Internal Server Error`: falha inesperada.

## 32. Boas Praticas

1. Validar payloads com Zod em todos os endpoints de escrita.
2. Centralizar schemas de request e response.
3. Evitar regras de negocio dentro das rotas.
4. Rotas devem chamar services.
5. Services devem concentrar regras de negocio.
6. Repositories devem ser considerados se a camada Prisma crescer.
7. Padronizar erros.
8. Padronizar paginacao.
9. Padronizar filtros.
10. Documentar novos endpoints neste guia.
11. Evitar breaking changes sem versionamento.
12. Usar nomes do Glossario Oficial.
13. Nao expor detalhes internos desnecessarios.
14. Em uploads, validar extensao, tamanho e tipo.
15. Em importacoes, preservar rastreabilidade.
16. Em IA, nao enviar dados brutos sem necessidade.
17. Em analytics, usar cache quando possivel.
18. Em endpoints financeiros, nunca alterar regra sem teste e documentacao.

## 33. Cuidados Tecnicos

### Endpoints sensiveis

Maior cuidado em:

- `/api/financial-entries`;
- `/api/imports/smart/confirm`;
- `/api/imports/batch/confirm`;
- `/api/reconcile`;
- `/api/transactions/:source/:id`;
- `/api/ai/context`.

### Riscos

- alterar filtros pode quebrar telas;
- alterar formato de lancamento pode quebrar Dashboard, tabelas e IA;
- alterar importacao pode causar duplicidade;
- alterar conciliacao pode afetar faturas;
- alterar analytics pode gerar indicadores incorretos.

## 34. Resumo

A API atual ja cobre os principais dominios do sistema:

- lancamentos;
- importacoes;
- contas;
- cartoes;
- categorias;
- recorrencias;
- transferencias;
- relatorios;
- analytics;
- assistente financeiro.

O principal ponto de evolucao tecnica e padronizar:

- erros;
- paginacao;
- versionamento;
- DTOs;
- validacoes;
- responses de lista.

Este guia deve ser usado como referencia obrigatoria para qualquer nova API ou alteracao de contrato existente.
