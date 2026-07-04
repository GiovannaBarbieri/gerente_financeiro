# 18 - Relatorio de Revisao dos Services Backend

## 1. Objetivo

Revisar a camada de Services do backend para reduzir duplicacao, centralizar responsabilidades recorrentes e identificar pontos de acoplamento, sem alterar comportamento, regras financeiras, banco de dados, endpoints ou contratos de API.

Esta fase foi tratada como uma refatoracao conservadora. A alteracao aplicada ficou restrita a funcoes puras de calculo e classificacao auxiliar, mantendo os fluxos de importacao, normalizacao, classificacao, analytics e persistencia exatamente nos mesmos services de origem.

## 2. Services existentes

| Service | Responsabilidade atual | Observacoes |
| --- | --- | --- |
| `AnalyticsService` | Dashboard analitico, KPIs, rankings, widgets de contas/cartoes, calendario e indicadores. | Service grande, mistura agregacao, cache simples, filtros e montagem de DTOs. |
| `BatchImportService` | Pre-visualizacao e confirmacao de importacao em lote. | Service mais acoplado do backend; orquestra arquivo, parser, normalizacao, classificacao, duplicidade e persistencia. |
| `ClassificationEngine` | Classificacao de transacoes normalizadas. | Depende de regras e categorias gravadas no banco. |
| `ClassificationService` | Arquivo de fachada ainda sem implementacao propria. | Candidato a remocao ou a se tornar fachada real em fase futura. |
| `ColumnMappingService` | Padronizacao e mapeamento de colunas de arquivos importados. | Reaproveitavel para novos bancos. |
| `DashboardService` | Arquivo de fachada ainda sem implementacao propria. | Candidato a remocao ou redirecionamento para `AnalyticsService`/`ReportService`. |
| `FileParserService` | Leitura de CSV/XLSX e normalizacao inicial de linhas. | Baixo acoplamento, responsabilidade clara. |
| `FinancialManagementService` | Contas, cartoes, meios de pagamento, tags, filtros, recorrencias, transferencias e busca global. | Service amplo, agrupa muitas entidades administrativas. |
| `HashService` | Criacao de hashes de importacao e transacoes. | Responsabilidade pequena e clara. |
| `ImportManagerService` | Fachada para pre-visualizacao/confirmacao de lote. | Funciona como ponto simples para rotas. |
| `ImportService` | Importacao individual de conta/cartao. | Compartilha muito fluxo conceitual com `BatchImportService`. |
| `InstitutionInferenceService` | Inferencia de instituicao e nome de conta/cartao. | Responsabilidade pequena e reaproveitavel. |
| `InvoiceReconciliationService` | Arquivo de fachada ainda sem implementacao propria. | Candidato a receber conciliacao de faturas futuramente. |
| `NormalizationEngine` | Normalizacao de transacoes parseadas para o modelo financeiro interno. | Central no dominio financeiro; deve ser alterado com cuidado. |
| `NormalizationService` | Arquivo de fachada ainda sem implementacao propria. | Candidato a remocao ou fachada real. |
| `ParserFactory` | Arquivo de fachada ainda sem implementacao propria. | Candidato a remocao ou substituicao por `ParserRegistry`. |
| `ParserRegistry` | Registro de parsers disponiveis. | Responsabilidade clara. |
| `Parsers` | Parsers de conta/cartao e identificacao do parser aplicavel. | Pode ser quebrado por instituicao no futuro. |
| `ReportService` | Dashboard executivo, dashboard mensal, transacoes consolidadas, relatorio Uber e conciliacao. | Service grande, mistura relatorios, dashboard legado e reconciliacao. |
| `TransactionService` | Listagem, detalhe, criacao, edicao e ignorar lancamentos financeiros. | Service central do modulo de lancamentos. |
| `ai/AiEngine` | Orquestracao de conversas, contexto financeiro, provider e persistencia da resposta. | Coordenador principal de IA. |
| `ai/AiProvider` | Integracao com provedores de IA. | Ponto certo para evoluir OpenAI/Claude/Gemini/Ollama/LM Studio. |
| `ai/AiRecommendationService` | Geracao de recomendacoes financeiras. | Depende de contexto financeiro e banco. |
| `ai/ContextCompressor` | Compactacao de contexto para prompt. | Responsabilidade pequena. |
| `ai/ConversationService` | Conversas e mensagens da IA. | Persistencia direta via Prisma. |
| `ai/FinancialContextService` | Montagem de contexto financeiro para IA. | Acopla IA ao `AnalyticsService`. |
| `ai/MemoryService` | Memoria simples da IA. | Persistencia direta via Prisma. |
| `ai/PromptBuilder` | Montagem do prompt final. | Depende de templates e compressor. |
| `ai/PromptTemplates` | Templates e deteccao de intencao. | Responsabilidade clara. |
| `ai/ResponseFormatter` | Formatacao final de resposta. | Hoje e praticamente pass-through. |

## 3. Services novos

### `backend/src/services/shared/FinancialMathService.ts`

Criado para centralizar funcoes financeiras puras que estavam duplicadas entre services:

| Funcao | Responsabilidade |
| --- | --- |
| `signedAmount` | Retornar valor positivo para `Entrada`/`Estorno` e negativo para demais tipos. |
| `absoluteAmount` | Retornar valor absoluto de uma transacao. |
| `sumAmounts` | Somar valores preservando o sinal numerico do campo `amount`. |
| `sumAbsoluteAmounts` | Somar valores absolutos ou uma funcao de valor customizada. |
| `isIncome` | Identificar receitas por natureza financeira ou tipo de transacao. |
| `isExpense` | Identificar despesas com impacto real de consumo. |
| `isPendingReview` | Identificar lancamentos pendentes de revisao por status, categoria ou origem. |

## 4. Services unificados

Foram removidas duplicacoes diretas em:

| Service | Antes | Depois |
| --- | --- | --- |
| `TransactionService` | Possuia `signedAmount` local. | Usa `FinancialMathService.signedAmount`. |
| `AnalyticsService` | Possuia `signedAmount`, `absAmount`, `sum`, `isIncome`, `isExpense`, `isPending`. | Usa funcoes compartilhadas para matematica financeira e status pendente. |
| `ReportService` | Possuia `signedAmount` local, soma local e regra local de despesa/pedencia. | Usa `signedAmount`, `sumAmounts`, `isExpense`, `isPendingReview`. |
| `FinancialManagementService` | Calculava saldo de conta com regra inline de entrada/saida. | Usa `signedAmount`. |
| `BatchImportService` | Calculava pendencia de revisao com regra inline. | Usa `isPendingReview`. |

## 5. Responsabilidades apos a revisao

### Matematica financeira compartilhada

Ficou centralizada em `FinancialMathService`. Ela nao acessa banco, nao cria registros e nao conhece Prisma. Isso permite usar as mesmas regras auxiliares em dashboard, relatorios, lancamentos, contas e importacoes sem duplicar condicoes.

### Orquestracao de importacao

Continua nos services atuais:

- `ImportService` para importacao individual.
- `BatchImportService` para lote.
- `ImportManagerService` como fachada de lote.
- `FileParserService`, `ColumnMappingService`, `Parsers`, `ParserRegistry`, `NormalizationEngine`, `ClassificationEngine` e `HashService` como dependencias internas do pipeline.

Nenhuma regra de importacao foi modificada.

### Lancamentos financeiros

Continua em `TransactionService`, que segue responsavel por cadastro manual, atualizacao, listagem, filtros e transformacao para DTO de tela.

### Analytics e relatorios

Continuam separados em:

- `AnalyticsService`: dashboard analitico moderno.
- `ReportService`: dashboard executivo, dashboard legado/mensal, relatorios consolidados e conciliacao.

Apenas funcoes auxiliares duplicadas foram removidas.

## 6. Dependencias principais

| Dependencia | Services consumidores |
| --- | --- |
| `prisma` | Maioria dos services de dominio, importacao, analytics, relatorios e IA. |
| `shared/utils/format` | Normalizacao de texto, datas, competencia, valores e hashes. |
| `ClassificationEngine` | `ImportService`, `BatchImportService`, `TransactionService`. |
| `NormalizationEngine` | `ImportService`, `BatchImportService`, `Parsers`, `ClassificationEngine`. |
| `FileParserService` | `ImportService`, `BatchImportService`, `ColumnMappingService`, `Parsers`. |
| `ColumnMappingService` | `ImportService`, `BatchImportService`. |
| `Parsers`/`ParserRegistry` | Pipeline de importacao individual e em lote. |
| `FinancialMathService` | `AnalyticsService`, `ReportService`, `TransactionService`, `FinancialManagementService`, `BatchImportService`. |

## 7. Acoplamentos encontrados

### 7.1 Importacao individual e importacao em lote

`ImportService` e `BatchImportService` repetem conceitos parecidos:

- parse de arquivo;
- inferencia de instituicao;
- inferencia de conta/cartao;
- mapeamento de colunas;
- identificacao de parser;
- normalizacao;
- classificacao;
- criacao de raw records;
- verificacao de duplicidade;
- persistencia final.

Recomendacao futura: criar um `ImportPipelineService` interno para executar etapas comuns e deixar importacao individual/lote apenas como orquestradores de caso de uso.

### 7.2 Services grandes

Services candidatos a quebra futura:

| Service | Tamanho aproximado | Recomendacao |
| --- | ---: | --- |
| `BatchImportService` | 370 linhas | Separar preparacao de arquivo, analise, persistencia e resumo. |
| `ReportService` | 340 linhas | Separar dashboard executivo, dashboard mensal, Uber report e conciliacao. |
| `TransactionService` | 300 linhas | Separar mapper/DTO, status helper e comandos de escrita. |
| `AnalyticsService` | 260 linhas | Separar agregacoes, filtros, calendario, contas/cartoes e DTO final. |
| `FinancialManagementService` | 230 linhas | Separar contas, cartoes, meios de pagamento, tags, recorrencias e busca. |
| `ImportService` | 215 linhas | Reaproveitar pipeline comum com lote. |

### 7.3 Prisma dentro de todos os services

Hoje os services acessam `prisma` diretamente. Isso e simples e funciona, mas aumenta acoplamento entre regra de aplicacao e persistencia.

Recomendacao futura: introduzir repositories apenas nos modulos que crescerem mais, comecando por:

- `FinancialTransactionRepository`;
- `ImportRepository`;
- `AccountRepository`;
- `CardRepository`;
- `AiConversationRepository`.

### 7.4 Fachadas vazias

Existem arquivos sem responsabilidade real no momento:

- `ClassificationService.ts`;
- `DashboardService.ts`;
- `InvoiceReconciliationService.ts`;
- `NormalizationService.ts`;
- `ParserFactory.ts`.

Recomendacao futura: decidir entre remover esses arquivos ou transforma-los em fachadas reais. Manter arquivos vazios por muito tempo pode confundir a arquitetura.

### 7.5 IA dependente de Analytics

`FinancialContextService` consome `AnalyticsService`, o que acelera a entrega, mas acopla o contexto da IA ao formato do dashboard.

Recomendacao futura: criar um `FinancialContextQueryService` ou `FinancialSnapshotService` para prover dados financeiros neutros, consumidos tanto por Analytics quanto pela IA.

## 8. Arquivos alterados

| Arquivo | Alteracao |
| --- | --- |
| `backend/src/services/shared/FinancialMathService.ts` | Novo service compartilhado com funcoes puras de matematica financeira. |
| `backend/src/services/AnalyticsService.ts` | Removidas funcoes duplicadas e importadas funcoes compartilhadas. |
| `backend/src/services/ReportService.ts` | Removidas duplicacoes de valor assinado, soma, despesa e pendencia. |
| `backend/src/services/TransactionService.ts` | Removida funcao local de valor assinado. |
| `backend/src/services/FinancialManagementService.ts` | Removida regra inline de saldo assinado. |
| `backend/src/services/BatchImportService.ts` | Removida regra inline de pendencia de revisao. |

## 9. Arquivos candidatos a remocao futura

Nao foram removidos nesta fase para evitar risco de quebra de imports ou planos arquiteturais futuros.

| Arquivo | Motivo |
| --- | --- |
| `ClassificationService.ts` | Sem responsabilidade implementada. |
| `DashboardService.ts` | Sem responsabilidade implementada. |
| `InvoiceReconciliationService.ts` | Sem responsabilidade implementada. |
| `NormalizationService.ts` | Sem responsabilidade implementada. |
| `ParserFactory.ts` | Sem responsabilidade implementada. |

## 10. Proximas etapas recomendadas

1. Criar um `ImportPipelineService` para reduzir duplicacao entre importacao individual e em lote.
2. Separar `FinancialManagementService` por entidades: contas, cartoes, recorrencias, tags e meios de pagamento.
3. Extrair mappers/DTOs de `TransactionService`, `ReportService` e `AnalyticsService`.
4. Criar repositories gradualmente, iniciando por transacoes e importacoes.
5. Decidir o destino das fachadas vazias.
6. Criar testes de regressao antes de quebrar services grandes.

## 11. Validacao

Validacao executada:

```bash
npm run build --workspace backend
```

Resultado: build do backend concluido com sucesso.

## 12. Conclusao

A revisao eliminou duplicacoes seguras da camada de Services e criou uma base compartilhada para calculos financeiros recorrentes. O comportamento foi preservado: nenhuma rota, modelo, regra de importacao, regra de classificacao, regra de normalizacao ou estrutura de banco foi alterada.

O principal ganho desta fase foi reduzir divergencia futura entre Dashboard, Relatorios, Lancamentos, Contas e Importacoes ao centralizar a interpretacao de valor assinado, despesa, receita e pendencia de revisao.
