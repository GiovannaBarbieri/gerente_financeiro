# 05 - Glossario Oficial

## 1. Proposito do Documento

Este documento define a nomenclatura oficial do sistema.

Ele deve ser usado como referencia para telas, documentacao, regras de negocio, codigo, prompts, relatorios, analytics e comunicacao do produto.

O objetivo e evitar ambiguidades e garantir que os mesmos conceitos sejam tratados sempre com o mesmo nome.

## 2. Termos Centrais

### Lancamento

Registro financeiro individual que representa uma movimentacao, evento ou ajuste financeiro.

Um lancamento pode ser:

- receita;
- despesa;
- transferencia;
- pagamento de fatura;
- estorno;
- ajuste.

O lancamento e o conceito central do sistema. Todo dado financeiro deve, quando aplicavel, convergir para um lancamento.

### Lancamento Financeiro

Nome completo do conceito de lancamento. Pode ser usado em documentacao formal, mensagens explicativas e arquitetura.

Na interface, preferir o termo curto: Lancamento.

### Historico Financeiro

Conjunto consolidado de todos os lancamentos do usuario.

Inclui lancamentos manuais, importados, revisados, pendentes, ignorados e classificados.

### Movimentacao

Termo generico para uma entrada ou saida financeira.

Deve ser usado com cuidado. Na nomenclatura oficial, Lancamento e o termo principal.

### Transacao

Termo tecnico ou externo que pode aparecer em APIs, bancos ou sistemas financeiros.

No produto, preferir Lancamento.

## 3. Classificacao Financeira

### Receita

Lancamento que representa entrada de dinheiro ou aumento financeiro.

Exemplos:

- salario;
- recebimento de cliente;
- reembolso recebido;
- venda;
- rendimento.

### Despesa

Lancamento que representa gasto, consumo ou saida financeira.

Exemplos:

- mercado;
- restaurante;
- combustivel;
- assinatura;
- compra no cartao.

### Transferencia

Movimentacao entre contas, cartoes, investimentos ou estruturas financeiras do proprio usuario.

Transferencias nao devem ser tratadas como despesa real nem receita real quando representam apenas deslocamento interno de dinheiro.

Exemplos:

- transferencia entre contas;
- pagamento de fatura de cartao;
- aplicacao financeira;
- resgate de investimento.

### Estorno

Lancamento que representa devolucao, reversao ou cancelamento de uma despesa ou receita.

Exemplos:

- estorno de compra;
- devolucao de pagamento;
- cashback, quando tratado como reversao.

### Ajuste

Lancamento usado para corrigir saldo, diferencas ou inconsistencias.

Deve ser usado com moderacao e, sempre que possivel, com observacao explicativa.

### Natureza Financeira

Classificacao conceitual do lancamento.

Valores esperados:

- Receita;
- Despesa;
- Transferencia;
- Investimento;
- Cartao;
- Ajuste.

### Tipo do Lancamento

Classificacao operacional do lancamento.

Exemplos:

- Entrada;
- Saida;
- Compra;
- Estorno.

## 4. Organizacao por Categoria

### Categoria

Grupo principal usado para organizar lancamentos.

Exemplos:

- Alimentacao;
- Mobilidade;
- Moradia;
- Saude;
- Educacao;
- Investimentos;
- Cartao de Credito.

Categorias permitem analises, rankings, filtros e recomendacoes.

### Subcategoria

Detalhamento de uma categoria.

Exemplos:

- Categoria: Alimentacao;
- Subcategorias: Mercado, Restaurante, Ifood.

### Categoria Favorita

Categoria marcada para acesso rapido ou destaque.

### Categoria Oculta

Categoria que permanece no sistema, mas nao deve ter destaque em seletores ou analises principais.

### Classificacao

Processo de atribuir categoria, subcategoria, origem e natureza financeira a um lancamento.

Pode ser manual, automatica por regra ou assistida por IA em evolucoes futuras.

### Regra de Classificacao

Condicao usada pelo sistema para classificar lancamentos automaticamente.

Exemplo:

- se a descricao contem "UBER", classificar como Mobilidade / Uber.

### Confianca da Classificacao

Indicador que representa o nivel de seguranca da classificacao automatica.

Classificacoes com baixa confianca devem ser revisadas pelo usuario.

## 5. Datas e Periodos

### Data do Lancamento

Data em que o evento financeiro ocorreu.

Exemplos:

- data da compra;
- data da movimentacao bancaria;
- data do recebimento.

### Competencia

Periodo ao qual o lancamento pertence para fins de analise.

Formato recomendado:

- MM/AAAA

Exemplo:

- 07/2026

A competencia pode ser diferente da data de pagamento ou vencimento.

### Vencimento

Data limite para pagamento de uma conta, fatura ou obrigacao financeira.

### Data de Pagamento

Data em que um lancamento foi efetivamente pago.

### Periodo

Intervalo de tempo usado para filtros e analises.

Exemplos:

- 7 dias;
- 30 dias;
- 90 dias;
- 12 meses;
- mes atual;
- ano atual.

### Calendario Financeiro

Visao organizada de eventos financeiros futuros ou vencidos.

Inclui:

- proximos vencimentos;
- recorrencias;
- faturas;
- contas vencidas.

## 6. Saldos e Valores

### Valor

Quantia monetaria associada a um lancamento.

### Saldo

Resultado financeiro acumulado em uma conta ou visao.

Pode representar:

- saldo atual;
- saldo do mes;
- saldo previsto;
- saldo acumulado.

### Saldo Atual

Saldo calculado ate o momento atual com base em saldo inicial e lancamentos.

### Saldo Inicial

Valor inicial informado para uma conta antes dos lancamentos registrados no sistema.

### Saldo Previsto

Estimativa de saldo considerando lancamentos futuros, recorrencias ou vencimentos conhecidos.

### Resultado do Mes

Receitas do mes menos despesas do mes.

### Fluxo de Caixa

Movimento de entradas e saidas de dinheiro em determinado periodo.

### Consumo Real

Gasto efetivo do usuario, evitando distorcoes causadas por transferencias internas ou pagamento de fatura.

### Valor Movimentado

Soma dos valores processados em determinado contexto, como uma importacao ou relatorio.

## 7. Contas e Cartoes

### Conta

Conta financeira vinculada a lancamentos.

Exemplos:

- conta corrente;
- conta poupanca;
- conta digital;
- conta investimento.

### Conta Padrao

Conta principal sugerida pelo sistema para novos lancamentos.

### Conta Arquivada

Conta mantida no historico, mas que nao deve ser priorizada para novos lancamentos.

### Cartao

Cartao de credito usado como meio de pagamento e vinculado a lancamentos.

### Limite

Valor maximo disponibilizado no cartao.

### Limite Utilizado

Parte do limite comprometida por compras e faturas em aberto.

### Limite Disponivel

Limite total menos limite utilizado.

### Fatura

Agrupamento de compras de cartao em uma determinada competencia ou ciclo.

### Fatura Atual

Fatura em aberto referente ao ciclo atual do cartao.

### Proxima Fatura

Fatura futura, geralmente composta por compras ainda nao vencidas ou proximas competencias.

### Fechamento

Dia em que o ciclo da fatura e encerrado.

### Vencimento da Fatura

Dia limite para pagamento da fatura.

### Pagamento de Fatura

Lancamento geralmente originado de uma conta e associado ao pagamento de compras realizadas no cartao.

## 8. Importacao e Dados Externos

### Importacao

Processo de entrada automatizada de dados financeiros por meio de arquivos ou integracoes.

### Importacao Inteligente

Fluxo em que o sistema detecta automaticamente tipo de arquivo, instituicao, parser, colunas, duplicidades e erros.

### Importar Extratos

Nome preferencial da experiencia de importacao para o usuario.

Evitar termos como "importar conta" ou "importar cartao" na experiencia principal.

### Lote de Importacao

Conjunto de arquivos processados em uma mesma operacao.

### Arquivo de Importacao

Arquivo individual dentro de um lote.

### Linha Bruta

Registro original lido do arquivo importado, antes de normalizacao.

### Registro Bruto

Representacao persistida da linha bruta para fins de auditoria e rastreabilidade.

### Parser

Componente responsavel por interpretar um arquivo ou conjunto de linhas e transformar dados externos em estrutura compreensivel pelo sistema.

### Parser Registry

Registro central de parsers disponiveis, usado para selecionar automaticamente o parser mais adequado.

### Mapeamento de Colunas

Processo de associar colunas externas a campos internos padronizados.

Exemplo:

- `date` -> Data do Lancamento;
- `title` -> Descricao;
- `amount` -> Valor.

### Normalizacao

Processo de transformar dados externos em um padrao interno consistente.

Inclui:

- datas;
- valores;
- descricoes;
- nomes de colunas;
- competencia;
- natureza financeira.

### Pre-validacao

Etapa anterior ao salvamento que verifica colunas, campos obrigatorios, erros, duplicidades e previa dos dados.

### Duplicidade

Situacao em que um lancamento possivelmente ja existe no sistema.

### Hash

Identificador tecnico calculado a partir de dados do lancamento para detectar duplicidade.

### Hash Estrito

Hash usado para identificar duplicidade com maior precisao.

### Hash Flexivel

Hash usado para identificar possivel duplicidade, aceitando pequenas variacoes.

## 9. Analytics e Indicadores

### Analytics

Camada responsavel por transformar lancamentos em indicadores, comparacoes, rankings, tendencias e informacoes analiticas.

### Dashboard Executivo

Tela principal de analise financeira, baseada em analytics.

### Indicador

Medida calculada que representa um aspecto financeiro.

Exemplos:

- ticket medio;
- gasto medio diario;
- receita media;
- economia do mes.

### Insight

Conclusao relevante derivada dos dados financeiros.

Exemplo:

- "Gastos com alimentacao aumentaram 18% no mes."

### Recomendacao

Sugestao acionavel gerada pelo sistema ou assistente.

Exemplo:

- "Reduzir gastos com delivery pode gerar economia estimada de R$ 300."

### Ranking

Lista ordenada por relevancia, geralmente por valor.

Exemplos:

- top despesas;
- top receitas;
- top categorias;
- top estabelecimentos.

### Variacao

Diferenca percentual ou absoluta entre periodos.

### Comparacao com Mes Anterior

Analise que compara indicadores do mes atual com o mes imediatamente anterior.

### Ticket Medio

Media de valor por lancamento de despesa ou compra.

### Gasto Medio Diario

Media diaria de despesas em determinado periodo.

### Receita Media

Media de receitas em determinado periodo.

### Economia do Mes

Resultado positivo entre receitas e despesas do mes.

### Score Financeiro

Indicador futuro que podera sintetizar saude financeira com base em saldo, despesas, receitas, recorrencias, endividamento, previsibilidade e comportamento.

O score financeiro ainda deve ser tratado como conceito evolutivo, nao como regra consolidada.

## 10. Motores do Sistema

### Motor Financeiro

Conjunto de servicos responsaveis por processar regras financeiras centrais.

Inclui:

- lancamentos;
- importacoes;
- normalizacao;
- classificacao;
- duplicidade;
- saldos;
- faturas;
- analytics.

### Motor de Importacao

Parte do Motor Financeiro responsavel por receber, interpretar, validar e salvar dados importados.

### Motor de Classificacao

Parte do Motor Financeiro responsavel por categorizar lancamentos com base em regras e descricoes.

### Motor de Analytics

Camada responsavel por agregacoes, indicadores, comparacoes e rankings.

### Motor de IA

Camada responsavel por preparar contexto, construir prompts, chamar provedores de IA, receber respostas, armazenar conversas, manter memoria e gerar recomendacoes.

### AI Engine

Nome tecnico do Motor de IA.

### Provedor de IA

Servico ou modelo utilizado para gerar respostas inteligentes.

Exemplos:

- OpenAI;
- Claude;
- Gemini;
- Ollama;
- LM Studio;
- Azure OpenAI;
- provider local.

### Contexto Financeiro

Resumo estruturado dos dados financeiros enviado ao Motor de IA.

Deve conter apenas informacoes necessarias e agregadas.

### Compressao de Contexto

Processo de reduzir o tamanho do contexto enviado ao provedor de IA.

### Prompt

Instrucao enviada ao provedor de IA.

### Prompt Template

Modelo padronizado de prompt para determinado tipo de analise.

Exemplos:

- resumo financeiro;
- analise de gastos;
- planejamento;
- simulacao;
- comparacao.

### Memoria

Informacoes persistidas sobre objetivos, preferencias e assuntos relevantes do usuario.

### Conversa

Historico de mensagens entre usuario e Assistente Financeiro.

## 11. Status e Estados

### Pendente

Lancamento que ainda exige revisao, confirmacao ou classificacao.

### Pago

Lancamento liquidado ou quitado.

### Compensado

Lancamento confirmado no fluxo financeiro.

### Revisado

Lancamento conferido pelo usuario.

### Ignorado

Lancamento mantido no historico, mas sem impacto financeiro principal.

### Ativo

Item disponivel para uso.

### Arquivado

Item preservado no historico, mas nao priorizado para novos usos.

### Oculto

Item escondido da experiencia principal, mas ainda existente.

## 12. Planejamento e Recorrencias

### Recorrencia

Lancamento ou compromisso financeiro que se repete em determinada frequencia.

Exemplos:

- aluguel;
- internet;
- academia;
- assinatura;
- salario.

### Frequencia

Periodicidade de uma recorrencia.

Exemplos:

- diaria;
- semanal;
- mensal;
- anual.

### Meta Financeira

Objetivo financeiro planejado pelo usuario.

Exemplos:

- viagem;
- reserva de emergencia;
- carro;
- casa;
- quitar divida.

### Simulacao

Analise hipotetica de impacto financeiro.

Exemplos:

- "E se eu economizar R$ 500 por mes?"
- "E se eu cancelar uma assinatura?"

### Planejamento Financeiro

Processo de organizar metas, prazos, valores e capacidade mensal para atingir um objetivo.

## 13. Auditoria e Seguranca

### Auditoria

Registro de origem, alteracoes e processamento de dados.

### Rastreabilidade

Capacidade de identificar de onde veio um dado e como ele foi transformado.

### Origem do Dado

Indica se o lancamento veio de:

- cadastro manual;
- importacao;
- sistema;
- futura integracao.

### Privacidade

Principio de limitar exposicao de dados financeiros ao minimo necessario.

### Anonimizacao

Processo de remover ou reduzir informacoes identificaveis.

### Dado Bruto

Informacao original antes de tratamento, normalizacao ou classificacao.

### Dado Agregado

Informacao resumida ou consolidada.

Exemplo:

- total gasto por categoria.

## 14. Nomenclaturas Preferenciais

### Usar

- Lancamento;
- Importar Extratos;
- Dashboard Executivo;
- Assistente Financeiro;
- Analytics;
- Conta;
- Cartao;
- Categoria;
- Subcategoria;
- Competencia;
- Vencimento;
- Fatura;
- Recomendacao;
- Insight.

### Evitar na Interface Principal

- Transacao, quando o usuario final deve ver Lancamento;
- Movimentacao, quando o contexto for o historico principal;
- Importar Conta;
- Importar Cartao;
- Fluxos separados para conta e cartao;
- Termos tecnicos como hash, parser e raw record sem explicacao.

### Uso Tecnico Permitido

Os seguintes termos podem aparecer em documentacao tecnica, logs ou telas avancadas:

- parser;
- hash;
- raw record;
- lote;
- normalizacao;
- registry;
- provider;
- prompt;
- contexto comprimido.

## 15. Regra Oficial de Linguagem

Em futuras implementacoes, documentacoes e telas:

- usar Lancamento como conceito principal;
- tratar Conta e Cartao como atributos do lancamento;
- usar Importar Extratos como fluxo unico de importacao;
- usar Categoria e Subcategoria para organizacao financeira;
- usar Analytics para camada de indicadores;
- usar Assistente Financeiro para experiencia de IA;
- evitar termos tecnicos quando o usuario nao precisar conhece-los;
- quando termo tecnico for necessario, apresentar explicacao curta.

