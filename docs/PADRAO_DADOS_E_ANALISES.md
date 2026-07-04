# Padrao de dados e analises financeiras

Este documento define quais tabelas entram em cada analise do sistema e qual regra deve ser usada para evitar resultados duplicados, principalmente no caso de pagamento de fatura do cartao.

## Tabela principal normalizada

### `financial_transactions`

Origem: todos os arquivos importados, depois de identificacao de layout, parser, normalizacao, validacao e classificacao.

Esta e a tabela oficial para dashboard, listagem, relatorios, conciliacao e futuras analises com IA.

Campos principais:

- `transaction_date`: data real da movimentacao ou compra.
- `competence`: competencia no padrao `MM/YYYY`, sempre derivada da data da movimentacao.
- `source_type`: `Conta` ou `Cartao`.
- `institution`: banco/instituicao.
- `account_name`: conta ou cartao.
- `transaction_type`: `Entrada`, `Saida`, `Compra` ou `Estorno`.
- `financial_nature`: `Receita`, `Despesa`, `Transferencia`, `Investimento`, `Cartao` ou `Ajuste`.
- `original_description`: texto original do arquivo.
- `normalized_description`: texto tratado para classificacao.
- `person_company`: pessoa ou empresa inferida.
- `amount`: valor absoluto padronizado.
- `category` e `subcategory`: classificacao final em texto.
- `origin`: `Pessoal`, `Fazenda`, `Empresa`, `Transferencia`, `Investimento`, `Outro`.
- `payment_method`: Pix, Credito, Debito, TED, Boleto etc.
- `reconciled`: status de conciliacao.
- `transfer_internal`: marca transferencia/investimento que nao entra em consumo real.
- `import_batch`: lote de importacao.
- `hash`: SHA256 para bloqueio de duplicidade.

## Tabelas legadas

As tabelas antigas abaixo podem existir no banco por compatibilidade do MVP inicial, mas nao devem mais alimentar dashboard ou relatorios.

O fluxo novo deve usar apenas `financial_transactions`.

## Tabelas auxiliares legadas

### `transactions`

Origem: extrato da conta corrente.

Representa o fluxo bancario real: dinheiro entrando ou saindo da conta.

Exemplos:

- Pix recebido
- Pix enviado
- Transferencias
- Boletos
- Pagamento de fatura
- Aplicacoes e resgates
- Debitos e creditos em conta

Campos importantes:

- `date`: data da movimentacao bancaria.
- `month`: mes da movimentacao bancaria, no formato `YYYY-MM`.
- `type`: `entrada` ou `saida`.
- `amount`: valor com sinal. Entrada positiva, saida negativa.
- `source`: normalmente `Conta`.
- `origin`: `Pessoal`, `Fazenda`, `Transferencia`, `Investimento`, `Cartao` ou `Outros`.
- `is_internal_transfer`: marca transferencias internas, aplicacoes, resgates e movimentos que nao devem ser tratados como consumo.
- `is_credit_card_payment`: marca pagamento de fatura.
- `is_reconciled`: indica se o pagamento de fatura foi conciliado com compras do cartao.

### `credit_card_purchases`

Origem: CSV/Excel da fatura do cartao.

Representa consumo detalhado no cartao.

Exemplos:

- Uber
- Mercado
- Restaurante
- Farmacia
- Assinaturas
- Compras parceladas

Campos importantes:

- `date`: data da compra. Deve ser usada para analise de consumo.
- `month`: mes da compra, no formato `YYYY-MM`.
- `invoice_month`: mes/fatura de referencia, usado para conciliacao.
- `amount`: valor da compra como numero positivo.
- `source`: representado na API como `Cartao`.
- `origin`: normalmente `Cartao`, `Pessoal` ou `Fazenda`, conforme classificacao.

### `invoice_reconciliations`

Origem: conciliacao entre `transactions` e `credit_card_purchases`.

Representa a comparacao entre:

- Pagamento da fatura no extrato bancario.
- Soma das compras detalhadas da fatura do cartao.

Campos importantes:

- `account_transaction_id`: pagamento de fatura vindo de `transactions`.
- `invoice_month`: fatura conciliada.
- `invoice_amount`: valor pago no banco.
- `purchases_amount`: soma das compras do cartao naquela fatura.
- `difference_amount`: diferenca entre pagamento e compras.
- `status`: `conciliada` ou `divergente`.

### `categories`, `subcategories`, `classification_rules`

Tabelas auxiliares.

Nao devem somar valores por conta propria. Servem para classificar e agrupar os dados vindos de `transactions` e `credit_card_purchases`.

## Padrao oficial por analise

### 1. Fluxo de caixa bancario

Objetivo: mostrar o que realmente entrou e saiu da conta corrente.

Usar:

- `transactions`

Incluir:

- Entradas bancarias.
- Saidas bancarias.
- Pagamento de fatura.
- Transferencias.
- Aplicacoes e resgates, se a visao for estritamente bancaria.

Nao usar:

- `credit_card_purchases`

Regra:

```text
fluxo_entradas = soma de transactions.amount > 0
fluxo_saidas = abs(soma de transactions.amount < 0)
saldo_bancario_mes = fluxo_entradas - fluxo_saidas
```

### 2. Consumo real

Objetivo: mostrar quanto foi consumido de verdade no mes.

Usar:

- `transactions`, excluindo pagamento de fatura e transferencias internas.
- `credit_card_purchases`, usando a data da compra.

Incluir:

- Despesas da conta corrente que sao consumo real.
- Compras detalhadas do cartao.

Excluir:

- `transactions.is_credit_card_payment = true`
- `transactions.is_internal_transfer = true`
- Aplicacoes e resgates classificados como investimento, quando a analise for custo de vida.

Regra:

```text
consumo_conta = abs(soma de transactions.amount < 0, sem fatura, sem transferencia interna)
consumo_cartao = soma de credit_card_purchases.amount pelo mes da compra
consumo_real = consumo_conta + consumo_cartao
```

### 3. Dashboard executivo

Deve mostrar dois blocos conceitualmente separados.

Bloco bancario:

- Entradas do mes: `transactions`
- Saidas do mes: `transactions`
- Saldo do mes: `transactions`
- Saldo acumulado: `transactions`
- Transferencias internas: `transactions.is_internal_transfer = true`

Bloco de consumo:

- Total no cartao: `credit_card_purchases`
- Total de gastos reais: `transactions` sem fatura/transferencia + `credit_card_purchases`
- Gastos por categoria: consolidado de consumo real
- Gastos no cartao por categoria: somente `credit_card_purchases`

### 4. Gastos por categoria

Objetivo: entender consumo por categoria.

Usar:

- `transactions` de saida, sem fatura e sem transferencia interna.
- `credit_card_purchases`.

Agrupar por:

- `category_id`
- `subcategory_id`

Nao incluir:

- Pagamento de fatura.
- Transferencias internas.
- Aplicacoes/resgates.

### 5. Cartao por categoria

Objetivo: entender compras feitas no cartao.

Usar:

- Apenas `credit_card_purchases`.

Agrupar por:

- `category_id`
- `subcategory_id`

Data:

- Usar `date` e `month` da compra.
- Nao usar data de pagamento da fatura.

### 6. Conciliacao de fatura

Objetivo: conferir se o valor pago no banco bate com as compras da fatura.

Usar:

- `transactions` com `is_credit_card_payment = true`.
- `credit_card_purchases` com `invoice_month` correspondente.

Regra:

```text
invoice_amount = abs(transactions.amount)
purchases_amount = soma credit_card_purchases.amount onde invoice_month = fatura
difference_amount = invoice_amount - purchases_amount
status = conciliada se abs(difference_amount) <= tolerancia
```

Ponto critico:

O mes da compra e o mes da fatura podem ser diferentes.

Exemplo:

- Compra em maio.
- Fatura vence/paga em junho.
- Consumo real entra em maio.
- Conciliacao entra na fatura de junho, se `invoice_month = 2026-06`.

### 7. Fazenda x pessoal

Objetivo: separar atividade rural do custo de vida pessoal.

Usar:

- `transactions` sem pagamento de fatura e sem transferencias internas.
- `credit_card_purchases`.

Agrupar por:

- `origin`

Padrao de origem:

- `Fazenda`: receitas e despesas rurais.
- `Pessoal`: custo de vida pessoal.
- `Investimento`: aplicacoes, resgates e movimentacoes financeiras.
- `Transferencia`: movimentacoes entre contas/proprias.
- `Cartao`: somente quando ainda nao foi classificado como pessoal ou fazenda.
- `Outros`: pendente de classificacao.

### 8. Relatorio Uber/Mobilidade

Objetivo: analisar gasto com Uber sem misturar assinatura Uber One.

Usar:

- `credit_card_purchases`

Filtro:

- Descricao contendo variacoes de Uber/Uberrides.

Separar:

- Uber corridas: descricoes de corrida.
- Uber One: descricoes contendo `UBER ONE`.

Metricas:

- Total por mes: soma das corridas.
- Quantidade de corridas: quantidade de compras classificadas como Uber corrida.
- Ticket medio: total / quantidade.
- Maior corrida.
- Menor corrida.
- Descricoes originais encontradas.

## Problemas possiveis nos resultados atuais

1. `invoice_month` pode estar sendo preenchido errado se a fatura nao vier claramente no arquivo ou se o usuario nao informar no upload.
2. Pagamentos de fatura dependem da descricao conter termos reconhecidos, como `PAGAMENTO DE FATURA` ou `PAGTO FATURA`.
3. Transferencias, aplicacoes e resgates podem distorcer o dashboard se nao forem bem classificadas.
4. Compras de cartao entram pelo mes da compra, enquanto conciliacao usa mes da fatura. Isso esta correto, mas precisa ficar visivel na tela.
5. Se o CSV do Nubank tiver colunas com nomes diferentes dos esperados, o importador pode mapear dados incompletos.

## Padrao recomendado para importacao

Todo CSV deve ser lido por parser estruturado. O sistema nao deve tratar a linha inteira como texto.

Regras do CSV:

- Delimitador padrao: virgula.
- Campos entre aspas devem ser respeitados.
- Espacos extras nos nomes das colunas devem ser removidos.
- Nomes de colunas devem ser normalizados antes do parser financeiro.
- Antes de salvar deve existir pre-visualizacao com colunas separadas e mapeadas.
- A gravacao so acontece depois da validacao dos campos obrigatorios.

### Conta corrente

Colunas padrao:

- `data_movimentacao`
- `descricao`
- `valor`
- `tipo_movimentacao`
- `origem_dados`

Regras:

- Entrada: valor positivo.
- Saida: valor negativo.
- Pagamento de fatura: marcar `is_credit_card_payment = true`.
- Transferencias proprias, aplicacoes e resgates: marcar `is_internal_transfer = true`.

### Cartao de credito

Colunas padrao:

- `data_compra`
- `descricao`
- `valor`
- `cartao`
- `competencia`
- `parcela`

Regras:

- Valor salvo positivo.
- `month` sempre derivado de `data_compra`.
- `invoice_month` deve vir da coluna `fatura` ou do mes informado no upload.
- Se nao houver fatura identificavel, registrar como pendente de competencia.

## Decisao de produto

O sistema deve sempre deixar claro qual visao esta sendo usada:

- Fluxo de Caixa: banco.
- Consumo Real: consumo sem duplicidade de fatura.
- Conciliacao: conferencia entre pagamento e fatura.
- Fazenda x Pessoal: resultado por origem.
