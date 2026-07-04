# 09 - Financial Engine

## 1. Proposito do Documento

Este documento define o Financial Engine, ou Motor Financeiro, do sistema.

Ele e a referencia oficial para regras financeiras, responsabilidades, dependencias, entradas, saidas e fluxos que sustentam lancamentos, receitas, despesas, transferencias, competencia, vencimento, saldos, fluxo de caixa, contas, cartoes, categorias, recorrencias, faturas e conciliacao.

O Motor Financeiro deve ser tratado como o coracao do sistema. Todas as funcionalidades de gestao, importacao, analytics, relatorios e assistente financeiro dependem da consistencia dessas regras.

## 2. Definicao do Financial Engine

O Financial Engine e o conjunto de regras, processos e servicos responsaveis por transformar dados financeiros em uma base confiavel, padronizada e analisavel.

Ele atua sobre:

- lancamentos manuais;
- lancamentos importados;
- contas;
- cartoes;
- categorias;
- faturas;
- recorrencias;
- transferencias;
- saldos;
- classificacoes;
- duplicidades;
- analytics;
- contexto financeiro para IA.

## 3. Principios do Motor Financeiro

### Lancamento como Entidade Central

Todo evento financeiro deve ser representado, sempre que aplicavel, como um lancamento.

Conta corrente, cartao, importacao e cadastro manual nao devem ser fluxos finais separados. Eles sao origens ou atributos de um lancamento.

### Separacao entre Caixa e Consumo Real

O sistema deve diferenciar:

- impacto no caixa;
- impacto no consumo real.

Essa separacao evita distorcoes, especialmente em:

- compras no cartao;
- pagamento de fatura;
- transferencias internas;
- investimentos;
- estornos.

### Rastreabilidade

Todo lancamento importado deve poder ser rastreado ate:

- lote;
- arquivo;
- linha bruta;
- parser;
- hash;
- origem.

### Consistencia

Indicadores, relatorios, dashboard e assistente devem consumir a mesma base financeira e respeitar as mesmas regras.

### Evolucao Incremental

Regras financeiras devem evoluir com compatibilidade. Tabelas legadas e campos antigos so devem ser removidos apos migracao segura.

## 4. Lancamentos

### Definicao

Lancamento e o registro financeiro individual que representa uma receita, despesa, transferencia, compra, pagamento, estorno ou ajuste.

### Responsabilidades

- armazenar evento financeiro;
- indicar valor;
- indicar data e competencia;
- indicar natureza financeira;
- indicar categoria;
- indicar conta/cartao;
- indicar origem;
- informar impactos financeiros;
- alimentar analytics e relatorios.

### Entradas

- cadastro manual;
- importacao;
- recorrencia;
- transferencia;
- conciliacao;
- ajuste;
- futura integracao externa.

### Saidas

- historico financeiro;
- saldos;
- fluxo de caixa;
- dashboards;
- relatorios;
- contexto para IA;
- auditoria.

### Regras de Negocio

- todo lancamento deve possuir data;
- todo lancamento deve possuir descricao;
- todo lancamento deve possuir valor;
- todo lancamento deve possuir competencia;
- categoria pode ser manual ou automatica;
- conta e cartao sao atributos opcionais;
- lancamentos ignorados nao devem impactar indicadores principais;
- lancamentos devem preservar origem e rastreabilidade;
- lancamentos importados devem manter vinculo com registro bruto.

### Fluxo Textual

1. Sistema recebe dados financeiros.
2. Sistema identifica origem.
3. Sistema valida campos minimos.
4. Sistema normaliza data, valor e descricao.
5. Sistema define competencia.
6. Sistema define natureza financeira.
7. Sistema define impactos de caixa e consumo real.
8. Sistema classifica categoria e subcategoria.
9. Sistema calcula hashes quando aplicavel.
10. Sistema verifica duplicidade.
11. Sistema salva lancamento.
12. Sistema disponibiliza dado para modulos consumidores.

## 5. Receitas

### Definicao

Receita e um lancamento que representa entrada de dinheiro ou aumento financeiro.

### Exemplos

- salario;
- recebimento de cliente;
- venda;
- reembolso recebido;
- rendimento;
- entrada manual.

### Responsabilidades

- aumentar saldo quando possui impacto de caixa;
- compor total de receitas do periodo;
- alimentar resultado do mes;
- alimentar fluxo financeiro.

### Entradas

- lancamento manual;
- extrato bancario;
- transferencia recebida, quando considerada receita real;
- recorrencia de receita.

### Saidas

- total de receitas;
- fluxo de caixa positivo;
- indicadores de receita media;
- comparacoes de periodo.

### Regras de Negocio

- receita normalmente tem impacto positivo no caixa;
- receita deve ser diferenciada de transferencia interna;
- estornos nao devem ser confundidos automaticamente com receita real;
- recebimentos recorrentes podem ser tratados como receitas recorrentes.

### Pontos de Atencao

- reembolsos podem ser receita ou reducao de despesa, dependendo da regra futura;
- transferencias entre contas nao devem inflar receitas;
- rendimentos e resgates precisam ser diferenciados de investimento.

## 6. Despesas

### Definicao

Despesa e um lancamento que representa gasto, consumo ou saida financeira.

### Exemplos

- mercado;
- restaurante;
- combustivel;
- assinatura;
- aluguel;
- compra no cartao;
- pagamento de boleto.

### Responsabilidades

- compor gastos do periodo;
- reduzir saldo quando possui impacto de caixa;
- compor consumo real quando representa gasto efetivo;
- alimentar categorias, rankings e recomendacoes.

### Entradas

- lancamento manual;
- extrato bancario;
- fatura de cartao;
- recorrencia;
- importacao.

### Saidas

- total de despesas;
- ranking de categorias;
- top gastos;
- gasto medio diario;
- ticket medio;
- insights e recomendacoes.

### Regras de Negocio

- despesa real deve impactar consumo real;
- despesa de conta geralmente impacta caixa;
- compra no cartao pode impactar consumo real antes de impactar caixa;
- pagamento de fatura nao deve duplicar despesa real;
- transferencias internas nao devem ser classificadas como despesa real.

### Pontos de Atencao

- pagamentos no cartao exigem separacao entre compra e pagamento;
- compras parceladas precisam preservar parcela e total;
- despesas recorrentes devem ser identificadas para planejamento.

## 7. Transferencias

### Definicao

Transferencia e movimentacao entre contas, cartoes, investimentos ou estruturas financeiras do proprio usuario.

### Exemplos

- transferencia entre contas;
- pagamento de fatura;
- aplicacao;
- resgate;
- movimentacao para investimento.

### Responsabilidades

- representar deslocamento interno de dinheiro;
- evitar distorcao de receita e despesa real;
- atualizar saldos quando aplicavel;
- permitir conciliacao.

### Entradas

- lancamento manual de transferencia;
- extrato bancario;
- pagamento de fatura;
- importacao;
- operacao de investimento.

### Saidas

- lancamentos relacionados;
- saldos atualizados;
- fluxo de caixa ajustado;
- transferencia identificada em analytics.

### Regras de Negocio

- transferencia interna nao deve ser despesa real;
- transferencia interna nao deve ser receita real;
- transferencia pode impactar caixa de uma conta especifica;
- transferencia entre contas deve gerar dois lados quando cadastrada manualmente;
- pagamento de fatura deve ser tratado como transferencia para evitar duplicidade com compras.

### Pontos de Atencao

- transferencias importadas podem aparecer apenas em uma ponta;
- fase futura deve criar relacionamento formal entre os dois lados;
- classificacao incorreta de transferencia distorce dashboard.

## 8. Competencia

### Definicao

Competencia e o periodo de referencia analitica do lancamento.

Formato recomendado:

```text
MM/AAAA
```

### Responsabilidades

- agrupar lancamentos por periodo;
- alimentar dashboard mensal;
- organizar faturas;
- permitir comparacoes;
- separar data de compra, pagamento e vencimento.

### Entradas

- data do lancamento;
- data da compra;
- mes de fatura;
- competencia informada manualmente;
- competencia calculada.

### Saidas

- filtros mensais;
- dashboard mensal;
- relatorios por periodo;
- agrupamento de faturas.

### Regras de Negocio

- quando nao informada, competencia deve ser derivada da data do lancamento;
- compras de cartao podem possuir competencia de compra e competencia de fatura;
- pagamento pode possuir competencia propria;
- competencia nao deve ser confundida com vencimento.

### Pontos de Atencao

- faturas podem cruzar meses;
- compras no fim do mes podem cair em fatura seguinte;
- relatorios devem deixar claro qual competencia esta sendo usada.

## 9. Vencimento

### Definicao

Vencimento e a data limite para pagamento de uma obrigacao financeira.

### Responsabilidades

- alimentar calendario financeiro;
- indicar contas vencidas;
- apoiar previsao de saldo;
- gerar alertas.

### Entradas

- cadastro manual;
- faturas;
- recorrencias;
- boletos;
- futuras integracoes.

### Saidas

- proximos vencimentos;
- contas vencidas;
- alertas;
- calendario financeiro.

### Regras de Negocio

- lancamento com vencimento anterior a data atual e sem status de pago/compensado pode ser considerado vencido;
- vencimento nao altera necessariamente a competencia;
- vencimento deve ser opcional para lancamentos sem obrigacao futura.

### Pontos de Atencao

- status precisa ser confiavel para identificar vencidos;
- faturas exigem vencimento por cartao;
- recorrencias devem gerar proximos vencimentos.

## 10. Saldo

### Definicao

Saldo e o resultado financeiro acumulado de uma conta, periodo ou visao.

### Tipos

- saldo inicial;
- saldo atual;
- saldo do mes;
- saldo acumulado;
- saldo previsto.

### Responsabilidades

- representar posicao financeira;
- alimentar dashboard;
- apoiar planejamento;
- indicar risco de saldo negativo.

### Entradas

- saldo inicial;
- receitas;
- despesas;
- transferencias;
- ajustes;
- recorrencias futuras.

### Saidas

- saldo por conta;
- saldo geral;
- saldo previsto;
- alertas.

### Regras de Negocio

- saldo atual deve considerar saldo inicial e lancamentos com impacto de caixa;
- compras no cartao podem nao impactar saldo de caixa imediatamente;
- pagamento de fatura impacta caixa;
- lancamentos ignorados nao devem alterar saldo;
- transferencias entre contas alteram saldos individuais, mas nao saldo consolidado.

### Pontos de Atencao

- saldo calculado pode divergir de saldo bancario importado;
- reconciliacao pode ser necessaria;
- campo armazenado de saldo deve ser tratado com cuidado.

## 11. Fluxo de Caixa

### Definicao

Fluxo de caixa representa entradas e saidas de dinheiro em determinado periodo.

### Responsabilidades

- medir liquidez;
- mostrar entradas e saidas;
- projetar saldo;
- apoiar decisao de curto prazo.

### Entradas

- receitas com impacto de caixa;
- despesas com impacto de caixa;
- pagamentos;
- transferencias;
- recorrencias futuras.

### Saidas

- entradas do periodo;
- saidas do periodo;
- resultado de caixa;
- previsao.

### Regras de Negocio

- somente lancamentos com `cashFlowImpact` devem compor fluxo de caixa;
- compras no cartao podem compor consumo real, mas nao fluxo de caixa ate pagamento;
- pagamento de fatura compoe fluxo de caixa;
- transferencias internas devem ser tratadas separadamente.

### Pontos de Atencao

- fluxo de caixa e consumo real sao visoes diferentes;
- dashboards devem deixar clara a metrica usada;
- recorrencias futuras melhoram previsao.

## 12. Contas

### Definicao

Conta e uma origem ou destino financeiro usada em lancamentos.

### Responsabilidades

- organizar saldos;
- filtrar lancamentos;
- apoiar transferencias;
- representar caixa disponivel;
- vincular pagamentos de cartao.

### Entradas

- nome;
- banco;
- tipo;
- saldo inicial;
- status;
- cor;
- icone.

### Saidas

- saldo por conta;
- movimentacao por conta;
- filtros;
- contas para transferencia.

### Regras de Negocio

- conta ativa pode ser usada em novos lancamentos;
- conta arquivada permanece para historico;
- saldo deve considerar lancamentos vinculados;
- conta padrao pode ser sugerida em novos lancamentos.

### Dependencias

- lancamentos;
- transferencias;
- cartoes;
- dashboard;
- analytics.

## 13. Cartoes

### Definicao

Cartao e um meio de pagamento com limite, fatura, fechamento e vencimento.

### Responsabilidades

- agrupar compras;
- calcular limite utilizado;
- calcular limite disponivel;
- formar faturas;
- permitir conciliacao com pagamento.

### Entradas

- nome;
- banco;
- bandeira;
- limite;
- fechamento;
- vencimento;
- compras;
- pagamento.

### Saidas

- fatura atual;
- proxima fatura;
- limite utilizado;
- limite disponivel;
- compras do mes.

### Regras de Negocio

- compra no cartao e lancamento financeiro;
- compra no cartao geralmente impacta consumo real;
- compra no cartao nao deve impactar caixa imediatamente;
- pagamento de fatura impacta caixa;
- fatura agrupa compras por competencia/ciclo.

### Pontos de Atencao

- competencia da compra pode diferir da fatura;
- parcelas devem manter numero da parcela e total;
- fechamento e vencimento precisam ser precisos.

## 14. Categorias e Subcategorias

### Definicao

Categorias e subcategorias organizam lancamentos para analise.

### Responsabilidades

- agrupar gastos e receitas;
- alimentar dashboards;
- permitir relatorios;
- apoiar recomendacoes;
- orientar classificacao automatica.

### Entradas

- regras de classificacao;
- escolha manual;
- feedback do usuario;
- importacoes.

### Saidas

- rankings;
- graficos;
- insights;
- recomendacoes.

### Regras de Negocio

- categoria pode ser atribuida manualmente ou automaticamente;
- subcategoria e opcional, mas recomendada;
- categorias devem ter tipo coerente;
- categorias ocultas nao devem ser priorizadas;
- lancamentos sem categoria adequada devem ficar pendentes de revisao.

### Pontos de Atencao

- categorias demais dificultam analise;
- categorias genericas reduzem valor dos insights;
- mudancas de categoria afetam historico analitico.

## 15. Recorrencias

### Definicao

Recorrencia e um compromisso financeiro que se repete.

### Exemplos

- salario;
- aluguel;
- internet;
- academia;
- assinatura;
- mensalidade.

### Responsabilidades

- permitir previsao financeira;
- alimentar calendario;
- apoiar planejamento;
- identificar despesas fixas.

### Entradas

- nome;
- descricao;
- valor;
- frequencia;
- proxima data;
- data final;
- conta/cartao;
- categoria;
- forma de pagamento.

### Saidas

- proximas recorrencias;
- previsao de saldo;
- calendario financeiro;
- alertas.

### Regras de Negocio

- recorrencia ativa deve aparecer no calendario;
- recorrencia pausada/cancelada nao deve gerar previsao ativa;
- ocorrencia futura pode gerar lancamento em fase posterior;
- editar serie inteira e editar ocorrencia individual devem ser diferenciados futuramente.

### Pontos de Atencao

- recorrencias ainda podem nao gerar lancamentos automaticamente;
- previsao deve indicar diferenca entre realizado e previsto;
- cancelamentos devem preservar historico.

## 16. Faturas

### Definicao

Fatura e o agrupamento de compras de cartao em um ciclo.

### Responsabilidades

- agrupar compras;
- calcular total;
- indicar vencimento;
- indicar status;
- permitir conciliacao com pagamento.

### Entradas

- compras de cartao;
- competencia;
- fechamento;
- vencimento;
- pagamento;
- ajustes.

### Saidas

- fatura atual;
- proxima fatura;
- fatura fechada;
- fatura paga;
- fatura vencida;
- diferencas de conciliacao.

### Regras de Negocio

- compras de cartao devem compor fatura;
- pagamento de fatura deve ser conciliado com compras;
- fatura paga nao deve permanecer como pendente;
- diferenca entre valor pago e compras deve ser destacada.

### Pontos de Atencao

- pagamento parcial exige regra futura;
- compras parceladas devem ser alocadas corretamente;
- ciclo de fechamento pode alterar competencia da fatura.

## 17. Conciliacao

### Definicao

Conciliacao e o processo de conferir se pagamentos, faturas, saldos ou importacoes estao coerentes.

### Responsabilidades

- comparar pagamento de fatura com compras;
- identificar diferencas;
- marcar itens como conciliados;
- apoiar confiabilidade dos dados.

### Entradas

- pagamento de fatura;
- compras do cartao;
- competencia;
- valores esperados;
- valores pagos.

### Saidas

- conciliado;
- divergente;
- diferenca;
- alerta.

### Regras de Negocio

- diferenca pequena pode ser tolerada conforme regra configurada;
- pagamento de fatura conciliado deve ser marcado;
- divergencia deve ser exibida ao usuario;
- conciliacao nao deve apagar lancamentos.

### Pontos de Atencao

- conciliacao atual ainda e simplificada;
- depende de classificacao correta de pagamento de fatura;
- deve evoluir para considerar faturas formais.

## 18. Dependencias do Financial Engine

### Internas

- normalizacao;
- classificacao;
- hash de duplicidade;
- importacao;
- analytics;
- auditoria;
- cadastros financeiros.

### Externas Futuras

- Open Finance;
- provedores de IA;
- armazenamento de anexos;
- integracoes bancarias;
- notificacoes.

## 19. Entradas Gerais do Motor Financeiro

- arquivos importados;
- lancamentos manuais;
- recorrencias;
- transferencias;
- categorias;
- contas;
- cartoes;
- regras de classificacao;
- ajustes do usuario;
- futuras integracoes.

## 20. Saidas Gerais do Motor Financeiro

- lancamentos financeiros;
- saldos;
- fluxo de caixa;
- consumo real;
- faturas;
- conciliacoes;
- dashboards;
- relatorios;
- analytics;
- contexto para IA;
- recomendacoes;
- auditoria.

## 21. Fluxo Completo do Financial Engine

```text
Entrada financeira
  -> Identificacao da origem
  -> Leitura ou cadastro
  -> Normalizacao
  -> Validacao
  -> Definicao de competencia
  -> Definicao de natureza financeira
  -> Definicao de impactos
  -> Classificacao
  -> Deteccao de duplicidade
  -> Persistencia como lancamento
  -> Auditoria e rastreabilidade
  -> Agregacao em analytics
  -> Exibicao em dashboard/relatorios
  -> Contexto para Assistente Financeiro
```

## 22. Regras de Ouro

1. Lancamento e a entidade central.
2. Importacao e apenas uma forma de entrada.
3. Conta e cartao sao atributos do lancamento.
4. Receita e despesa devem ser separadas de transferencia.
5. Caixa e consumo real sao visoes diferentes.
6. Pagamento de fatura nao deve duplicar despesa.
7. Competencia nao e necessariamente vencimento.
8. Duplicidade deve ser verificada antes de salvar.
9. Classificacao automatica deve ser revisavel.
10. Toda informacao financeira relevante deve ser rastreavel.
11. Analytics deve consumir regras centralizadas.
12. IA deve consumir contexto resumido, nunca dados brutos sem necessidade.

## 23. Pontos de Evolucao

- formalizar relacionamento entre contas/cartoes e lancamentos por ID;
- formalizar relacionamento entre transferencias pareadas;
- evoluir faturas para ciclos precisos;
- suportar pagamento parcial de fatura;
- gerar lancamentos automaticamente a partir de recorrencias;
- evoluir conciliacao de saldos;
- criar score financeiro;
- adicionar previsao financeira;
- integrar Open Finance;
- ampliar auditoria.

