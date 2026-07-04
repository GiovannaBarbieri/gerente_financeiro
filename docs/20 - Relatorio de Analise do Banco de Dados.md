# 20 - Relatorio de Analise do Banco de Dados

## 1. Objetivo

Analisar todo o banco de dados atual para encontrar inconsistencias estruturais, campos duplicados, relacionamentos frageis, indices, constraints ausentes, tipos inadequados, tabelas legadas, colunas obsoletas e campos candidatos a remocao.

Esta analise nao executou migrations e nao alterou o banco. Foram consultados:

- `backend/prisma/schema.prisma`;
- schema fisico do SQLite via `sqlite_master`;
- foreign keys reais via `PRAGMA foreign_key_list`;
- indices reais;
- uso das tabelas no codigo backend;
- status das migrations via Prisma CLI.

## 2. Resumo Executivo

O banco esta funcional, mas reflete a evolucao historica do sistema. Hoje existem duas geracoes de modelo convivendo:

1. modelo legado:
   - `transactions`;
   - `credit_card_purchases`;
   - `imports`;
   - conciliacao ainda vinculada a `transactions`.

2. modelo atual:
   - `financial_transactions`;
   - `import_batches`;
   - `import_files`;
   - `raw_import_records`;
   - `credit_card_invoices`;
   - `payment_methods`;
   - `tags`;
   - auditoria, anexos, recorrencias e IA.

O principal risco tecnico nao e uma tabela isolada, mas a convivencia entre modelo legado e modelo novo, especialmente porque a tabela `invoice_reconciliations` ainda referencia `transactions`, enquanto os services atuais usam majoritariamente `financial_transactions`.

Tambem foi identificado um ponto critico de governanca: o banco fisico possui tabelas e colunas da migration, mas a tabela `_prisma_migrations` nao existe e `prisma migrate status` informa que a migration local nao foi aplicada.

## 3. Estado Atual do Banco

Banco:

- SQLite;
- arquivo: `backend/prisma/dev.db`;
- datasource Prisma: `file:./dev.db`;
- tabelas fisicas encontradas: 28;
- indices fisicos encontrados: 67;
- migration local encontrada: 1;
- tabela `_prisma_migrations`: ausente.

Tabelas existentes:

```text
accounts
ai_conversations
ai_memories
ai_messages
ai_recommendations
ai_settings
attachments
cards
categories
classification_feedbacks
classification_rules
credit_card_invoices
credit_card_purchases
financial_entry_audits
financial_transaction_tags
financial_transactions
import_batches
import_files
imports
invoice_reconciliations
payment_methods
raw_import_records
recurring_entries
saved_filters
subcategories
tags
transactions
users
```

## 4. Achados Criticos

### C1. Historico de migrations inconsistente

Classificacao: Critico

Evidencia:

- `npx prisma migrate status --schema prisma/schema.prisma` informa que a migration `20260704140000_phase4_financial_management` nao foi aplicada;
- a tabela `_prisma_migrations` nao existe no SQLite atual;
- o banco fisico, mesmo assim, contem tabelas e colunas criadas pela migration.

Impacto:

- alto risco de drift entre schema Prisma, migrations e banco real;
- ambientes novos podem nao reproduzir o banco atual;
- futuras migrations podem falhar, recriar objetos existentes ou gerar diffs inesperados;
- dificulta deploy, backup, restauracao e colaboracao.

Recomendacao:

- antes de qualquer nova migration, reconciliar o historico;
- criar baseline controlado;
- validar se o banco atual deve ser tratado como schema inicial;
- nao executar `migrate dev` sem revisar, porque o Prisma acredita que a migration esta pendente.

Acao futura sugerida:

```text
1. Fazer backup do dev.db.
2. Gerar dump/schema atual.
3. Definir baseline oficial.
4. Marcar migration como resolvida ou recriar historico de migrations.
5. Testar em banco vazio.
```

### C2. Conciliacao ainda aponta para tabela legada `transactions`

Classificacao: Critico

Evidencia:

Tabela `invoice_reconciliations`:

- `account_transaction_id -> transactions.id`;
- `card_id -> cards.id`;
- campos adicionais modernos existem: `invoice_id`, `payment_transaction_id`, `expected_amount`, `paid_amount`, `difference`.

Ao mesmo tempo, os services atuais consultam e atualizam `financial_transactions` para conciliacao moderna.

Impacto:

- conciliacao pode ficar desconectada do historico unico;
- pagamentos/faturas em `financial_transactions` nao possuem relacionamento forte com `invoice_reconciliations`;
- relatorios futuros podem buscar conciliacoes em uma tabela que aponta para lancamentos legados vazios;
- risco de duplicidade conceitual entre conciliacao antiga e nova.

Recomendacao:

- migrar `invoice_reconciliations` para apontar para `financial_transactions`;
- revisar `account_transaction_id` para `financial_transaction_id` ou separar `payment_transaction_id`;
- manter tabela legada apenas ate migrar dados e fluxos.

### C3. Modelo legado e modelo atual coexistem sem fronteira tecnica forte

Classificacao: Critico

Evidencia:

Tabelas legadas permanecem no schema:

- `transactions`;
- `credit_card_purchases`;
- `imports`.

Tabelas atuais:

- `financial_transactions`;
- `import_batches`;
- `import_files`;
- `raw_import_records`.

O codigo backend usa majoritariamente `financialTransaction`, mas o Prisma ainda expoe models legados e algumas relacoes seguem conectadas a eles.

Impacto:

- risco de salvar dados no lugar errado;
- documentacao, services e rotas podem divergir sobre a fonte oficial;
- analises financeiras podem somar tabelas erradas em evolucoes futuras;
- novos desenvolvedores podem usar `Transaction` ou `CreditCardPurchase` por engano.

Recomendacao:

- declarar `financial_transactions` como unica fonte operacional;
- marcar models legados como deprecated em documentacao tecnica;
- remover ou isolar endpoints/services que ainda dependerem de tabelas legadas;
- planejar migration de remocao apenas depois de confirmar que nao ha dados ou dependencias.

## 5. Achados Importantes

### I1. Campos textuais duplicam entidades relacionais

Classificacao: Importante

Evidencia em `financial_transactions`:

- `account_name` textual, mas existe tabela `accounts`;
- `card_name` textual, mas existe tabela `cards`;
- `category` textual, mas existe tabela `categories`;
- `subcategory` textual, mas existe tabela `subcategories`;
- `payment_method` textual e `payment_method_id` relacional;
- `institution` textual sem tabela propria.

Impacto:

- renomear categoria/cartao/conta nao atualiza historico automaticamente;
- risco de grafias diferentes para a mesma entidade;
- filtros por texto podem divergir de cadastros reais;
- dificulta integridade referencial e relatorios por ID.

Justificativa atual:

- o desenho facilita importacao e preserva o texto normalizado no momento da captura;
- reduz dependencia de cadastros manuais;
- e util enquanto classificacao automatica ainda evolui.

Recomendacao:

- manter campos textuais como snapshot;
- adicionar futuramente `account_id`, `card_id`, `category_id`, `subcategory_id`, `institution_id` quando o dominio estabilizar;
- definir regra oficial: texto como snapshot historico, ID como relacionamento atual.

### I2. Status e tipos como `String` livre

Classificacao: Importante

Evidencia:

Campos como estes sao `String`:

- `FinancialTransaction.sourceType`;
- `FinancialTransaction.transactionType`;
- `FinancialTransaction.financialNature`;
- `FinancialTransaction.origin`;
- `FinancialTransaction.status`;
- `FinancialTransaction.reviewStatus`;
- `ImportBatch.status`;
- `ImportFile.status`;
- `Card.status`;
- `Account.status`;
- `PaymentMethod.status`;
- `RecurringEntry.status`;
- `AIRecommendation.priority`.

Impacto:

- valores inconsistentes (`Pending`, `pending`, `Reviewed`, `reviewed`);
- bugs em filtros;
- dificuldade de criar dashboards confiaveis;
- impossibilidade de constraints fortes em SQLite sem CHECK manual.

Recomendacao:

- padronizar valores em constantes TypeScript;
- em uma fase futura, adicionar CHECK constraints ou enums se migrar para banco com suporte melhor;
- criar validators no backend para impedir novos valores fora do padrao.

### I3. Duplicidade entre `status` e `review_status`

Classificacao: Importante

Evidencia em `financial_transactions`:

- `status` default `pending`;
- `review_status` default `Pending`.

Ambos representam estados relacionados, mas com semanticas diferentes ainda pouco separadas.

Impacto:

- filtros podem usar o campo errado;
- inconsistencias de capitalizacao;
- dashboards podem contar pendencias de forma divergente;
- aumenta complexidade de UX.

Recomendacao:

- definir semantica oficial:
  - `status`: estado operacional/pagamento do lancamento;
  - `review_status`: estado de revisao/classificacao;
- padronizar valores;
- avaliar se ambos continuam necessarios apos a unificacao de lancamentos.

### I4. Hashes duplicados e com responsabilidades parcialmente sobrepostas

Classificacao: Importante

Evidencia em `financial_transactions`:

- `hash` unico;
- `strict_hash` unico;
- `soft_hash` indexado.

Em `raw_import_records`:

- `raw_hash` unico.

Em tabelas legadas:

- `transactions.fingerprint`;
- `credit_card_purchases.fingerprint`.

Impacto:

- duplicidade entre `hash` e `strict_hash` pode gerar confusao;
- `strict_hash` unico e nullable exige cuidado com comportamento do SQLite;
- `soft_hash` sem uniqueness pode gerar falsos positivos se for usado como chave forte;
- campos legados de fingerprint continuam no schema.

Recomendacao:

- documentar claramente:
  - `raw_hash`: deduplicacao/auditoria da linha bruta;
  - `strict_hash`: duplicidade exata da transacao normalizada;
  - `soft_hash`: similaridade/revisao manual;
  - `hash`: compatibilidade ou chave operacional atual;
- avaliar futura remocao de `hash` ou `strict_hash` se um deles virar redundante.

### I5. Relacionamentos de usuario preparados, mas sem foreign key

Classificacao: Importante

Evidencia:

Campos `user_id` aparecem em:

- `financial_transactions`;
- `raw_import_records`;
- `import_batches`;
- `classification_rules`;
- `classification_feedbacks`;
- `credit_card_invoices`;

Mas nao ha relacoes Prisma/SQLite para `users.id`.

Impacto:

- dados multiusuario futuros podem ficar orfaos;
- sem cascade/restrict;
- sem garantia de que `user_id` existe;
- risco quando autenticacao for implementada.

Recomendacao:

- enquanto sistema for monousuario, manter como preparacao;
- antes de autenticar usuarios, criar relacoes formais com `users`;
- adicionar indices nos `user_id` que forem filtrados.

### I6. Importacao possui duas camadas de lote simultaneas

Classificacao: Importante

Evidencia:

- `imports`: legado operacional, Int autoincrement;
- `import_batches`: lote moderno, UUID;
- `import_files`: arquivo do lote moderno;
- `raw_import_records.import_batch_id` aponta obrigatoriamente para `imports.id`;
- `raw_import_records.import_batch_group_id` aponta opcionalmente para `import_batches.id`;
- `financial_transactions.import_batch` textual;
- `financial_transactions.import_batch_id` aponta conceitualmente para `imports.id`, mas nao possui relation Prisma formal;
- `financial_transactions.import_batch_group_id` aponta para `import_batches.id`.

Impacto:

- rastreabilidade existe, mas esta mais complexa que o necessario;
- nomes confundem: `import_batch_id` aponta para `imports`, enquanto `import_batch_group_id` aponta para `import_batches`;
- services precisam criar registro legado mesmo no fluxo de lote moderno.

Recomendacao:

- definir `import_batches` + `import_files` como modelo final;
- renomear mentalmente/documentar `imports` como `legacy_imports`;
- futuramente migrar `raw_import_records.import_batch_id` para `legacy_import_id` ou substituir por `import_file_id/import_batch_group_id`.

### I7. Faturas de cartao sem relacionamento forte com `cards`

Classificacao: Importante

Evidencia:

`credit_card_invoices` possui:

- `card_id` indexado;
- `card_name` textual;
- mas no schema Prisma, `cardId` nao tem relation com `Card`.

Impacto:

- faturas podem referenciar cartao inexistente;
- duplicidade entre `card_id` e `card_name`;
- relatórios de cartão podem depender de texto.

Recomendacao:

- adicionar relation formal `CreditCardInvoice.card -> Card` futuramente;
- manter `card_name` como snapshot historico.

### I8. Ausencia de timestamps de atualizacao em algumas tabelas mutaveis

Classificacao: Importante

Evidencia:

Nao possuem `updated_at`:

- `accounts`;
- `cards`;
- `categories`;
- `subcategories`;
- `classification_rules`;
- `payment_methods`;
- `tags`;
- `credit_card_invoices`;
- `import_batches`;
- `import_files`.

Impacto:

- dificuldade de auditoria;
- sincronizacao futura mais fraca;
- caches e analytics incrementais ficam mais dificeis.

Recomendacao:

- adicionar `updated_at` em cadastros e entidades mutaveis;
- manter `created_at` somente em tabelas puramente historicas/auditoria.

## 6. Achados Opcionais

### O1. Tipos monetarios `Decimal` em SQLite

Classificacao: Opcional

Evidencia:

Campos monetarios usam `Decimal`, mas SQLite nao tem tipo decimal forte como bancos relacionais mais robustos.

Impacto:

- no SQLite, armazenamento depende de afinidade de tipo;
- risco pequeno no ambiente atual, mas relevante em valores financeiros se houver operacoes complexas.

Recomendacao:

- considerar armazenamento em centavos como inteiro em uma futura versao;
- ou migrar para PostgreSQL quando o sistema precisar de multiusuario/produção.

### O2. Competencia armazenada como texto `MM/YYYY`

Classificacao: Opcional

Evidencia:

Campos:

- `competence`;
- `invoice_competence`;
- `payment_competence`;
- `month`;
- `invoice_month`.

Impacto:

- consultas por intervalo dependem de parse/convencao;
- ordenacao lexicografica funciona parcialmente para `MM/YYYY` apenas se tratada com cuidado;
- historico legado usa `month`.

Recomendacao:

- manter para UX brasileira;
- adicionar futuramente `competence_year` e `competence_month`, ou usar formato `YYYY-MM` para ordenacao natural;
- padronizar o termo oficial entre `competence` e `month`.

### O3. Indices simples podem nao atender filtros combinados

Classificacao: Opcional

Evidencia:

`financial_transactions` possui varios indices simples:

- `transaction_date`;
- `competence`;
- `source_type`;
- `financial_nature`;
- `origin`;
- `category`;
- `status`;
- `due_date`.

Impacto:

- filtros reais costumam combinar competencia + categoria + origem + tipo;
- SQLite pode nao aproveitar multiplos indices simples de forma ideal.

Recomendacao:

- depois de popular a base, medir queries reais;
- considerar indices compostos:
  - `(competence, source_type)`;
  - `(competence, financial_nature)`;
  - `(competence, category)`;
  - `(transaction_date, source_type)`;
  - `(import_batch_group_id, import_file_id)`.

### O4. `ClassificationRule` duplica categoria por ID e nome

Classificacao: Opcional

Evidencia:

Campos:

- `category_id`;
- `subcategory_id`;
- `category_name`;
- `subcategory_name`.

Impacto:

- regra pode apontar para ID e nome divergentes;
- porem nomes permitem regra sem categoria cadastrada.

Recomendacao:

- manter enquanto a classificacao automatica evolui;
- futuramente escolher uma estrategia:
  - regras sempre por texto;
  - regras sempre por ID;
  - texto como snapshot e ID como vinculo preferencial.

### O5. Tabelas de IA sem usuario

Classificacao: Opcional

Evidencia:

Tabelas:

- `ai_conversations`;
- `ai_messages`;
- `ai_settings`;
- `ai_memories`;
- `ai_recommendations`.

Nao possuem `user_id`.

Impacto:

- suficiente para uso monousuario;
- bloqueia separacao multiusuario futura.

Recomendacao:

- adicionar `user_id` quando autenticacao entrar no roadmap;
- antes disso, manter simples.

## 7. Achados de Baixo Impacto

### B1. Capitalizacao inconsistente em defaults

Classificacao: Baixo impacto

Exemplos:

- `status` em `financial_transactions`: `pending`;
- `review_status`: `Pending`;
- `status` em `accounts/cards`: `Active`;
- `status` em `imports`: `processed`;
- `status` em `credit_card_invoices`: `Open`.

Impacto:

- baixo agora, mas pode gerar filtros inconsistentes.

Recomendacao:

- escolher padrao unico:
  - ou tudo PascalCase;
  - ou tudo lowercase.

### B2. Nomes mistos entre ingles e dominio financeiro brasileiro

Classificacao: Baixo impacto

Exemplos:

- `financial_nature`;
- `origin`;
- `competence`;
- `invoice_competence`;
- `person_company`;
- `account_name`.

Impacto:

- o modelo e compreensivel, mas ainda mistura termos de dominio brasileiro em ingles literal.

Recomendacao:

- manter por enquanto;
- documentar no Glossario Oficial;
- evitar renomear sem ganho real, pois renomear colunas gera migration ruidosa.

### B3. Campos de personalizacao visual no banco

Classificacao: Baixo impacto

Exemplos:

- `color`;
- `icon`;
- `favorite`;
- `hidden`;
- `sort_order`.

Impacto:

- nao prejudica regras financeiras;
- mistura configuracao visual com dominio.

Recomendacao:

- aceitavel para app simples;
- se crescer, separar preferencias de UI em tabela propria.

## 8. Campos Duplicados ou Sobrepostos

| Local | Campos | Classificacao | Comentario |
| --- | --- | --- | --- |
| `financial_transactions` | `status` e `review_status` | Importante | Estados diferentes, mas precisam semantica formal. |
| `financial_transactions` | `hash`, `strict_hash`, `soft_hash` | Importante | Funcoes devem ser documentadas e validadas. |
| `financial_transactions` | `import_batch`, `import_batch_id`, `import_batch_group_id`, `import_file_id`, `raw_record_id` | Importante | Rastreabilidade rica, mas nomes confundem legado/novo. |
| `financial_transactions` | `category` e possivel tabela `categories` | Importante | Texto sem FK; bom como snapshot, fraco como relacionamento. |
| `financial_transactions` | `account_name`, `card_name` e tabelas `accounts/cards` | Importante | Texto permite importacao, mas dificulta integridade. |
| `classification_rules` | `category_id` e `category_name` | Opcional | Flexivel, mas pode divergir. |
| `credit_card_invoices` | `card_id` e `card_name` | Importante | Falta relation formal com `cards`. |
| Legado | `transactions.fingerprint`, `credit_card_purchases.fingerprint`, `financial_transactions.hash` | Importante | Duas geracoes de deduplicacao coexistindo. |

## 9. Relacionamentos Relevantes

### Relacionamentos atuais fortes

- `financial_transactions.raw_record_id -> raw_import_records.id`;
- `financial_transactions.import_file_id -> import_files.id`;
- `financial_transactions.import_batch_group_id -> import_batches.id`;
- `financial_transactions.invoice_id -> credit_card_invoices.id`;
- `financial_transactions.payment_method_id -> payment_methods.id`;
- `raw_import_records.import_file_id -> import_files.id`;
- `raw_import_records.import_batch_group_id -> import_batches.id`;
- `import_files.import_batch_id -> import_batches.id`;
- `financial_transaction_tags.financial_transaction_id -> financial_transactions.id`;
- `attachments.financial_transaction_id -> financial_transactions.id`;
- `financial_entry_audits.financial_transaction_id -> financial_transactions.id`;
- `ai_messages.conversation_id -> ai_conversations.id`.

### Relacionamentos fracos ou ausentes

- `financial_transactions.import_batch_id` nao possui relation Prisma formal com `imports`;
- `financial_transactions.user_id` nao referencia `users`;
- `raw_import_records.user_id` nao referencia `users`;
- `import_batches.user_id` nao referencia `users`;
- `credit_card_invoices.card_id` nao referencia `cards`;
- `invoice_reconciliations.invoice_id` nao referencia `credit_card_invoices`;
- `invoice_reconciliations.payment_transaction_id` nao referencia `financial_transactions`;
- `invoice_reconciliations.account_transaction_id` referencia `transactions`, nao `financial_transactions`.

## 10. Indices e Constraints

### Pontos positivos

- `financial_transactions` possui indices nos principais filtros atuais;
- hashes fortes possuem unique:
  - `financial_transactions.hash`;
  - `financial_transactions.strict_hash`;
  - `raw_import_records.raw_hash`;
- categorias e tags possuem unique por nome;
- `subcategories` possui unique composto por categoria e nome;
- historico de IA possui indices por conversa e data;
- importacoes possuem indices por lote/status/instituicao.

### Pontos de atencao

| Tabela | Campo/indice | Classificacao | Comentario |
| --- | --- | --- | --- |
| `financial_transactions` | Falta indice composto por competencia + tipo/origem/categoria | Opcional | Importante quando base crescer. |
| `accounts` | `name` sem unique | Opcional | Pode permitir contas duplicadas com mesmo nome. |
| `cards` | `name` sem unique | Opcional | Pode permitir cartoes duplicados com mesmo nome. |
| `classification_rules` | Sem unique para keyword/source/category | Opcional | Pode gerar regras duplicadas conflitantes. |
| `credit_card_invoices` | Sem unique por card + invoice_competence | Importante | Pode permitir faturas duplicadas do mesmo cartao/mes. |
| `ai_settings` | Sem constraint de singleton | Opcional | Service pega primeira configuracao, mas banco permite varias. |
| `saved_filters` | Sem unique por scope + name | Baixo impacto | Pode ser aceitavel. |

## 11. Tabelas Legadas

### `transactions`

Classificacao: Importante

Status:

- tabela legada de movimentacoes de conta;
- quase nao usada pelos services atuais;
- ainda e referenciada por `invoice_reconciliations.account_transaction_id`.

Recomendacao:

- nao remover agora;
- migrar dependencia de conciliacao;
- apos isso, avaliar remocao.

### `credit_card_purchases`

Classificacao: Importante

Status:

- tabela legada de compras no cartao;
- modelo atual representa compras em `financial_transactions`;
- nao aparece como dependencia forte nos services atuais.

Recomendacao:

- nao remover agora;
- validar que nao ha dados historicos necessarios;
- remover em migration futura junto com endpoints legados.

### `imports`

Classificacao: Importante

Status:

- tabela legado-operacional ainda usada pelo fluxo atual;
- `raw_import_records.import_batch_id` depende obrigatoriamente dela;
- lote moderno usa `import_batches/import_files`.

Recomendacao:

- manter enquanto pipeline cria imports legados;
- planejar substituicao por `import_batches/import_files` como fonte unica.

## 12. Campos Candidatos a Remocao Futura

Nao remover nesta fase. Todos exigem revisao de uso, migration planejada e backup.

| Tabela | Campo | Classificacao | Condicao para remover |
| --- | --- | --- | --- |
| `financial_transactions` | `import_batch` | Opcional | Quando IDs relacionais cobrirem toda rastreabilidade. |
| `financial_transactions` | `import_batch_id` | Importante | Quando `imports` for removida ou renomeada para legado. |
| `financial_transactions` | `status` ou `review_status` | Importante | Somente se semantica for unificada. |
| `financial_transactions` | `hash` ou `strict_hash` | Importante | Somente apos definir chave oficial de duplicidade. |
| `classification_rules` | `category_name/subcategory_name` | Opcional | Se regras passarem a depender sempre de IDs. |
| `credit_card_invoices` | `card_name` | Opcional | Se `card_id` tiver FK e snapshot nao for necessario. |
| `accounts` | `current_balance` | Opcional | Se saldo for sempre calculado por lancamentos. |
| `cards` | `available_limit` | Opcional | Se limite disponivel for sempre calculado. |
| `invoice_reconciliations` | campos legados ligados a `transactions` | Critico | Apos migrar conciliacao para `financial_transactions`. |

## 13. Tipos Inadequados ou Fracos

| Campo | Tipo atual | Classificacao | Observacao |
| --- | --- | --- | --- |
| Valores monetarios | `Decimal` em SQLite | Opcional | Aceitavel localmente, mas considerar centavos inteiros ou PostgreSQL no futuro. |
| Status/tipos | `String` | Importante | Falta enum/constraint. |
| Competencia | `String` | Opcional | `MM/YYYY` e amigavel, mas ruim para ordenacao/intervalos. |
| JSON | `Json/JSONB` em SQLite | Baixo impacto | Funciona para Prisma, mas nao tem as mesmas garantias de PostgreSQL. |
| `user_id` | `Int?` sem FK | Importante | Preparacao incompleta para multiusuario. |

## 14. Recomendações por Prioridade

### Critico

1. Resolver o drift de migrations antes de criar novas migrations.
2. Planejar migracao de `invoice_reconciliations` para `financial_transactions`.
3. Isolar oficialmente tabelas legadas para impedir uso acidental.

### Importante

1. Padronizar valores de status, tipo, origem e natureza financeira.
2. Definir semantica entre `status` e `review_status`.
3. Definir modelo final de importacao: `import_batches/import_files/raw_import_records`.
4. Adicionar relacionamentos ausentes quando o dominio estabilizar.
5. Revisar `credit_card_invoices` para FK real com `cards`.
6. Adicionar `updated_at` em tabelas cadastrais mutaveis.

### Opcional

1. Criar indices compostos apos observar queries reais.
2. Avaliar dinheiro em centavos inteiros.
3. Padronizar competencia como `YYYY-MM` ou campos ano/mes.
4. Criar unique para `accounts.name`, `cards.name`, `credit_card_invoices(card_id, invoice_competence)`.
5. Avaliar separacao de preferencias visuais.

### Baixo impacto

1. Normalizar capitalizacao de defaults.
2. Melhorar nomenclatura em documentacao antes de renomear colunas.
3. Documentar campos visuais e de UX como configuracao.

## 15. Plano Seguro para Futuras Migrations

Antes de qualquer migration:

1. Fazer backup do `dev.db`.
2. Resolver `_prisma_migrations` ausente.
3. Criar um banco vazio em ambiente temporario.
4. Aplicar migrations do zero.
5. Comparar schema gerado com o schema atual.
6. Rodar build backend.
7. Testar importacao, cadastro manual, dashboard, contas, cartoes, categorias e IA.

Ordem recomendada de evolucao:

```text
1. Baseline/migration history
2. Constraints/status validation no backend
3. Relacionamentos ausentes sem remover colunas antigas
4. Migracao de invoice_reconciliations
5. Depreciacao de transactions/credit_card_purchases
6. Remocao de campos/tabelas legadas
```

## 16. Conclusao

O banco esta em uma fase intermediaria: ja possui uma tabela principal robusta (`financial_transactions`) e boas tabelas de suporte para importacao, auditoria, recorrencias e IA, mas ainda carrega estruturas legadas e algumas relacoes incompletas.

O ponto mais urgente e corrigir a governanca de migrations. Em seguida, a prioridade deve ser fechar a transicao para o modelo unificado, principalmente removendo a dependencia de `invoice_reconciliations` sobre `transactions` e definindo oficialmente `financial_transactions` como fonte unica de verdade.
