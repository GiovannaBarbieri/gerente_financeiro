# 08 - Modelo de Dados

## 1. Proposito do Documento

Este documento descreve oficialmente o modelo de dados do sistema.

Ele documenta tabelas, campos, relacionamentos, chaves, indices, constraints, tabelas legadas, tabelas novas, convencoes de nomenclatura e estrategia de migrations.

O objetivo e manter uma referencia clara para evolucao do banco de dados sem comprometer compatibilidade, rastreabilidade e confiabilidade financeira.

## 2. Visao Geral do Banco

O sistema utiliza atualmente:

- Prisma como ORM;
- SQLite como banco de dados local;
- `financial_transactions` como tabela principal de lancamentos financeiros;
- tabelas auxiliares para importacao, classificacao, contas, cartoes, categorias, analytics, recorrencias, anexos e IA.

O modelo evoluiu em fases. Por isso, existem tabelas legadas que ainda permanecem para compatibilidade, mas a direcao oficial e centralizar a gestao financeira na tabela `financial_transactions`.

## 3. Convencoes de Nomenclatura

### Nome de Tabelas

Tabelas fisicas no banco usam `snake_case` e plural.

Exemplos:

- `financial_transactions`;
- `raw_import_records`;
- `import_batches`;
- `classification_rules`;
- `ai_conversations`.

### Nome de Models Prisma

Models Prisma usam `PascalCase` no singular.

Exemplos:

- `FinancialTransaction`;
- `RawImportRecord`;
- `ImportBatch`;
- `ClassificationRule`.

### Campos

No Prisma, campos usam `camelCase`.

No banco, campos usam `snake_case` quando mapeados com `@map`.

Exemplo:

```text
transactionDate -> transaction_date
paymentMethodId -> payment_method_id
createdAt -> created_at
```

### Chaves Primarias

Padroes existentes:

- `Int @id @default(autoincrement())` para varias tabelas cadastrais e legadas;
- `String @id @default(uuid())` para entidades modernas, lotes, arquivos, lancamentos e IA.

### Datas

Campos de data seguem o padrao:

- `createdAt`;
- `updatedAt`;
- `importedAt`;
- `transactionDate`;
- `dueDate`;
- `paymentDate`.

### Status

Status sao armazenados como `String`.

Valores devem ser padronizados por regra de negocio, mesmo sem enum no banco.

Exemplos:

- `Active`;
- `Archived`;
- `Preview`;
- `Imported`;
- `Pending`;
- `Reviewed`;
- `Ignored`;
- `Open`.

## 4. Diagrama Textual Geral

```text
users

accounts
  └── transactions (legado)
  └── cards como conta de pagamento

cards
  └── credit_card_purchases (legado)
  └── transactions (legado)
  └── invoice_reconciliations

categories
  └── subcategories
  └── classification_rules
  └── transactions (legado)
  └── credit_card_purchases (legado)

imports (legado operacional)
  └── transactions (legado)
  └── credit_card_purchases (legado)
  └── raw_import_records

import_batches
  └── import_files
  └── raw_import_records
  └── financial_transactions

raw_import_records
  └── financial_transactions

credit_card_invoices
  └── financial_transactions

payment_methods
  └── financial_transactions
  └── recurring_entries

financial_transactions
  └── financial_transaction_tags
        └── tags
  └── attachments
  └── financial_entry_audits

ai_conversations
  └── ai_messages

ai_settings
ai_memories
ai_recommendations
saved_filters
recurring_entries
classification_feedbacks
```

## 5. Tabela Principal

## `financial_transactions`

Tabela principal do sistema.

Representa o historico unico de lancamentos financeiros.

### Papel

- armazenar lancamentos manuais;
- armazenar lancamentos importados;
- centralizar receitas, despesas, transferencias, compras, estornos e ajustes;
- alimentar dashboard, analytics, relatorios e assistente financeiro.

### Campos Principais

- `id`: chave primaria UUID;
- `user_id`: usuario dono do lancamento, preparado para multiusuario;
- `external_id`: identificador externo futuro;
- `raw_record_id`: vinculo com registro bruto importado;
- `import_file_id`: vinculo com arquivo de importacao;
- `import_batch_group_id`: vinculo com lote moderno;
- `invoice_id`: vinculo com fatura;
- `transaction_date`: data do lancamento;
- `competence`: competencia do lancamento;
- `invoice_competence`: competencia de fatura;
- `payment_date`: data de pagamento;
- `payment_competence`: competencia de pagamento;
- `due_date`: vencimento;
- `source_type`: origem operacional, como Conta ou Cartao;
- `institution`: instituicao financeira;
- `account_name`: conta vinculada por nome;
- `transaction_type`: tipo operacional;
- `financial_nature`: natureza financeira;
- `original_description`: descricao original;
- `normalized_description`: descricao normalizada;
- `person_company`: pessoa, empresa ou estabelecimento;
- `amount`: valor absoluto;
- `category`: categoria;
- `subcategory`: subcategoria;
- `origin`: origem de negocio;
- `payment_method`: forma de pagamento textual;
- `payment_method_id`: vinculo opcional com forma de pagamento;
- `entry_kind`: tipo conceitual futuro;
- `status`: status operacional moderno;
- `card_name`: cartao vinculado por nome;
- `installment`: parcela;
- `total_installments`: total de parcelas;
- `reconciled`: conciliado;
- `transfer_internal`: transferencia interna;
- `cash_flow_impact`: indica impacto no caixa;
- `real_consumption_impact`: indica impacto em consumo real;
- `classification_confidence`: confianca da classificacao;
- `classification_source`: fonte da classificacao;
- `review_status`: status de revisao legado/atual;
- `import_batch`: identificador textual de importacao;
- `import_batch_id`: vinculo com importacao legada;
- `notes`: observacoes;
- `hash`: hash principal unico;
- `strict_hash`: hash estrito unico;
- `soft_hash`: hash flexivel;
- `created_at`: criacao;
- `updated_at`: atualizacao.

### Relacionamentos

- pertence opcionalmente a `raw_import_records`;
- pertence opcionalmente a `import_files`;
- pertence opcionalmente a `import_batches`;
- pertence opcionalmente a `credit_card_invoices`;
- pertence opcionalmente a `payment_methods`;
- possui varias tags por `financial_transaction_tags`;
- possui varios anexos;
- possui varios registros de auditoria.

### Indices

- `transaction_date`;
- `competence`;
- `invoice_competence`;
- `payment_competence`;
- `source_type`;
- `financial_nature`;
- `origin`;
- `category`;
- `import_batch`;
- `import_batch_id`;
- `import_file_id`;
- `import_batch_group_id`;
- `raw_record_id`;
- `soft_hash`;
- `payment_method_id`;
- `status`;
- `due_date`.

### Constraints

- `id` e chave primaria;
- `hash` e unico;
- `strict_hash` e unico quando informado.

### Observacoes

Esta tabela deve ser considerada a fonte oficial do historico financeiro.

Campos como `account_name`, `card_name`, `category` e `subcategory` ainda sao textuais. Futuramente pode ser avaliado vinculo por ID, preservando compatibilidade.

## 6. Tabelas de Cadastro Financeiro

## `accounts`

Representa contas financeiras.

### Campos

- `id`: chave primaria;
- `name`: nome;
- `bank`: banco;
- `type`: tipo da conta;
- `initial_balance`: saldo inicial;
- `current_balance`: saldo atual armazenado;
- `color`: cor;
- `icon`: icone;
- `status`: status;
- `default_account`: conta padrao;
- `created_at`: criacao.

### Relacionamentos

- possui `transactions` legadas;
- pode ser conta de pagamento de `cards`.

### Observacoes

O saldo atual pode ser calculado dinamicamente com base nos lancamentos. O campo `current_balance` deve ser tratado com cuidado para evitar divergencia.

## `cards`

Representa cartoes.

### Campos

- `id`;
- `name`;
- `bank`;
- `brand`;
- `color`;
- `closing_day`;
- `due_day`;
- `limit_amount`;
- `available_limit`;
- `status`;
- `payment_account_id`;
- `created_at`.

### Relacionamentos

- pertence opcionalmente a `accounts` como conta de pagamento;
- possui `credit_card_purchases` legadas;
- possui `transactions` legadas;
- possui `invoice_reconciliations`.

### Observacoes

Compras modernas devem ser representadas em `financial_transactions`, usando `card_name` e atributos relacionados.

## `categories`

Representa categorias financeiras.

### Campos

- `id`;
- `name`;
- `type`;
- `icon`;
- `color`;
- `status`;
- `sort_order`;
- `favorite`;
- `hidden`;
- `created_at`.

### Relacionamentos

- possui `subcategories`;
- possui `classification_rules`;
- possui `transactions` legadas;
- possui `credit_card_purchases` legadas.

### Constraints

- `name` unico.

## `subcategories`

Representa subcategorias.

### Campos

- `id`;
- `category_id`;
- `name`;
- `icon`;
- `color`;
- `status`;
- `sort_order`;
- `favorite`;
- `hidden`;
- `created_at`.

### Relacionamentos

- pertence a `categories`;
- possui `classification_rules`;
- possui `transactions` legadas;
- possui `credit_card_purchases` legadas.

### Constraints

- combinacao unica entre `category_id` e `name`.

## `payment_methods`

Representa formas de pagamento.

### Campos

- `id`;
- `name`;
- `type`;
- `icon`;
- `color`;
- `status`;
- `sort_order`;
- `created_at`.

### Relacionamentos

- possui `financial_transactions`;
- possui `recurring_entries`.

### Constraints

- `name` unico.

## `tags`

Representa tags livres.

### Campos

- `id`;
- `name`;
- `color`;
- `created_at`.

### Relacionamentos

- associa-se a `financial_transactions` por `financial_transaction_tags`.

### Constraints

- `name` unico.

## `financial_transaction_tags`

Tabela de relacionamento N:N entre lancamentos e tags.

### Campos

- `financial_transaction_id`;
- `tag_id`;
- `created_at`.

### Chave

- chave composta entre `financial_transaction_id` e `tag_id`.

## 7. Tabelas de Importacao

## `import_batches`

Representa lote moderno de importacao.

### Campos

- `id`: UUID;
- `user_id`;
- `status`;
- `total_files`;
- `total_rows`;
- `created_at`;
- `imported_at`.

### Relacionamentos

- possui `import_files`;
- possui `raw_import_records`;
- possui `financial_transactions`.

### Indices

- `status`;
- `created_at`.

## `import_files`

Representa arquivo dentro de um lote.

### Campos

- `id`;
- `import_batch_id`;
- `legacy_import_id`;
- `file_name`;
- `file_type`;
- `temp_path`;
- `source_type`;
- `institution`;
- `parser_name`;
- `total_rows`;
- `valid_rows`;
- `duplicate_rows`;
- `error_rows`;
- `status`;
- `error_message`;
- `created_at`;
- `imported_at`.

### Relacionamentos

- pertence a `import_batches`;
- possui `raw_import_records`;
- possui `financial_transactions`.

### Indices

- `import_batch_id`;
- `source_type`;
- `institution`;
- `status`.

## `raw_import_records`

Representa linha bruta importada.

### Campos

- `id`;
- `user_id`;
- `import_batch_id`;
- `import_file_id`;
- `import_batch_group_id`;
- `source_type`;
- `institution`;
- `original_row_number`;
- `raw_json`;
- `raw_hash`;
- `processed`;
- `created_at`.

### Relacionamentos

- pertence a `imports`;
- pertence opcionalmente a `import_files`;
- pertence opcionalmente a `import_batches`;
- possui `financial_transactions`.

### Indices

- `import_batch_id`;
- `import_file_id`;
- `import_batch_group_id`;
- `source_type`;
- `institution`;
- `processed`.

### Constraints

- `raw_hash` unico.

## `imports`

Tabela de importacao legada/compatibilidade.

### Campos

- `id`;
- `file_name`;
- `file_type`;
- `source_type`;
- `imported_at`;
- `total_rows`;
- `status`.

### Relacionamentos

- possui `transactions` legadas;
- possui `credit_card_purchases` legadas;
- possui `raw_import_records`.

### Observacoes

Permanece por compatibilidade com fluxos antigos e vinculos de `raw_import_records`.

## 8. Tabelas de Classificacao

## `classification_rules`

Representa regras de classificacao automatica.

### Campos

- `id`;
- `keyword`;
- `normalized_keyword`;
- `match_type`;
- `source_type`;
- `category_id`;
- `subcategory_id`;
- `category_name`;
- `subcategory_name`;
- `financial_nature`;
- `origin`;
- `priority`;
- `confidence`;
- `created_by`;
- `user_id`;
- `active`;
- `created_at`.

### Relacionamentos

- pertence opcionalmente a `categories`;
- pertence opcionalmente a `subcategories`.

### Indices

- `keyword`;
- `normalized_keyword`.

## `classification_feedbacks`

Registra feedbacks de classificacao.

### Campos

- `id`;
- `original_description`;
- `normalized_description`;
- `old_category`;
- `new_category`;
- `old_origin`;
- `new_origin`;
- `user_id`;
- `created_at`.

### Indices

- `normalized_description`;
- `user_id`.

## 9. Tabelas de Cartao e Conciliacao

## `credit_card_invoices`

Representa faturas de cartao.

### Campos

- `id`;
- `user_id`;
- `card_id`;
- `card_name`;
- `invoice_competence`;
- `closing_date`;
- `due_date`;
- `total_amount`;
- `paid_amount`;
- `difference`;
- `status`;
- `created_at`.

### Relacionamentos

- possui `financial_transactions`.

### Indices

- `card_id`;
- `invoice_competence`;
- `status`.

## `invoice_reconciliations`

Representa conciliacoes de faturas.

### Campos

- `id`;
- `account_transaction_id`;
- `card_id`;
- `invoice_id`;
- `payment_transaction_id`;
- `invoice_month`;
- `invoice_amount`;
- `purchases_amount`;
- `difference_amount`;
- `expected_amount`;
- `paid_amount`;
- `difference`;
- `status`;
- `created_at`.

### Relacionamentos

- pertence a `transactions` legada como transacao de conta;
- pertence opcionalmente a `cards`.

### Indices

- `invoice_month`;
- `invoice_id`;
- `payment_transaction_id`.

### Constraints

- `account_transaction_id` unico.

### Observacoes

Ainda depende da tabela legada `transactions`. Deve ser revisada em fase futura para usar `financial_transactions`.

## 10. Tabelas de Gestao Financeira

## `recurring_entries`

Representa lancamentos recorrentes.

### Campos

- `id`;
- `name`;
- `description`;
- `amount`;
- `frequency`;
- `next_date`;
- `end_date`;
- `status`;
- `category`;
- `subcategory`;
- `account_name`;
- `card_name`;
- `payment_method_id`;
- `notes`;
- `created_at`.

### Relacionamentos

- pertence opcionalmente a `payment_methods`.

### Indices

- `status`;
- `next_date`.

## `attachments`

Representa anexos de lancamentos.

### Campos

- `id`;
- `financial_transaction_id`;
- `file_name`;
- `file_type`;
- `file_path`;
- `file_size`;
- `created_at`.

### Relacionamentos

- pertence a `financial_transactions`.

### Indices

- `financial_transaction_id`.

## `saved_filters`

Representa filtros salvos.

### Campos

- `id`;
- `name`;
- `scope`;
- `filters`;
- `favorite`;
- `created_at`.

## `financial_entry_audits`

Representa auditoria de alteracoes em lancamentos.

### Campos

- `id`;
- `financial_transaction_id`;
- `action`;
- `before_json`;
- `after_json`;
- `created_at`.

### Relacionamentos

- pertence a `financial_transactions`.

### Indices

- `financial_transaction_id`.

## 11. Tabelas de Inteligencia Artificial

## `ai_conversations`

Representa conversas com o Assistente Financeiro.

### Campos

- `id`;
- `title`;
- `favorite`;
- `created_at`;
- `updated_at`.

### Relacionamentos

- possui `ai_messages`.

### Indices

- `updated_at`.

## `ai_messages`

Representa mensagens de conversa.

### Campos

- `id`;
- `conversation_id`;
- `role`;
- `content`;
- `metadata`;
- `created_at`.

### Relacionamentos

- pertence a `ai_conversations`.

### Indices

- `conversation_id`;
- `created_at`.

## `ai_settings`

Representa configuracoes de IA.

### Campos

- `id`;
- `provider`;
- `model`;
- `temperature`;
- `language`;
- `context_limit`;
- `api_key_masked`;
- `created_at`;
- `updated_at`.

## `ai_memories`

Representa memorias do Assistente Financeiro.

### Campos

- `id`;
- `kind`;
- `content`;
- `active`;
- `created_at`;
- `updated_at`.

### Indices

- `kind`;
- `active`.

## `ai_recommendations`

Representa recomendacoes geradas pelo sistema ou IA.

### Campos

- `id`;
- `title`;
- `message`;
- `impact`;
- `priority`;
- `source`;
- `created_at`.

### Indices

- `priority`;
- `created_at`.

## 12. Tabelas Legadas

## `transactions`

Tabela legada de movimentacoes de conta.

### Papel Historico

Representava transacoes financeiras antes da consolidacao em `financial_transactions`.

### Relacionamentos

- `accounts`;
- `cards`;
- `imports`;
- `categories`;
- `subcategories`;
- `invoice_reconciliations`.

### Indices e Constraints

- indice em `month`;
- indice em `source`;
- indice em `category_id`;
- `fingerprint` unico.

### Status Futuro

Candidata a remocao futura apos:

- migrar conciliacoes para `financial_transactions`;
- garantir ausencia de dependencias ativas;
- validar historico;
- criar migration segura.

## `credit_card_purchases`

Tabela legada de compras de cartao.

### Papel Historico

Representava compras de cartao antes da consolidacao em `financial_transactions`.

### Relacionamentos

- `cards`;
- `imports`;
- `categories`;
- `subcategories`.

### Indices e Constraints

- indice em `month`;
- indice em `invoice_month`;
- indice em `category_id`;
- `fingerprint` unico.

### Status Futuro

Candidata a remocao futura apos:

- validar que compras modernas estao em `financial_transactions`;
- migrar qualquer dado relevante;
- remover dependencias visuais e de relatorio.

## `imports`

Tabela parcialmente legada, ainda operacional.

### Papel

Mantem compatibilidade com importacoes antigas e relacionamento com `raw_import_records`.

### Status Futuro

Pode ser substituida gradualmente por `import_batches` e `import_files`.

## 13. Tabelas Candidatas para Futura Remocao

### Candidatas Fortes

- `transactions`;
- `credit_card_purchases`.

### Candidatas Condicionais

- `imports`, se todo fluxo for migrado para `import_batches` e `import_files`;
- campos textuais em `financial_transactions` como `category`, `subcategory`, `account_name`, `card_name`, caso sejam substituidos por IDs em fase futura.

### Nao Remover Ainda

Nao remover enquanto houver:

- relatorios dependentes;
- conciliacoes dependentes;
- importacoes dependentes;
- dados historicos nao migrados;
- falta de testes de regressao.

## 14. Relacionamentos Principais

### Importacao para Lancamento

```text
import_batches
  -> import_files
  -> raw_import_records
  -> financial_transactions
```

### Categoria

```text
categories
  -> subcategories
  -> classification_rules
```

### Lancamento com Tags

```text
financial_transactions
  -> financial_transaction_tags
  -> tags
```

### Lancamento com Anexos

```text
financial_transactions
  -> attachments
```

### Lancamento com Auditoria

```text
financial_transactions
  -> financial_entry_audits
```

### IA

```text
ai_conversations
  -> ai_messages

ai_settings
ai_memories
ai_recommendations
```

## 15. Indices e Performance

### Indices Mais Importantes

Em `financial_transactions`:

- `transaction_date`;
- `competence`;
- `source_type`;
- `financial_nature`;
- `origin`;
- `category`;
- `import_file_id`;
- `import_batch_group_id`;
- `raw_record_id`;
- `soft_hash`;
- `status`;
- `due_date`.

Em importacoes:

- `import_batches.status`;
- `import_batches.created_at`;
- `import_files.import_batch_id`;
- `import_files.status`;
- `raw_import_records.import_batch_id`;
- `raw_import_records.processed`.

Em IA:

- `ai_conversations.updated_at`;
- `ai_messages.conversation_id`;
- `ai_memories.kind`;
- `ai_recommendations.priority`.

### Pontos de Atencao

- `financial_transactions` tende a ser a maior tabela funcional;
- `raw_import_records` pode crescer rapidamente;
- `ai_messages` pode crescer com uso do assistente;
- anexos devem futuramente usar storage externo;
- analytics pode exigir indices adicionais conforme volume.

## 16. Constraints e Chaves

### Chaves Unicas

- `users.email`;
- `transactions.fingerprint`;
- `credit_card_purchases.fingerprint`;
- `categories.name`;
- `subcategories.category_id + name`;
- `financial_transactions.hash`;
- `financial_transactions.strict_hash`;
- `raw_import_records.raw_hash`;
- `invoice_reconciliations.account_transaction_id`;
- `payment_methods.name`;
- `tags.name`.

### Chaves Compostas

- `financial_transaction_tags.financial_transaction_id + tag_id`.

### Chaves Estrangeiras

As principais FKs ligam:

- `cards.payment_account_id -> accounts.id`;
- `transactions.account_id -> accounts.id`;
- `transactions.card_id -> cards.id`;
- `transactions.import_id -> imports.id`;
- `transactions.category_id -> categories.id`;
- `transactions.subcategory_id -> subcategories.id`;
- `credit_card_purchases.card_id -> cards.id`;
- `credit_card_purchases.import_id -> imports.id`;
- `classification_rules.category_id -> categories.id`;
- `classification_rules.subcategory_id -> subcategories.id`;
- `financial_transactions.raw_record_id -> raw_import_records.id`;
- `financial_transactions.import_file_id -> import_files.id`;
- `financial_transactions.import_batch_group_id -> import_batches.id`;
- `financial_transactions.invoice_id -> credit_card_invoices.id`;
- `financial_transactions.payment_method_id -> payment_methods.id`;
- `raw_import_records.import_batch_id -> imports.id`;
- `raw_import_records.import_file_id -> import_files.id`;
- `raw_import_records.import_batch_group_id -> import_batches.id`;
- `import_files.import_batch_id -> import_batches.id`;
- `financial_transaction_tags.financial_transaction_id -> financial_transactions.id`;
- `financial_transaction_tags.tag_id -> tags.id`;
- `attachments.financial_transaction_id -> financial_transactions.id`;
- `financial_entry_audits.financial_transaction_id -> financial_transactions.id`;
- `ai_messages.conversation_id -> ai_conversations.id`.

## 17. Estrategia de Migrations

### Estado Atual

O banco atual foi evoluido durante o desenvolvimento com Prisma e sincronizacoes incrementais.

Como o banco SQLite local pode nao possuir historico completo de migrations desde o inicio, deve-se ter cuidado com `prisma migrate dev`, pois ele pode solicitar reset do banco em caso de drift.

### Regra Oficial

Nunca executar reset destrutivo sem backup e aprovacao explicita.

### Estrategia Recomendada

1. Criar backup do banco antes de mudancas estruturais.
2. Alterar `schema.prisma`.
3. Gerar migration quando o historico estiver consistente.
4. Se houver drift em ambiente local, usar `prisma migrate diff` para documentar SQL.
5. Aplicar mudancas com cuidado, evitando perda de dados.
6. Rodar `prisma generate`.
7. Executar build e testes.
8. Documentar novas tabelas e campos.

### Para Producao Futura

Em ambiente de producao, usar migrations versionadas e revisadas.

Recomendacoes:

- evitar `db push` em producao;
- usar migrations revisadas;
- criar rollback quando possivel;
- validar tempo de execucao;
- criar backups;
- testar em ambiente de homologacao;
- monitorar integridade apos deploy.

## 18. Estrategia de Evolucao do Modelo

### Curto Prazo

- manter `financial_transactions` como fonte central;
- evitar remover tabelas legadas;
- melhorar vinculos por IDs gradualmente;
- documentar status e enums funcionais;
- fortalecer auditoria.

### Medio Prazo

- migrar conciliacoes para `financial_transactions`;
- reduzir dependencia de `transactions`;
- reduzir dependencia de `credit_card_purchases`;
- criar relacionamentos formais com `accounts`, `cards`, `categories` e `subcategories`;
- avaliar PostgreSQL para maior escalabilidade.

### Longo Prazo

- multiusuario real;
- permissoes;
- Open Finance;
- storage externo para anexos;
- particionamento ou arquivamento de registros antigos;
- camada robusta de eventos e auditoria.

## 19. Resumo

O modelo de dados atual combina tabelas modernas e tabelas legadas.

A tabela central oficial e:

```text
financial_transactions
```

Ela deve continuar sendo a fonte principal para:

- Dashboard;
- Lancamentos;
- Relatorios;
- Analytics;
- Assistente Financeiro;
- Importacoes;
- Recomendacoes.

Tabelas legadas como `transactions` e `credit_card_purchases` devem ser mantidas ate que todas as dependencias sejam removidas com seguranca.

O modelo esta preparado para evoluir em direcao a:

- maior integridade relacional;
- multiusuario;
- analytics avancado;
- IA financeira;
- Open Finance;
- escalabilidade de dados.

