# 21 - Relatorio de Performance e Gargalos da Aplicacao

## 1. Objetivo

Analisar toda a aplicacao para identificar gargalos de performance e manutencao em:

- frontend;
- backend;
- banco de dados;
- importacoes;
- dashboard;
- analytics.

Esta analise nao implementa alteracoes. O objetivo e gerar um relatorio tecnico priorizado para orientar proximas fases.

## 2. Resumo Executivo

O sistema esta funcional e ainda pequeno o suficiente para operar bem com poucos dados, mas varios pontos podem virar gargalos assim que a base crescer com importacoes reais.

Os maiores riscos estao em:

1. dashboards e analytics carregando tabelas inteiras e fazendo agregacoes em memoria;
2. importacao em lote executando consultas de classificacao e duplicidade linha a linha;
3. frontend carregando todas as telas e bibliotecas pesadas em um unico bundle;
4. tabelas de lancamentos renderizando listas completas sem virtualizacao;
5. ausencia de cache padronizado no frontend e cache limitado no backend.

Build medido do frontend:

```text
frontend/dist/assets/app.js      693315 bytes
frontend/dist/assets/app.js.map  2673425 bytes
frontend/dist/assets/styles.css  22938 bytes
```

O `app.js` e gerado como um unico bundle.

## 3. Priorizacao Geral

| Prioridade | Area | Problema | Impacto |
| --- | --- | --- | --- |
| P0 | Backend/Dashboard/Analytics | `findMany` sem limite em `financial_transactions` e agregacoes em memoria | Alto quando a base crescer |
| P0 | Importacoes | Classificacao e duplicidade consultadas linha a linha | Alto em lotes grandes |
| P1 | Frontend | Bundle unico sem lazy loading/code splitting | Carregamento inicial maior que o necessario |
| P1 | Frontend | Tabelas sem virtualizacao | Travamentos com muitos lancamentos |
| P1 | Banco | Falta de paginacao e filtros server-side completos | Trafego e memoria crescentes |
| P1 | Backend | Consultas repetidas entre dashboards carregados juntos | Trabalho duplicado por tela |
| P2 | Frontend | Re-renderizacoes por estado centralizado no `App.tsx` | Custo crescente com telas maiores |
| P2 | Backend | Services grandes com loops `filter/reduce/sort` repetidos | CPU e manutencao |
| P2 | Frontend/Backend | Cache inexistente ou parcial | Requisicoes repetidas |
| P3 | Codigo morto | Services vazios e componentes antigos | Mais ruido que gargalo imediato |

## 4. Frontend

### 4.1 Bundle unico

Classificacao: P1

Evidencia:

- `frontend/build.mjs` gera apenas `dist/assets/app.js`;
- `App.tsx` importa diretamente:
  - `FinancialAssistant`;
  - `ExecutiveAnalyticsDashboard`;
  - `ImportCenter`;
  - `FinanceManagementPanel`;
  - `TransactionsTable`;
  - `recharts`;
  - varios icones de `lucide-react`.

Impacto:

- usuario baixa codigo de Dashboard Executivo, Importacoes, Assistente IA, Configuracoes e Recharts mesmo que abra apenas uma aba;
- Recharts entra no carregamento inicial;
- crescimento futuro de features aumenta diretamente o primeiro carregamento.

Recomendacao:

- aplicar `React.lazy` por aba;
- separar chunks para:
  - dashboard/analytics;
  - importacoes;
  - assistente;
  - configuracoes;
  - relatorios;
- avaliar trocar build manual de esbuild por Vite se quiser code splitting mais ergonomico.

### 4.2 `App.tsx` muito grande e centralizador

Classificacao: P2

Evidencia:

- `frontend/src/app/App.tsx` possui cerca de 812 linhas;
- concentra estado global da tela:
  - aba ativa;
  - mes;
  - filtros;
  - dashboards;
  - lancamentos;
  - categorias;
  - relatorio Uber;
  - formulario de lancamento;
  - status de operacoes.

Impacto:

- mudancas de estado no topo podem re-renderizar partes grandes;
- funcoes inline e props extensas dificultam memoizacao;
- novas telas tendem a aumentar o acoplamento.

Recomendacao:

- dividir `App.tsx` em layout + rotas/abas;
- mover estado por feature;
- manter filtros globais em contexto leve apenas quando necessario;
- considerar `React.memo` para tabelas e cards apos medir.

### 4.3 Requisicoes iniciais excessivas no `load()`

Classificacao: P1

Evidencia:

`App.tsx` chama em paralelo:

```text
GET /executive-dashboard
GET /dashboard
GET /financial-entries
GET /categories
GET /reports/uber
```

Isso ocorre no carregamento inicial e ao alterar `month` ou `source`.

Impacto:

- mesmo se usuario estiver em "Lancamentos", "Importacoes" ou "Configuracoes", dashboards e Uber podem ser recarregados;
- o backend faz varias consultas pesadas ao mesmo tempo;
- aumenta latencia percebida.

Recomendacao:

- carregar dados por aba sob demanda;
- separar `loadDashboard`, `loadEntries`, `loadCategories`, `loadReports`;
- cachear categorias;
- nao recarregar dashboard executivo em toda mudanca de filtros da tela de lancamentos.

### 4.4 Filtros locais e server-side misturados

Classificacao: P2

Evidencia:

- `source` e `q` sao enviados para `/financial-entries`;
- `category`, `account`, `type`, `status`, `origin` sao filtrados localmente em `filteredRows`.

Impacto:

- frontend precisa receber mais linhas do que usa;
- com milhares de lancamentos, filtros locais ficam pesados;
- comportamento pode divergir do backend.

Recomendacao:

- mover todos os filtros principais para o backend;
- adicionar paginacao;
- manter filtro local apenas para refinamentos pequenos.

### 4.5 Tabelas sem virtualizacao

Classificacao: P1

Evidencia:

- `TransactionsTable` faz `rows.map`;
- `ImportTable` faz `files.map`;
- `ImportHistory` faz `history.map`;
- `ReviewDrawer` pagina 25 linhas, mas mantem `reviewRows` inteiro em estado.

Impacto:

- com muitos lancamentos, DOM cresce muito;
- inputs em tabela de revisao podem ficar lentos;
- atualizacao de uma linha em `ReviewDrawer` recria o array inteiro.

Recomendacao:

- usar virtualizacao em `TransactionsTable` e historicos grandes;
- manter paginacao server-side em lancamentos;
- para revisao de importacao, editar por ID/mapa em vez de recriar lista inteira.

### 4.6 Dashboard Executivo recarrega a cada mudanca de filtro

Classificacao: P2

Evidencia:

`ExecutiveAnalyticsDashboard` usa:

```text
useEffect(() => load(), [filters])
```

Qualquer alteracao em filtro dispara request imediato.

Impacto:

- selects disparam uma nova carga a cada mudanca;
- sem debounce;
- sem cache no frontend;
- pode competir com o cache curto do backend.

Recomendacao:

- adicionar botao "Aplicar filtros" ou debounce;
- cachear queries por chave;
- usar React Query/TanStack Query futuramente.

### 4.7 Cache frontend inexistente

Classificacao: P2

Evidencia:

`frontend/src/shared/services/api.ts` apenas cria axios:

```text
axios.create({ baseURL: "http://localhost:3333/api" })
```

Nao ha:

- cache;
- retry;
- deduplicacao de requests;
- cancelamento;
- interceptors;
- invalidacao por mutation.

Impacto:

- telas refazem requisicoes ao alternar abas;
- mutacoes chamam `load()` geral;
- sem cancelamento, respostas antigas podem sobrescrever estado se usuario trocar filtros rapido.

Recomendacao:

- adotar React Query/TanStack Query;
- definir stale time para categorias, contas, cartoes, filtros e historicos;
- invalidar queries especificas apos importacao/cadastro.

## 5. Backend

### 5.1 Dashboards carregam `financial_transactions` inteira

Classificacao: P0

Evidencia:

`AnalyticsService.analyticsDashboard`:

```text
prisma.financialTransaction.findMany({ orderBy: { transactionDate: "asc" } })
```

`ReportService.executiveDashboard`:

```text
prisma.financialTransaction.findMany({ orderBy: { transactionDate: "asc" } })
```

`ReportService.dashboard` carrega:

```text
periodRows por competencia
allRows sem limite
```

Impacto:

- memoria cresce linearmente com o numero de lancamentos;
- CPU cresce com multiplos `filter/reduce/sort`;
- dashboards ficam lentos com anos de historico;
- chamadas simultaneas multiplicam o custo.

Recomendacao:

- criar queries agregadas por periodo;
- limitar por intervalo quando possivel;
- usar `groupBy` do Prisma quando suficiente;
- criar materializacao/cache de snapshots mensais;
- retornar apenas campos necessarios com `select`.

### 5.2 Loops O(n*m) em Analytics

Classificacao: P0

Evidencia:

Em `AnalyticsService`:

- `flow()` cria periodos e para cada periodo filtra `rows`;
- `accountWidgets` percorre `allRows` para cada conta;
- `creditCards` percorre `allRows` para cada cartao;
- varias metricas usam `filter` repetido sobre os mesmos arrays.

Impacto:

- com muitas contas/cartoes e muitos lancamentos, custo cresce rapidamente;
- gargalo de CPU no Node;
- aumenta tempo de resposta do dashboard.

Recomendacao:

- criar mapas pre-agregados por:
  - competencia;
  - conta;
  - cartao;
  - categoria;
  - tipo;
- percorrer `rows` uma unica vez por dashboard;
- separar agregacoes em um `AnalyticsAggregationService`.

### 5.3 `ReportService.executiveDashboard` chama `uberReport()` adicionalmente

Classificacao: P1

Evidencia:

`executiveDashboard` carrega todas as transacoes e depois chama `uberReport()`, que faz nova query em `financial_transactions`.

Impacto:

- consulta repetida na carga inicial do app;
- `App.tsx` tambem chama `/reports/uber` separadamente;
- Uber pode ser calculado duas vezes no mesmo carregamento.

Recomendacao:

- evitar chamar `uberReport()` dentro do executive dashboard;
- retornar alerta de Uber apenas quando relatorio for solicitado;
- ou compartilhar resultado via cache.

### 5.4 Listagem de lancamentos sem paginacao

Classificacao: P1

Evidencia:

`TransactionService.listFinancialEntries` usa `findMany` com filtros, mas sem `take/skip`.

Impacto:

- retorna todos os lancamentos do mes/filtro;
- frontend renderiza todos em tabela;
- custo cresce com uso real.

Recomendacao:

- adicionar paginacao server-side;
- `take` padrao 50 ou 100;
- retornar `meta.total`;
- permitir ordenacao.

### 5.5 `FinancialManagementService` calcula saldos varrendo transacoes

Classificacao: P1

Evidencia:

- `listAccounts` busca todas transacoes com `cashFlowImpact: true`;
- para cada conta, filtra rows por `accountName`;
- `listCards` busca todas compras de cartao e filtra por cartao.

Impacto:

- tela de Contas e Cartoes fica mais lenta com historico longo;
- calculo de saldo/limite repete trabalho do dashboard.

Recomendacao:

- agregar por conta/cartao no banco;
- manter snapshot de saldo se fizer sentido;
- padronizar se saldo e calculado ou armazenado.

### 5.6 Cache backend limitado

Classificacao: P2

Evidencia:

- `AnalyticsService` tem cache em memoria por 45s;
- demais dashboards/relatorios nao possuem cache;
- cache nao invalida por importacao/cadastro;
- cache e local ao processo.

Impacto:

- ajuda pouco no dashboard executivo;
- pode retornar dado velho apos importacao;
- nao resolve chamadas repetidas de endpoints diferentes.

Recomendacao:

- criar camada de cache por dominio;
- invalidar cache apos importacao, cadastro, edicao e exclusao/ignore;
- separar cache de filtros e agregacoes mensais.

## 6. Banco de Dados

### 6.1 Indices simples, mas faltam indices compostos para filtros reais

Classificacao: P2

Evidencia:

Existem indices simples em `financial_transactions`, como:

- `competence`;
- `source_type`;
- `financial_nature`;
- `origin`;
- `category`;
- `transaction_date`.

Impacto:

- filtros combinados podem nao escalar bem;
- dashboards usam combinacoes por competencia + tipo + origem + categoria.

Recomendacao:

- apos medir queries reais, considerar:
  - `(competence, source_type)`;
  - `(competence, financial_nature)`;
  - `(competence, category)`;
  - `(transaction_date, source_type)`;
  - `(import_batch_group_id, import_file_id)`.

### 6.2 Agregacoes feitas no Node em vez do banco

Classificacao: P1

Evidencia:

Services carregam linhas e usam `filter/reduce/groupBy` em TypeScript.

Impacto:

- muita transferencia entre banco e app;
- consumo de memoria no Node;
- SQLite fica subutilizado para agregacoes simples.

Recomendacao:

- usar queries agregadas para totais;
- usar `select` para reduzir colunas;
- avaliar views/materializacoes se migrar para PostgreSQL.

### 6.3 Base local SQLite

Classificacao: P2

Impacto:

- adequada para uso local;
- pode virar limite para multiusuario, consultas concorrentes e analytics pesados.

Recomendacao:

- manter SQLite no curto prazo;
- planejar PostgreSQL se o sistema evoluir para multiusuario, app externo ou Open Finance.

## 7. Importacoes

### 7.1 Classificacao consulta regras para cada linha

Classificacao: P0

Evidencia:

`classifyNormalized` executa:

```text
prisma.classificationRule.findMany(...)
```

Esse metodo e chamado para cada linha importada em `BatchImportService` e `ImportService`.

Impacto:

- um arquivo com 1.000 linhas pode gerar 1.000 consultas de regras;
- lote com varios arquivos multiplica o custo;
- gargalo forte antes mesmo de gravar transacoes.

Recomendacao:

- carregar regras uma vez por arquivo/lote;
- passar regras para uma funcao pura de classificacao;
- cachear regras ativas por `sourceType`.

### 7.2 Verificacao de duplicidade linha a linha

Classificacao: P0

Evidencia:

Em preview e confirmacao:

```text
prisma.financialTransaction.findFirst({
  where: { OR: [{ strictHash }, { hash }] }
})
```

feito para cada linha.

Impacto:

- N linhas = N consultas de duplicidade;
- em preview e confirmacao o trabalho pode acontecer duas vezes;
- lote grande fica lento.

Recomendacao:

- calcular todos os hashes do arquivo;
- buscar duplicados com `in` em lote;
- criar `Set` em memoria para validar;
- no confirm, confiar parcialmente no preview ou recalcular em lote.

### 7.3 Escrita linha a linha sem transacao em lote

Classificacao: P1

Evidencia:

`confirmBatchImport` cria `rawImportRecord`, classifica, busca duplicado, cria `financialTransaction` e atualiza `rawImportRecord` dentro do loop.

Impacto:

- muitas round trips ao banco;
- importacao pode ficar parcialmente persistida em caso de erro;
- lento com CSVs maiores.

Recomendacao:

- usar transacoes por arquivo;
- usar `createMany` quando possivel;
- gravar raw records em lote;
- separar validacao, classificacao e persistencia.

### 7.4 Parsing carrega arquivo inteiro em memoria

Classificacao: P2

Evidencia:

- CSV acumula `rawRows` em array;
- XLSX usa `sheet_to_json`, tambem em memoria.

Impacto:

- aceitavel para extratos pequenos;
- arquivos grandes podem consumir memoria;
- XLSX tende a ser mais pesado.

Recomendacao:

- manter por enquanto se arquivos forem pequenos;
- para grandes volumes, streaming real + limite de tamanho/linhas;
- informar limite de upload.

## 8. Dashboard e Analytics

### 8.1 Dashboard inicial dispara endpoints redundantes

Classificacao: P1

Evidencia:

Carregamento inicial chama dashboard legado, dashboard executivo, lancamentos, categorias e Uber.

Impacto:

- dashboards calculam sobre a mesma tabela varias vezes;
- Uber pode ser calculado dentro de `executiveDashboard` e em `/reports/uber`;
- custo alto no primeiro carregamento.

Recomendacao:

- escolher um dashboard principal;
- carregar relatorios sob demanda;
- remover dashboard legado da carga inicial ou cachear.

### 8.2 Analytics tem cache curto e sem invalidacao

Classificacao: P2

Evidencia:

`AnalyticsService` usa `CACHE_MS = 45_000`.

Impacto:

- melhora repeticoes imediatas;
- pode mostrar dados antigos logo apos importacao/cadastro;
- nao cobre outros services.

Recomendacao:

- invalidar ao salvar/importar/editar;
- cachear agregacoes por competencia;
- retornar `generatedAt` para UI.

### 8.3 Recharts renderiza muitos graficos no mesmo bundle

Classificacao: P2

Evidencia:

- `App.tsx` e `ExecutiveAnalyticsDashboard` importam `recharts`;
- todos entram no bundle inicial.

Impacto:

- custo de parsing/execucao no browser;
- principalmente sentido em maquinas mais simples.

Recomendacao:

- lazy load de dashboards;
- manter graficos fora do bundle inicial;
- avaliar memoizacao de datasets de grafico.

## 9. Codigo Morto, Duplicacoes e Legado

### 9.1 Services vazios ou quase vazios

Classificacao: P3

Arquivos:

- `ClassificationService.ts`;
- `DashboardService.ts`;
- `InvoiceReconciliationService.ts`;
- `ParserFactory.ts`;
- `ai/ResponseFormatter.ts`.

Impacto:

- baixo em performance;
- aumenta ruido arquitetural;
- pode confundir evolucoes.

Recomendacao:

- remover ou transformar em fachadas reais em fase separada;
- manter documentado ate a decisao.

### 9.2 Componentes de importacao antigos coexistem com ImportCenter

Classificacao: P3

Evidencia:

- `ImportCenter`;
- `BatchUpload`;
- `FileUpload`.

Impacto:

- se importados no futuro, podem aumentar bundle;
- duplicam conceitos de preview/confirmacao;
- manutencao mais dificil.

Recomendacao:

- decidir fluxo oficial;
- manter componentes antigos somente se ainda forem usados;
- remover depois de confirmar ausencia de uso.

### 9.3 Relatorios/documentos antigos ainda falam de tabelas legadas

Classificacao: P3

Evidencia:

Alguns documentos antigos referenciam `transactions` e `credit_card_purchases` como bases de analise.

Impacto:

- nao afeta runtime;
- pode induzir implementacoes futuras ao caminho legado.

Recomendacao:

- atualizar documentacao antiga ou marcar como historica.

## 10. Consultas Pesadas Identificadas

| Local | Consulta/Padrao | Prioridade | Recomendacao |
| --- | --- | --- | --- |
| `AnalyticsService` | `financialTransaction.findMany` sem filtro | P0 | Agregar por periodo/campos, usar select e range |
| `ReportService.executiveDashboard` | `financialTransaction.findMany` sem filtro | P0 | Snapshot mensal ou agregacoes |
| `ReportService.dashboard` | `periodRows` + `allRows` | P1 | Evitar carregar todo historico |
| `TransactionService.listFinancialEntries` | sem paginacao | P1 | `take/skip`, filtros e meta |
| `ClassificationEngine.classifyNormalized` | busca regras por linha | P0 | cache/regras carregadas por lote |
| `BatchImportService` | duplicidade por linha | P0 | busca por hashes em lote |
| `FinancialManagementService.listAccounts` | busca todas transacoes de caixa | P1 | groupBy por conta |
| `FinancialManagementService.listCards` | busca todas compras de cartao | P1 | groupBy por cartao |
| `ReportService.reconcileInvoices` | consulta compras dentro do loop de pagamentos | P1 | carregar compras por competencia em lote |

## 11. Re-renderizacoes e UI

| Local | Padrao | Prioridade | Recomendacao |
| --- | --- | --- | --- |
| `App.tsx` | estado centralizado e props extensas | P2 | dividir por feature e lazy routes |
| `TransactionsTable` | renderiza todas as linhas | P1 | virtualizacao/paginacao |
| `ReviewDrawer` | edicao recria array inteiro | P2 | estado por mapa/id |
| `ExecutiveAnalyticsDashboard` | request a cada mudanca de filtro | P2 | debounce/aplicar filtros/cache |
| `ImportHistory` | renderiza historico completo retornado | P3 | paginacao se crescer |

## 12. Lazy Loading, Code Splitting e Virtualizacao

### Estado atual

- Sem `React.lazy`;
- Sem `Suspense`;
- Sem code splitting;
- Sem virtualizacao;
- Bundle unico;
- Recharts no bundle inicial;
- telas de importacao/IA/configuracoes carregadas no inicio.

### Recomendacao por ordem

1. Lazy load por aba.
2. Separar dashboard/analytics em chunk proprio.
3. Separar assistente IA em chunk proprio.
4. Separar importacoes em chunk proprio.
5. Virtualizar `TransactionsTable`.
6. Paginacao server-side antes de virtualizar tabelas gigantes.

## 13. Plano Priorizado de Acao

### P0 - Antes de grandes volumes de dados

1. Otimizar importacao:
   - carregar regras uma vez;
   - buscar duplicados por lote;
   - reduzir queries por linha.
2. Otimizar analytics:
   - nao carregar `financial_transactions` inteira;
   - criar agregacoes por periodo;
   - percorrer linhas uma vez quando precisar usar memoria.

### P1 - Proxima fase de UX/performance

1. Implementar paginacao server-side em lancamentos.
2. Carregar dados por aba, nao no `load()` global.
3. Aplicar lazy loading/code splitting.
4. Evitar endpoint `/reports/uber` na carga inicial.
5. Agregar saldos de contas/cartoes no banco ou em snapshot.

### P2 - Melhorias estruturais

1. Adotar cache frontend com React Query.
2. Criar cache backend invalidavel.
3. Separar `App.tsx` e services grandes.
4. Criar indices compostos baseados nas queries reais.
5. Debounce ou botao aplicar filtros no analytics.

### P3 - Limpeza e manutencao

1. Remover services vazios ou transformar em fachadas reais.
2. Remover componentes de importacao antigos se nao usados.
3. Marcar documentacao legada como historica.
4. Reduzir duplicacoes visuais menores.

## 14. Conclusao

O gargalo mais relevante nao esta no React isoladamente, mas no fluxo completo: o frontend solicita muitas visoes ao mesmo tempo, o backend responde carregando grandes conjuntos de dados e processando agregacoes em memoria, e a importacao faz operacoes linha a linha.

Para escalar com seguranca, a ordem mais eficiente e:

1. reduzir consultas linha a linha na importacao;
2. parar de carregar todo o historico nos dashboards;
3. paginar lancamentos;
4. carregar telas sob demanda no frontend;
5. adicionar cache e invalidacao por dominio.

Essas mudancas podem ser feitas sem alterar regras financeiras, desde que sejam tratadas como refatoracoes de consulta, carregamento e apresentacao.
