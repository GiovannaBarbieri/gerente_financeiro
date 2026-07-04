# Arquitetura de pipeline financeiro

O MVP agora segue um pipeline incremental:

1. Upload
2. Raw Import
3. Parser
4. Normalizacao
5. Validacao
6. Classificacao
7. Conciliacao
8. Financial Transactions
9. Views/servicos analiticos
10. Dashboard

## Raw Import

Tabela: `raw_import_records`

Guarda a linha original do arquivo em `raw_json`, sem renomear colunas, datas ou descricoes. Essa camada permite auditoria, reprocessamento e melhoria futura de regras sem depender apenas de `financial_transactions`.

Cada `financial_transactions.raw_record_id` aponta para a linha bruta que originou a movimentacao.

## Financial Transactions

Tabela: `financial_transactions`

Representa apenas movimentacoes normalizadas. Ela nao deve conter regra de CSV, parser ou layout de banco.

Campos arquiteturais adicionados:

- `external_id`
- `raw_record_id`
- `invoice_id`
- `invoice_competence`
- `payment_date`
- `payment_competence`
- `cash_flow_impact`
- `real_consumption_impact`
- `classification_confidence`
- `classification_source`
- `review_status`
- `strict_hash`
- `soft_hash`
- `user_id`

## Impactos

`cash_flow_impact` define se entra no fluxo de caixa.

Exemplos:

- Pagamento de fatura: sim.
- Compra no cartao: nao.

`real_consumption_impact` define se entra no consumo real.

Exemplos:

- Pagamento de fatura: nao.
- Compra Uber: sim.

## Hashes

`strict_hash` bloqueia duplicidade:

- data
- valor
- descricao original
- instituicao
- conta/cartao

`soft_hash` alerta possivel duplicidade:

- data
- valor
- descricao normalizada
- pessoa/empresa

## Faturas e conciliacao

Tabela preparada: `credit_card_invoices`

Campos:

- `invoice_competence`
- `closing_date`
- `due_date`
- `total_amount`
- `paid_amount`
- `difference`
- `status`

A tabela `invoice_reconciliations` foi evoluida para receber `invoice_id`, `payment_transaction_id`, valores esperados/pagos e diferenca.

## Classificacao

`classification_rules` agora suporta:

- `match_type`: EXACT, CONTAINS, REGEX, FUZZY
- `confidence`
- `created_by`: SYSTEM, USER, AI
- `user_id`

`classification_feedbacks` registra correcoes manuais para evoluir aprendizado e futuras regras.

## Servicos

Responsabilidades separadas:

- `ImportService`
- `ParserFactory`
- `NormalizationService`
- `ClassificationService`
- `InvoiceReconciliationService`
- `DashboardService`
- `ReportService`

Os endpoints atuais continuam compativeis com o MVP.
