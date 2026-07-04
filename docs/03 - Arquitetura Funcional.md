# 03 - Arquitetura Funcional

## 1. Proposito do Documento

Este documento descreve a arquitetura funcional do sistema, mapeando os principais modulos, suas responsabilidades, dependencias, regras de negocio, fluxos, entradas, saidas e integracoes.

A arquitetura funcional deve servir como referencia oficial para evolucao do produto, planejamento de novas fases, validacao de escopo e alinhamento entre produto, negocio e tecnologia.

O sistema e organizado em torno de um conceito central:

> Lancamento Financeiro

Todos os modulos devem, direta ou indiretamente, contribuir para criar, organizar, enriquecer, analisar ou explicar lancamentos financeiros.

## 2. Visao Geral dos Modulos

Os principais modulos funcionais do sistema sao:

- Dashboard
- Lancamentos
- Importacoes
- Contas
- Cartoes
- Categorias
- Relatorios
- Analytics
- Assistente Financeiro
- Configuracoes

Cada modulo possui uma responsabilidade especifica, mas todos compartilham a mesma base financeira consolidada.

## 3. Dashboard

### Objetivo

Apresentar uma visao executiva e explicativa da situacao financeira do usuario, consolidando indicadores, graficos, comparacoes, alertas, contas, cartoes, categorias e calendario financeiro.

O Dashboard deve ser a principal ferramenta de acompanhamento financeiro.

### Responsabilidades

- exibir resumo financeiro;
- mostrar receitas, despesas, saldo e resultado;
- destacar variacoes em relacao a periodos anteriores;
- apresentar fluxo financeiro;
- listar categorias mais relevantes;
- mostrar saldos e movimentacoes por conta;
- mostrar utilizacao de cartoes;
- exibir proximos vencimentos e contas vencidas;
- destacar maiores despesas, receitas, estabelecimentos e categorias;
- apresentar indicadores financeiros.

### Dependencias

- Lancamentos financeiros consolidados;
- contas;
- cartoes;
- categorias;
- recorrencias;
- faturas;
- analytics;
- filtros globais.

### Regras de Negocio

- nao utilizar dados ficticios;
- todos os indicadores devem partir dos lancamentos existentes;
- despesas devem considerar impacto real de consumo quando aplicavel;
- receitas devem considerar entradas financeiras;
- cartao a pagar deve considerar compras no cartao ainda nao conciliadas/pagas;
- contas vencidas dependem de data de vencimento e status;
- lancamentos pendentes incluem itens nao revisados, sem categoria ou com origem indefinida.

### Fluxos

1. Usuario acessa o Dashboard.
2. Sistema carrega filtros globais.
3. Sistema consulta a camada de analytics.
4. A camada de analytics agrega dados dos lancamentos.
5. Dashboard renderiza cards, graficos, rankings e alertas.
6. Usuario pode alterar filtros.
7. Todos os blocos sao recalculados com base nos filtros.

### Entradas

- periodo;
- janela de analise;
- conta;
- cartao;
- categoria;
- tipo;
- instituicao;
- tags.

### Saidas

- cards de resumo;
- graficos de fluxo;
- ranking de categorias;
- widgets de contas;
- widgets de cartoes;
- calendario financeiro;
- top gastos;
- indicadores.

### Integracoes

- modulo de Analytics;
- modulo de Lancamentos;
- modulo de Contas;
- modulo de Cartoes;
- modulo de Categorias;
- modulo de Recorrencias;
- Assistente Financeiro, como fonte futura de explicacoes.

## 4. Lancamentos

### Objetivo

Centralizar todos os registros financeiros do sistema em um historico unico.

Lancamentos representam receitas, despesas, transferencias, pagamentos de fatura, estornos e ajustes.

### Responsabilidades

- listar lancamentos;
- filtrar por periodo, categoria, conta, cartao, tipo, status, origem e instituicao;
- permitir cadastro manual;
- permitir edicao;
- permitir marcar como revisado;
- permitir ignorar lancamento;
- exibir conta/cartao como atributos;
- manter a visao unica independentemente da origem do dado.

### Dependencias

- tabela principal de lancamentos financeiros;
- categorias;
- subcategorias;
- contas;
- cartoes;
- formas de pagamento;
- importacoes;
- classificacao;
- auditoria.

### Regras de Negocio

- todo registro financeiro deve ser tratado como lancamento;
- conta corrente e cartao nao devem ser fluxos separados na experiencia principal;
- lancamentos importados e manuais devem aparecer no mesmo historico;
- lancamentos ignorados nao devem impactar indicadores financeiros;
- categoria pode ser informada manualmente ou sugerida por classificacao;
- status deve indicar estado operacional do lancamento;
- exclusao preferencialmente deve ser logica, por meio de status ignorado.

### Fluxos

#### Cadastro Manual

1. Usuario clica em novo lancamento.
2. Preenche tipo, data, descricao, valor, conta/cartao, categoria e status.
3. Sistema normaliza dados basicos.
4. Sistema aplica classificacao quando categoria nao for informada.
5. Lancamento e salvo na base principal.
6. Historico e Dashboard sao atualizados.

#### Edicao

1. Usuario seleciona um lancamento.
2. Altera campos permitidos.
3. Sistema salva alteracoes.
4. Auditoria pode registrar mudancas.
5. Indicadores sao recalculados.

#### Revisao

1. Usuario marca lancamento como revisado.
2. Sistema atualiza status.
3. Lancamento deixa de aparecer como pendente.

### Entradas

- dados manuais;
- dados importados;
- ajustes de usuario;
- filtros;
- regras de classificacao.

### Saidas

- historico consolidado;
- lancamentos revisados;
- lancamentos ignorados;
- dados para dashboard;
- dados para relatorios;
- contexto para IA.

### Integracoes

- Importacoes;
- Analytics;
- Categorias;
- Contas;
- Cartoes;
- Assistente Financeiro;
- Relatorios.

## 5. Importacoes

### Objetivo

Permitir que o usuario importe extratos, faturas e arquivos financeiros de forma inteligente, com deteccao automatica, pre-validacao, revisao e salvamento no historico unico de lancamentos.

### Responsabilidades

- receber um ou varios arquivos;
- aceitar CSV e Excel;
- detectar instituicao;
- detectar tipo de arquivo;
- escolher parser adequado;
- mapear colunas;
- validar campos obrigatorios;
- detectar duplicidades;
- apresentar previa;
- permitir confirmacao da importacao;
- manter rastreabilidade por lote, arquivo e linha;
- salvar dados na base principal de lancamentos.

### Dependencias

- parser de arquivos;
- registry de parsers;
- servico de importacao em lote;
- servico de normalizacao;
- servico de classificacao;
- servico de hash;
- tabela de importacoes;
- tabela de registros brutos;
- tabela de lancamentos financeiros.

### Regras de Negocio

- usuario nao deve precisar escolher entre conta e cartao no fluxo principal;
- sistema deve detectar tipo e origem automaticamente quando possivel;
- campos obrigatorios devem ser validados antes de salvar;
- duplicidades devem ser detectadas por hashes;
- arquivos com erro nao devem bloquear todo o lote;
- dados brutos devem ser preservados para auditoria;
- resultado final sempre deve ser lancamento financeiro.

### Fluxos

#### Importacao Inteligente

1. Usuario arrasta ou seleciona arquivos.
2. Sistema envia arquivos para pre-visualizacao.
3. Import Manager orquestra deteccao e validacao.
4. Sistema retorna resumo por arquivo e consolidado.
5. Usuario revisa dados.
6. Usuario confirma importacao.
7. Sistema salva registros brutos e lancamentos.
8. Sistema exibe relatorio final.

#### Historico de Importacoes

1. Usuario acessa historico.
2. Sistema lista lotes anteriores.
3. Usuario abre detalhes do lote.
4. Sistema exibe arquivos, status, registros validos, duplicados e erros.

### Entradas

- arquivos CSV;
- arquivos XLS/XLSX;
- nomes de arquivos;
- colunas dos arquivos;
- dados brutos;
- escolhas do usuario na revisao.

### Saidas

- lote de importacao;
- arquivos processados;
- registros brutos;
- lancamentos financeiros;
- resumo de importacao;
- erros e duplicidades;
- relatorio final.

### Integracoes

- Lancamentos;
- Analytics;
- Categorias;
- Contas;
- Cartoes;
- Classificacao;
- Assistente Financeiro.

## 6. Contas

### Objetivo

Gerenciar contas financeiras utilizadas nos lancamentos, saldos, transferencias e analises.

### Responsabilidades

- cadastrar contas;
- editar contas;
- arquivar contas;
- controlar saldo inicial;
- calcular saldo atual;
- identificar banco, tipo, cor e icone;
- definir conta padrao;
- fornecer dados para filtros, dashboard e transferencias.

### Dependencias

- lancamentos financeiros;
- transferencias;
- dashboard;
- analytics;
- importacoes;
- configuracoes.

### Regras de Negocio

- uma conta pode estar ativa, arquivada ou oculta;
- saldo atual deve considerar saldo inicial e movimentacoes;
- conta arquivada nao deve ser priorizada em novos lancamentos;
- exclusao fisica deve ocorrer apenas quando nao houver dependencia;
- transferencias entre contas devem gerar lancamentos relacionados.

### Fluxos

1. Usuario cria ou edita conta.
2. Sistema salva dados cadastrais.
3. Lancamentos podem ser vinculados a essa conta.
4. Dashboard calcula saldo e movimentacao.
5. Conta pode ser usada em filtros e transferencias.

### Entradas

- nome;
- banco;
- tipo;
- saldo inicial;
- cor;
- icone;
- status;
- conta padrao.

### Saidas

- lista de contas;
- saldo por conta;
- movimentacao por conta;
- filtros;
- dados para dashboard.

### Integracoes

- Lancamentos;
- Dashboard;
- Analytics;
- Transferencias;
- Importacoes;
- Assistente Financeiro.

## 7. Cartoes

### Objetivo

Gerenciar cartoes de credito e permitir acompanhamento de limite, utilizacao, faturas e compras.

### Responsabilidades

- cadastrar cartoes;
- editar cartoes;
- arquivar cartoes;
- controlar limite;
- calcular limite utilizado e disponivel;
- registrar fechamento e vencimento;
- vincular conta de pagamento;
- exibir faturas e compras do mes.

### Dependencias

- lancamentos financeiros;
- faturas;
- contas;
- importacoes;
- dashboard;
- analytics.

### Regras de Negocio

- compras de cartao devem aparecer como lancamentos;
- cartao e atributo do lancamento, nao fluxo separado;
- limite disponivel depende do limite total e compras em aberto;
- pagamento de fatura deve ser conciliavel com compras;
- cartao arquivado nao deve ser priorizado em novos lancamentos.

### Fluxos

1. Usuario cadastra cartao.
2. Importacoes ou lancamentos manuais vinculam compras ao cartao.
3. Dashboard calcula utilizacao.
4. Faturas sao exibidas conforme competencia, vencimento e status.
5. Pagamentos podem ser conciliados.

### Entradas

- nome;
- banco;
- bandeira;
- limite;
- fechamento;
- vencimento;
- cor;
- status;
- conta de pagamento.

### Saidas

- lista de cartoes;
- limite utilizado;
- limite disponivel;
- fatura atual;
- proxima fatura;
- compras do mes.

### Integracoes

- Lancamentos;
- Importacoes;
- Contas;
- Faturas;
- Dashboard;
- Analytics;
- Assistente Financeiro.

## 8. Categorias

### Objetivo

Organizar lancamentos por tipo de gasto, receita, transferencia ou ajuste, permitindo analises financeiras claras.

### Responsabilidades

- cadastrar categorias;
- cadastrar subcategorias;
- definir tipo;
- configurar cor, icone e status;
- marcar favoritas ou ocultas;
- apoiar classificacao automatica;
- permitir filtros e relatorios.

### Dependencias

- lancamentos financeiros;
- regras de classificacao;
- dashboard;
- analytics;
- assistente financeiro.

### Regras de Negocio

- categoria deve representar agrupamento financeiro;
- subcategoria detalha a categoria;
- categorias ocultas nao devem ser priorizadas em selecoes;
- categorias favoritas podem ter destaque;
- categorias usadas em lancamentos nao devem ser removidas sem criterio;
- classificacao pode sugerir categoria automaticamente.

### Fluxos

1. Usuario cria ou edita categoria.
2. Categoria fica disponivel para lancamentos.
3. Regras de classificacao podem usar categoria.
4. Dashboard e relatorios agrupam dados por categoria.
5. Assistente utiliza categorias para explicar comportamento financeiro.

### Entradas

- nome;
- tipo;
- subcategorias;
- cor;
- icone;
- status;
- ordenacao;
- favorito;
- oculto.

### Saidas

- lista de categorias;
- ranking de gastos;
- filtros;
- graficos;
- classificacoes.

### Integracoes

- Lancamentos;
- Classificacao;
- Dashboard;
- Analytics;
- Relatorios;
- Assistente Financeiro.

## 9. Relatorios

### Objetivo

Apresentar analises especificas e detalhadas sobre areas financeiras relevantes.

### Responsabilidades

- agrupar relatorios existentes;
- apresentar analises por categoria;
- apresentar analises por fluxo financeiro;
- apresentar analises de cartoes;
- apresentar analises de contas;
- manter relatorios especificos, como mobilidade/Uber.

### Dependencias

- lancamentos financeiros;
- categorias;
- contas;
- cartoes;
- analytics;
- filtros.

### Regras de Negocio

- relatorios devem utilizar dados reais;
- relatorios devem respeitar filtros;
- relatorios especificos devem ser derivados de lancamentos;
- relatorios nao devem duplicar regras financeiras ja existentes.

### Fluxos

1. Usuario acessa relatorios.
2. Seleciona contexto ou periodo.
3. Sistema consulta dados consolidados.
4. Relatorio apresenta graficos, totais e listas.

### Entradas

- periodo;
- filtros;
- categoria;
- conta;
- cartao;
- origem;
- texto de busca.

### Saidas

- graficos;
- tabelas;
- rankings;
- totais;
- indicadores especificos.

### Integracoes

- Lancamentos;
- Analytics;
- Dashboard;
- Assistente Financeiro.

## 10. Analytics

### Objetivo

Centralizar agregacoes financeiras e transformar lancamentos em indicadores, comparacoes, tendencias e rankings.

### Responsabilidades

- calcular resumo financeiro;
- calcular fluxo financeiro;
- comparar periodos;
- agregar categorias;
- calcular indicadores por conta e cartao;
- gerar calendario financeiro;
- identificar top gastos e top receitas;
- fornecer dados ao Dashboard e Assistente.

### Dependencias

- lancamentos financeiros;
- contas;
- cartoes;
- categorias;
- recorrencias;
- faturas;
- filtros globais.

### Regras de Negocio

- analytics deve ser derivado da base principal de lancamentos;
- deve evitar consultas repetidas quando possivel;
- deve centralizar agregacoes;
- deve respeitar filtros globais;
- nao deve alterar lancamentos;
- nao deve alterar regras de importacao ou classificacao.

### Fluxos

1. Modulo consumidor solicita analytics.
2. Sistema aplica filtros.
3. Dados sao agregados.
4. Resultados sao cacheados quando aplicavel.
5. Dashboard, relatorios ou assistente consomem o resultado.

### Entradas

- periodo;
- janela de analise;
- filtros de conta, cartao, categoria, tipo, instituicao e tags.

### Saidas

- resumo;
- fluxo;
- categorias;
- contas;
- cartoes;
- calendario;
- top gastos;
- indicadores.

### Integracoes

- Dashboard;
- Relatorios;
- Assistente Financeiro;
- Lancamentos;
- Configuracoes.

## 11. Assistente Financeiro

### Objetivo

Permitir que o usuario converse com um assistente financeiro capaz de explicar dados, responder perguntas, sugerir melhorias, apoiar simulacoes e auxiliar planejamento.

O assistente nao deve ser apenas um chat. Ele deve consumir contexto financeiro estruturado e resumido.

### Responsabilidades

- montar contexto financeiro;
- resumir dados antes de enviar a provedores de IA;
- responder perguntas;
- gerar recomendacoes;
- apoiar planejamento;
- simular cenarios;
- persistir historico de conversas;
- manter memoria de objetivos e preferencias;
- permitir configuracao de provedor de IA.

### Dependencias

- analytics;
- lancamentos;
- categorias;
- contas;
- cartoes;
- recorrencias;
- recomendacoes;
- memoria;
- configuracoes de IA.

### Regras de Negocio

- IA nunca deve acessar diretamente o banco;
- IA deve consumir camada de contexto financeiro;
- dados brutos nao devem ser enviados sem necessidade;
- contexto deve ser resumido e comprimido;
- provedor de IA deve ser substituivel;
- recomendacoes devem ser explicaveis;
- assistente deve respeitar privacidade.

### Fluxos

#### Pergunta ao Assistente

1. Usuario envia pergunta.
2. Sistema cria ou recupera conversa.
3. Sistema monta contexto financeiro resumido.
4. Prompt Builder monta instrucao.
5. Provedor de IA gera resposta.
6. Resposta e salva no historico.
7. Memoria pode registrar objetivos relevantes.

#### Consulta de Recomendacoes

1. Sistema consulta contexto financeiro.
2. Motor de recomendacoes identifica pontos relevantes.
3. Recomendacoes sao exibidas ao usuario.

### Entradas

- pergunta do usuario;
- historico de conversas;
- contexto financeiro resumido;
- configuracoes de IA;
- memorias.

### Saidas

- resposta do assistente;
- recomendacoes;
- simulacoes;
- memoria atualizada;
- historico de conversa.

### Integracoes

- Analytics;
- Dashboard;
- Lancamentos;
- Configuracoes;
- Provedores de IA.

## 12. Configuracoes

### Objetivo

Centralizar preferencias, parametros e configuracoes operacionais do sistema.

### Responsabilidades

- armazenar preferencias gerais;
- configurar idioma, moeda e calendario;
- configurar provedor de IA;
- definir modelo, temperatura e limite de contexto;
- preparar futuras configuracoes de seguranca, usuarios e integracoes.

### Dependencias

- usuario;
- assistente financeiro;
- analytics;
- importacoes;
- cadastros financeiros.

### Regras de Negocio

- configuracoes devem ser persistidas;
- configuracoes sensiveis devem ser protegidas;
- chaves de API nao devem ser expostas integralmente;
- mudancas de configuracao nao devem quebrar dados existentes;
- configuracoes devem ser opcionais sempre que houver padrao seguro.

### Fluxos

1. Usuario acessa configuracoes.
2. Ajusta parametros.
3. Sistema salva preferencias.
4. Modulos consumidores usam novos parametros.

### Entradas

- preferencias gerais;
- provedor de IA;
- modelo;
- temperatura;
- idioma;
- limite de contexto;
- futuras chaves e integracoes.

### Saidas

- configuracoes persistidas;
- comportamento ajustado;
- provedores preparados.

### Integracoes

- Assistente Financeiro;
- Analytics;
- Importacoes;
- Usuario;
- Futuras integracoes externas.

## 13. Dependencias Funcionais Principais

### Lancamentos como Fonte Central

Lancamentos financeiros sao a base funcional do sistema. Dashboard, analytics, relatorios, assistente, contas, cartoes e categorias dependem da qualidade desses dados.

### Importacoes como Entrada Automatizada

Importacoes alimentam o historico financeiro e devem preservar rastreabilidade, validacao, duplicidade e auditoria.

### Categorias como Base de Analise

Categorias permitem que o sistema explique comportamento financeiro, gere rankings e ofereca recomendacoes.

### Analytics como Camada de Interpretacao

Analytics transforma lancamentos em indicadores e deve ser consumido por Dashboard, Relatorios e Assistente.

### IA como Camada de Explicacao

Assistente Financeiro consome contexto resumido e deve explicar, recomendar e simular sem alterar dados financeiros diretamente.

## 14. Principios Funcionais

- toda informacao financeira deve ter origem rastreavel;
- lancamentos devem permanecer unificados;
- modulos devem consumir servicos, nao duplicar regras;
- importacao deve ser segura e auditavel;
- analytics deve centralizar agregacoes;
- IA deve consumir contexto resumido;
- configuracoes devem permitir evolucao sem reescrita;
- experiencia do usuario deve esconder complexidade tecnica.

