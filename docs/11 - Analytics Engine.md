# 11 - Analytics Engine

## 1. Proposito do Documento

Este documento descreve o Analytics Engine, ou Motor de Analytics, do sistema.

Ele documenta indicadores, KPIs, comparacoes, rankings, top categorias, top estabelecimentos, previsoes, Health Score, motor de insights, estrutura de consultas, performance, cache e estrategia de atualizacao.

O Analytics Engine e a camada responsavel por transformar lancamentos financeiros em conhecimento acionavel.

## 2. Objetivo do Analytics Engine

O objetivo do Analytics Engine e interpretar os dados financeiros do usuario e entregar informacoes claras, confiaveis e orientadas a decisao.

Ele deve responder perguntas como:

- Quanto entrou?
- Quanto saiu?
- Quanto sobrou?
- Qual categoria mais consumiu dinheiro?
- Qual despesa cresceu?
- Qual cartao esta sendo mais utilizado?
- Quanto posso economizar?
- Meu comportamento financeiro mudou?
- Existe risco de saldo negativo?

O Analytics Engine nao deve alterar dados financeiros. Ele deve apenas consultar, agregar, comparar e explicar.

## 3. Principios do Analytics Engine

### Fonte Unica de Verdade

Todas as analises devem partir da tabela principal de lancamentos financeiros.

Fonte oficial:

```text
financial_transactions
```

### Dados Reais

Nao utilizar dados ficticios.

Indicadores, graficos e insights devem ser calculados com base nos lancamentos existentes.

### Consistencia

Dashboard, relatorios e assistente financeiro devem consumir a mesma camada de analytics sempre que possivel.

### Reutilizacao

Agregacoes devem ser centralizadas para evitar calculos duplicados em diferentes modulos.

### Performance

Consultas devem ser otimizadas, cacheadas quando aplicavel e preparadas para crescimento de volume.

## 4. Responsabilidades

O Analytics Engine e responsavel por:

- calcular indicadores financeiros;
- gerar KPIs;
- comparar periodos;
- agrupar dados por categoria;
- agrupar dados por conta;
- agrupar dados por cartao;
- calcular rankings;
- identificar top despesas e receitas;
- montar calendario financeiro;
- preparar dados para dashboard;
- preparar contexto para IA;
- gerar base para insights e recomendacoes.

## 5. Dependencias

### Dependencias de Dados

- lancamentos financeiros;
- contas;
- cartoes;
- categorias;
- formas de pagamento;
- recorrencias;
- faturas;
- tags;
- status;
- vencimentos.

### Dependencias Funcionais

- Financial Engine;
- Import Engine;
- Assistente Financeiro;
- Dashboard;
- Relatorios;
- Configuracoes.

## 6. Indicadores

### Saldo Atual

Representa a posicao financeira atual considerando lancamentos com impacto de caixa.

Regra:

```text
saldo atual = soma das entradas de caixa - soma das saidas de caixa
```

### Receitas do Mes

Total de lancamentos classificados como receita no periodo.

### Despesas do Mes

Total de lancamentos classificados como despesa real no periodo.

### Resultado do Mes

Receitas do mes menos despesas do mes.

```text
resultado = receitas - despesas
```

### Cartao a Pagar

Total de compras de cartao ainda em aberto ou nao conciliadas.

### Contas Vencidas

Quantidade ou valor de lancamentos com vencimento anterior a data atual e status ainda nao liquidado.

### Lancamentos Pendentes

Quantidade de lancamentos que exigem revisao, classificacao ou confirmacao.

### Comparacao com Mes Anterior

Diferenca entre resultado atual e resultado do mes anterior.

Pode ser apresentada em:

- valor absoluto;
- percentual.

### Ticket Medio

Media dos valores de despesas ou compras no periodo.

```text
ticket medio = total de despesas / quantidade de despesas
```

### Gasto Medio Diario

Media diaria de despesas no periodo analisado.

```text
gasto medio diario = total de despesas / numero de dias
```

### Receita Media

Media dos lancamentos de receita.

```text
receita media = total de receitas / quantidade de receitas
```

### Economia do Mes

Valor positivo resultante da diferenca entre receitas e despesas.

Quando negativo, representa deficit.

### Maior Compra

Maior lancamento de despesa no periodo.

### Maior Receita

Maior lancamento de receita no periodo.

### Quantidade de Lancamentos

Total de lancamentos considerados no periodo e filtros aplicados.

## 7. KPIs

KPIs sao indicadores-chave usados para acompanhar a saude financeira.

### KPIs Atuais

- saldo atual;
- receitas;
- despesas;
- resultado;
- cartao a pagar;
- lancamentos pendentes;
- contas vencidas;
- ticket medio;
- gasto medio diario;
- economia do mes.

### KPIs Futuros

- taxa de economia;
- comprometimento da renda;
- percentual gasto por categoria;
- percentual de uso do cartao;
- previsibilidade de receita;
- crescimento de despesa;
- variacao de consumo;
- score financeiro.

## 8. Comparacoes

### Objetivo

Comparar periodos, categorias, contas, cartoes e comportamentos financeiros.

### Tipos de Comparacao

- mes atual vs mes anterior;
- periodo atual vs periodo anterior;
- categoria atual vs categoria anterior;
- cartao atual vs cartao anterior;
- receita atual vs receita anterior;
- despesa atual vs despesa anterior.

### Formula de Variacao Percentual

```text
variacao % = ((valor atual - valor anterior) / valor anterior) * 100
```

### Regras

- quando valor anterior for zero, variacao deve ser tratada com cuidado;
- comparacoes devem informar ausencia de base quando nao houver dados;
- variacoes muito altas podem indicar insight relevante;
- comparacoes devem respeitar filtros globais.

## 9. Rankings

### Objetivo

Ordenar dados financeiros por relevancia.

### Rankings Principais

- top despesas;
- top receitas;
- top categorias;
- top estabelecimentos;
- top contas movimentadas;
- top cartoes utilizados;
- top formas de pagamento.

### Regras

- rankings devem usar valor absoluto quando fizer sentido;
- despesas devem ser ordenadas por maior impacto;
- receitas devem ser ordenadas por maior entrada;
- itens ignorados nao devem aparecer em rankings principais;
- rankings devem respeitar filtros.

## 10. Top Categorias

### Objetivo

Identificar categorias que mais consomem recursos.

### Dados Considerados

- lancamentos de despesa real;
- categoria;
- valor;
- periodo;
- filtros.

### Saidas

- categoria;
- valor total;
- percentual sobre despesas;
- variacao vs periodo anterior;
- posicao no ranking.

### Regras

- categorias sem nome devem ser agrupadas como "Nao informado" ou "Outros";
- categoria "Transferencia" deve ser tratada separadamente quando nao representar consumo;
- ranking deve considerar apenas despesas reais.

## 11. Top Estabelecimentos

### Objetivo

Identificar pessoas, empresas ou estabelecimentos com maior impacto financeiro.

### Dados Considerados

- `person_company`;
- descricao normalizada;
- valor;
- periodo.

### Saidas

- estabelecimento;
- valor total;
- quantidade de lancamentos;
- ticket medio;
- categoria predominante.

### Regras

- descricoes devem ser normalizadas;
- aliases podem agrupar nomes equivalentes;
- estabelecimentos com nomes vazios devem ser classificados como "Nao identificado";
- transferencias internas podem ser excluidas do ranking principal.

## 12. Previsoes

### Objetivo

Projetar comportamento financeiro futuro com base em dados historicos, recorrencias e vencimentos.

### Previsoes Possiveis

- saldo previsto;
- despesas previstas;
- receitas previstas;
- faturas futuras;
- recorrencias proximas;
- risco de saldo negativo;
- capacidade de economia.

### Entradas

- lancamentos historicos;
- recorrencias;
- vencimentos;
- faturas;
- media de receitas;
- media de despesas;
- metas futuras.

### Saidas

- saldo previsto;
- alertas;
- simulacoes;
- recomendacoes;
- cenarios.

### Regras

- previsao deve indicar que e estimativa;
- recorrencias devem ter peso maior que medias historicas;
- eventos vencidos devem ser destacados;
- cenarios hipoteticos devem ser separados de dados realizados.

### Pontos de Atencao

- previsoes nao devem ser apresentadas como certeza;
- receitas variaveis reduzem confiabilidade;
- importacoes incompletas podem distorcer previsao;
- faturas futuras dependem de competencia e vencimento corretos.

## 13. Health Score

### Definicao

Health Score, ou Score Financeiro, e um indicador futuro que sintetiza a saude financeira do usuario.

Ele ainda deve ser tratado como conceito evolutivo.

### Possiveis Componentes

- saldo positivo;
- resultado mensal;
- taxa de economia;
- crescimento de despesas;
- uso de cartao;
- contas vencidas;
- lancamentos pendentes;
- previsibilidade de receitas;
- recorrencias controladas;
- nivel de endividamento.

### Exemplo Conceitual

```text
score financeiro =
  saldo positivo
  + economia mensal
  + baixa inadimplencia
  + baixo uso de cartao
  + despesas estaveis
  - contas vencidas
  - gastos em alta
  - saldo negativo
```

### Regras Futuras

- score deve ser explicavel;
- usuario deve entender o motivo da nota;
- score nao deve ser punitivo;
- score deve gerar recomendacoes praticas;
- score deve considerar perfil financeiro.

## 14. Motor de Insights

### Objetivo

Identificar automaticamente informacoes relevantes nos dados financeiros.

### Exemplos de Insights

- categoria cresceu mais de 20%;
- gasto com cartao esta proximo do limite;
- despesa recorrente aumentou;
- gasto medio diario subiu;
- saldo previsto pode ficar negativo;
- usuario possui muitos lancamentos pendentes;
- maior categoria concentra percentual elevado das despesas.

### Entradas

- indicadores;
- comparacoes;
- rankings;
- historico;
- recorrencias;
- faturas;
- limites.

### Saidas

- insights;
- alertas;
- recomendacoes;
- prioridades;
- impacto estimado.

### Regras

- insight deve ser baseado em dado real;
- insight deve possuir explicacao;
- insight deve ter prioridade;
- insight deve ser acionavel quando possivel;
- insights redundantes devem ser evitados.

## 15. Estrutura de Consultas

### Consulta Base

A consulta base deve buscar lancamentos financeiros e aplicar filtros.

Filtros comuns:

- periodo;
- conta;
- cartao;
- categoria;
- tipo;
- instituicao;
- tag;
- status.

### Camada de Agregacao

Apos consulta base, o Analytics Engine deve agregar em memoria ou no banco:

- receitas;
- despesas;
- saldos;
- categorias;
- contas;
- cartoes;
- estabelecimentos;
- datas;
- vencimentos.

### Consultas Auxiliares

Podem ser necessarias consultas para:

- contas;
- cartoes;
- recorrencias;
- faturas;
- tags;
- formas de pagamento.

### Regras

- evitar consultas repetidas para cada card;
- preferir consulta consolidada por tela;
- centralizar agregacoes em service;
- usar indices existentes;
- paginar quando houver listas extensas.

## 16. Performance

### Riscos de Performance

- muitos lancamentos em `financial_transactions`;
- muitas linhas brutas em importacoes;
- dashboards com muitos graficos;
- filtros combinados;
- historico grande de IA;
- consultas sem indice.

### Estrategias

- cache de analytics;
- agregacoes centralizadas;
- indices por data, competencia, categoria e status;
- paginacao;
- limitar rankings;
- lazy loading;
- pre-calculo futuro;
- jobs assincornos para grandes volumes.

### Regras

- dashboard nao deve disparar uma consulta por card;
- relatorios pesados devem ser separados;
- cache deve ter tempo limitado;
- alteracoes financeiras relevantes devem invalidar cache em fase futura.

## 17. Cache

### Objetivo

Reduzir custo de consultas repetidas e melhorar tempo de resposta.

### Cache Atual

O Analytics Engine possui cache em memoria de curta duracao.

Uso:

- dashboard analytics;
- filtros repetidos;
- respostas de curto prazo.

### Regras

- cache deve ser temporario;
- cache nao deve comprometer consistencia critica;
- cache deve considerar filtros como parte da chave;
- cache deve ser invalidado em operacoes financeiras importantes em evolucao futura.

### Evolucao Futura

- cache distribuido;
- Redis;
- invalidacao por evento;
- cache por usuario;
- pre-calculo por competencia.

## 18. Estrategia de Atualizacao

### Atualizacao Atual

O dashboard consulta o endpoint de analytics conforme filtros.

O backend calcula ou retorna cache valido.

### Atualizacao Recomendada

Eventos financeiros devem invalidar ou atualizar analytics.

Eventos relevantes:

- lancamento criado;
- lancamento editado;
- lancamento ignorado;
- importacao confirmada;
- categoria alterada;
- conta/cartao alterado;
- recorrencia criada;
- fatura conciliada.

### Fluxo Futuro

```text
Evento financeiro
  -> invalida cache
  -> recalcula metricas afetadas
  -> dashboard recebe dados atualizados
```

## 19. Entradas do Analytics Engine

- lancamentos financeiros;
- filtros;
- contas;
- cartoes;
- categorias;
- recorrencias;
- faturas;
- vencimentos;
- tags;
- status;
- formas de pagamento.

## 20. Saidas do Analytics Engine

- resumo financeiro;
- indicadores;
- KPIs;
- comparacoes;
- rankings;
- top categorias;
- top estabelecimentos;
- calendario financeiro;
- previsoes;
- insights;
- recomendacoes;
- contexto para IA.

## 21. Dependencias

### Depende de

- Financial Engine;
- modelo de dados;
- lancamentos consistentes;
- categorias bem classificadas;
- status corretos;
- datas e competencias confiaveis.

### Consumido por

- Dashboard;
- Relatorios;
- Assistente Financeiro;
- Motor de Insights;
- recomendacoes;
- futuras notificacoes.

## 22. Boas Praticas

- manter metricas documentadas;
- usar nomes consistentes com o Glossario Oficial;
- evitar duplicar regra no frontend;
- criar testes para KPIs criticos;
- diferenciar caixa de consumo real;
- nao misturar previsao com realizado;
- exibir ausencia de dados claramente;
- limitar tamanho de rankings;
- revisar performance conforme volume cresce.

## 23. Pontos de Evolucao

- Health Score formal;
- previsao de saldo;
- alertas automaticos;
- insights configuraveis;
- comparacoes anuais;
- metas financeiras;
- anomalias;
- segmentacao por perfil;
- cache distribuido;
- pre-calculos por periodo;
- dashboards personalizados.

## 24. Resumo

O Analytics Engine e a camada que transforma lancamentos em inteligencia financeira.

Ele deve:

- consultar dados reais;
- centralizar agregacoes;
- calcular indicadores;
- comparar periodos;
- gerar rankings;
- alimentar dashboards;
- apoiar relatorios;
- fornecer contexto ao Assistente Financeiro;
- preparar previsoes e insights futuros.

O sucesso do Analytics Engine depende diretamente da qualidade dos lancamentos, classificacoes, competencias, status e regras do Financial Engine.

