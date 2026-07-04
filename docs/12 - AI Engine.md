# 12 - AI Engine

## 1. Proposito do Documento

Este documento descreve a arquitetura oficial do AI Engine, ou Motor de IA, do sistema.

Ele documenta Provider Layer, Prompt Builder, Context Builder, conversas, memoria, recomendacoes, simulacoes, modelos suportados, fluxo completo e estrategia para adicionar novos provedores como OpenAI, Claude, Gemini, Ollama e LM Studio.

O AI Engine deve ser uma camada independente de fornecedor, segura, modular e orientada por dados financeiros estruturados.

## 2. Objetivo do AI Engine

O objetivo do AI Engine e permitir que o sistema ofereca um Assistente Financeiro Inteligente capaz de:

- responder perguntas financeiras;
- explicar comportamento financeiro;
- gerar recomendacoes;
- apoiar planejamento;
- simular cenarios;
- lembrar objetivos e preferencias;
- consumir dados estruturados do sistema;
- preservar privacidade;
- trocar de provedor de IA sem reescrever o produto.

O AI Engine nao deve ser apenas um chat. Ele deve atuar como uma camada de inteligencia sobre o Financial Engine e o Analytics Engine.

## 3. Principios do AI Engine

### Independencia de Provedor

O sistema deve funcionar com diferentes fornecedores de IA.

Exemplos:

- OpenAI;
- Claude;
- Gemini;
- Ollama;
- LM Studio;
- Azure OpenAI;
- provider local.

### Dados Estruturados

A IA deve consumir dados estruturados e resumidos, nao acessar diretamente o banco.

### Privacidade

Nunca enviar dados brutos sem necessidade.

O contexto enviado ao provedor deve ser:

- resumido;
- agregado;
- limitado;
- minimamente necessario.

### Explicabilidade

Respostas e recomendacoes devem ser compreensiveis e, quando possivel, indicar a origem da conclusao.

### Substituibilidade

Adicionar ou trocar um modelo nao deve exigir alteracoes no Financial Engine, Analytics Engine ou frontend.

## 4. Arquitetura Geral

Fluxo conceitual:

```text
Pergunta do usuario
  -> Conversation Service
  -> Financial Context Service
  -> Context Compressor
  -> Prompt Builder
  -> AI Provider
  -> Response Formatter
  -> Memory Service
  -> Conversation History
  -> Resposta ao usuario
```

## 5. Camadas do AI Engine

### AI Engine

Camada orquestradora.

Responsabilidades:

- receber pergunta;
- criar ou recuperar conversa;
- buscar configuracoes de IA;
- montar contexto financeiro;
- construir prompt;
- chamar provider;
- formatar resposta;
- salvar historico;
- atualizar memoria.

### Provider Layer

Camada que abstrai fornecedores de IA.

Responsabilidades:

- expor interface comum;
- encapsular chamadas externas;
- padronizar entrada e saida;
- permitir troca de provedor;
- evitar acoplamento com APIs especificas.

### Prompt Builder

Camada responsavel por montar prompts.

Responsabilidades:

- detectar intencao;
- escolher template;
- montar instrucao de sistema;
- incluir pergunta do usuario;
- incluir contexto financeiro comprimido;
- definir limites e regras de resposta.

### Context Builder

Tambem chamado de Financial Context Service.

Responsabilidades:

- buscar dados financeiros estruturados;
- consumir analytics;
- montar resumo financeiro;
- incluir recomendacoes;
- incluir memorias relevantes;
- nunca enviar dados brutos desnecessarios.

### Context Compressor

Camada responsavel por limitar o tamanho do contexto.

Responsabilidades:

- reduzir arrays grandes;
- limitar texto;
- preservar informacoes essenciais;
- respeitar limite configurado.

### Conversation Service

Camada responsavel por historico de conversas.

Responsabilidades:

- criar conversa;
- listar conversas;
- recuperar mensagens;
- salvar mensagens do usuario;
- salvar respostas do assistente.

### Memory Service

Camada responsavel por memorias persistentes.

Responsabilidades:

- identificar objetivos;
- salvar preferencias;
- manter assuntos relevantes;
- disponibilizar memorias ao contexto.

### AI Recommendation Service

Camada responsavel por recomendacoes financeiras.

Responsabilidades:

- consumir contexto financeiro;
- gerar recomendacoes iniciais;
- persistir recomendacoes;
- disponibilizar recomendacoes para frontend e assistente.

### Response Formatter

Camada responsavel por preparar resposta final.

Responsabilidades:

- limpar resposta;
- padronizar formato;
- garantir legibilidade;
- preparar texto para exibicao.

## 6. Provider Layer

### Objetivo

Permitir suporte a multiplos modelos e provedores.

### Interface Conceitual

Todo provider deve implementar uma interface comum:

```text
AIProvider
  name
  complete(request) -> response
```

### Request Padrao

Um request para provider deve conter:

- system prompt;
- user prompt;
- pergunta original;
- contexto financeiro;
- modelo;
- temperatura;
- configuracoes adicionais.

### Response Padrao

O provider deve retornar:

- texto da resposta;
- metadados opcionais;
- informacoes de uso quando disponiveis;
- erros padronizados quando houver falha.

### Provider Local

Provider atual que gera respostas localmente com base no contexto financeiro.

Ele permite que o sistema funcione sem chave externa.

### OpenAI

Provider futuro para modelos da OpenAI.

Deve encapsular:

- chave API;
- modelo;
- temperatura;
- mensagens;
- timeout;
- tratamento de erro;
- limites de contexto.

### Claude

Provider futuro para modelos Anthropic Claude.

Deve encapsular:

- API key;
- modelo;
- mensagens;
- parametros especificos;
- tratamento de erro.

### Gemini

Provider futuro para modelos Google Gemini.

Deve encapsular:

- API key;
- modelo;
- formato de prompt;
- parametros de seguranca;
- tratamento de erro.

### Ollama

Provider futuro para modelos locais via Ollama.

Deve encapsular:

- URL local;
- modelo instalado;
- timeout maior;
- tratamento de indisponibilidade local.

### LM Studio

Provider futuro para modelos locais via servidor compativel.

Deve encapsular:

- endpoint local;
- modelo;
- compatibilidade com API estilo OpenAI;
- timeout e erros.

## 7. Como Adicionar Novos Provedores

### Passo 1: Criar Classe do Provider

Criar um provider implementando a interface `AIProvider`.

Exemplo conceitual:

```text
class OpenAIProvider implements AIProvider
```

### Passo 2: Implementar Metodo de Complete

O metodo deve receber request padrao e retornar texto.

Deve tratar:

- autenticacao;
- timeout;
- erro de rede;
- erro de limite;
- resposta vazia;
- formato inesperado.

### Passo 3: Registrar Provider

Adicionar provider na factory de providers.

Exemplo:

```text
provider = "openai" -> OpenAIProvider
```

### Passo 4: Expor Configuracao

Permitir escolher:

- fornecedor;
- modelo;
- temperatura;
- idioma;
- limite de contexto;
- chave API, quando aplicavel.

### Passo 5: Validar Privacidade

Garantir que apenas contexto resumido seja enviado.

### Passo 6: Testar

Testar:

- pergunta simples;
- contexto grande;
- erro de chave;
- timeout;
- resposta vazia;
- troca de provider.

## 8. Prompt Builder

### Objetivo

Montar prompts consistentes, seguros e orientados ao contexto financeiro.

### Responsabilidades

- detectar intencao;
- selecionar prompt template;
- montar mensagem de sistema;
- anexar contexto;
- limitar escopo da resposta;
- orientar o modelo a nao inventar dados.

### Intencoes Suportadas

- resumo financeiro;
- analise de gastos;
- planejamento;
- investimentos;
- economia;
- comparacoes;
- previsoes;
- explicacoes.

### Regras de Prompt

Todo prompt deve instruir o modelo a:

- usar apenas contexto fornecido;
- responder em portugues do Brasil;
- nao inventar dados;
- explicar limitacoes;
- evitar recomendacao de investimento especifica;
- sugerir proximos passos praticos.

## 9. Context Builder

### Objetivo

Construir contexto financeiro resumido para IA.

### Dados Incluidos

- resumo financeiro;
- receitas;
- despesas;
- saldo;
- categorias;
- cartoes;
- contas;
- recorrencias;
- insights;
- alertas;
- recomendacoes;
- memorias.

### Dados Evitados

- milhares de lancamentos brutos;
- linhas brutas de importacao;
- dados sensiveis sem necessidade;
- chaves;
- informacoes tecnicas irrelevantes.

### Regras

- usar Analytics Engine;
- resumir antes de enviar;
- limitar quantidade de itens;
- preservar privacidade;
- indicar que o contexto e agregado.

## 10. Conversation

### Objetivo

Persistir historico de interacoes entre usuario e assistente.

### Tabelas

- `ai_conversations`;
- `ai_messages`.

### Regras

- cada pergunta deve ser salva;
- cada resposta deve ser salva;
- conversa deve ter titulo;
- conversa pode ser marcada como favorita;
- historico deve ser recuperavel.

### Fluxo

```text
Nova pergunta
  -> cria ou recupera conversa
  -> salva mensagem do usuario
  -> gera resposta
  -> salva mensagem do assistente
  -> retorna resposta
```

## 11. Memory

### Objetivo

Permitir que o assistente lembre objetivos, preferencias e assuntos relevantes.

### Exemplos

- "Quero viajar em dezembro";
- "Quero comprar um carro";
- "Quero montar reserva de emergencia";
- "Prefiro reduzir gastos com delivery";
- "Tenho renda variavel".

### Tabela

- `ai_memories`.

### Regras

- memoria deve ser objetiva;
- memoria deve respeitar privacidade;
- usuario deve poder revisar ou desativar memoria em fase futura;
- memoria deve ser usada para melhorar contexto, nao para inventar dados.

## 12. Recommendations

### Objetivo

Gerar recomendacoes financeiras acionaveis.

### Exemplos

- reduzir categoria com maior crescimento;
- revisar cartao proximo do limite;
- investigar despesa recorrente;
- aumentar economia mensal;
- revisar lancamentos pendentes.

### Tabela

- `ai_recommendations`.

### Regras

- recomendacao deve ser baseada em dados reais;
- deve possuir prioridade;
- pode possuir impacto estimado;
- deve ser explicavel;
- nao deve alterar dados automaticamente.

## 13. Simulations

### Objetivo

Permitir cenarios hipoteticos.

### Exemplos

- "E se eu economizar R$ 500 por mes?";
- "E se eu cancelar Netflix?";
- "E se meu salario aumentar?";
- "Quanto preciso guardar para viajar?";
- "Quanto tempo para montar reserva?".

### Regras

- simulacao deve ser apresentada como hipotese;
- deve separar dados reais de dados simulados;
- deve mostrar impacto mensal e acumulado quando possivel;
- deve explicar premissas;
- nao deve salvar alteracoes financeiras sem confirmacao.

### Estrutura Futura

Simulacoes podem evoluir para:

- tabela propria;
- cenarios salvos;
- metas;
- acompanhamento.

## 14. Modelos Suportados

### Suporte Atual

- provider local.

### Suporte Arquitetural

O sistema esta preparado para:

- OpenAI;
- Claude;
- Gemini;
- Ollama;
- LM Studio;
- Azure OpenAI.

### Configuracoes

Cada provider pode usar:

- modelo;
- temperatura;
- idioma;
- limite de contexto;
- chave API;
- endpoint customizado futuro.

## 15. Configuracoes de IA

### Tabela

- `ai_settings`.

### Campos

- provider;
- model;
- temperature;
- language;
- context_limit;
- api_key_masked;
- created_at;
- updated_at.

### Regras

- chave API nao deve ser exposta integralmente;
- provider local deve funcionar como fallback;
- configuracoes devem ter padroes seguros;
- mudancas devem afetar novas conversas.

## 16. Fluxo Completo do AI Engine

```text
Usuario envia pergunta
  -> API /api/ai/chat
  -> valida entrada
  -> recupera configuracoes de IA
  -> cria ou recupera conversa
  -> salva mensagem do usuario
  -> monta contexto financeiro
  -> comprime contexto
  -> detecta intencao
  -> monta prompt
  -> seleciona provider
  -> chama modelo
  -> formata resposta
  -> salva resposta
  -> atualiza memoria se aplicavel
  -> retorna resposta ao usuario
```

## 17. Endpoints

### `POST /api/ai/chat`

Envia mensagem ao assistente.

Entrada:

- `conversationId`, opcional;
- `message`.

Saida:

- resposta;
- conversa;
- intencao;
- provider;
- informacao de privacidade do contexto.

### `GET /api/ai/history`

Lista conversas ou recupera conversa especifica.

### `GET /api/ai/context`

Retorna contexto financeiro resumido.

### `GET /api/ai/recommendations`

Retorna recomendacoes financeiras.

### `GET /api/ai/settings`

Retorna configuracoes de IA.

### `PATCH /api/ai/settings`

Atualiza configuracoes de IA.

## 18. Seguranca e Privacidade

### Regras

- nunca enviar dados brutos sem necessidade;
- resumir contexto antes de enviar;
- limitar tamanho do contexto;
- mascarar chaves;
- registrar apenas metadados necessarios;
- evitar expor dados sensiveis em logs;
- permitir provider local sem chamada externa.

### Dados Permitidos no Contexto

- totais;
- rankings;
- indicadores;
- categorias agregadas;
- contas agregadas;
- cartoes agregados;
- recomendacoes;
- memorias relevantes.

### Dados Evitados

- linhas brutas de importacao;
- dados bancarios completos;
- chaves;
- grandes listas de lancamentos;
- informacoes desnecessarias para a pergunta.

## 19. Logs e Auditoria

### Logs Recomendados

- provider utilizado;
- tempo de resposta;
- erro de provider;
- tamanho do contexto;
- intencao detectada;
- conversation ID.

### Nao Registrar

- chave API completa;
- prompts completos com dados sensiveis em producao;
- dados brutos de importacao;
- informacoes bancarias desnecessarias.

## 20. Tratamento de Erros

### Erros Possiveis

- provider indisponivel;
- chave invalida;
- timeout;
- contexto grande demais;
- resposta vazia;
- erro de rede;
- configuracao ausente.

### Estrategia

- retornar mensagem amigavel;
- manter provider local como fallback quando possivel;
- registrar erro tecnico;
- nao perder mensagem do usuario;
- permitir tentar novamente.

## 21. Dependencias

### Depende de

- Financial Engine;
- Analytics Engine;
- modelo de dados;
- conversas;
- configuracoes;
- memoria;
- recomendacoes.

### Consumido por

- modulo Assistente Financeiro;
- Dashboard futuro;
- Relatorios futuros;
- motor de insights.

## 22. Boas Praticas

- manter provider desacoplado;
- nao colocar regra financeira dentro do provider;
- nao acessar Prisma diretamente em provider;
- usar contexto resumido;
- documentar prompt templates;
- testar cada provider isoladamente;
- criar fallback;
- separar simulacao de dado real;
- indicar incerteza quando necessario;
- evitar respostas longas demais.

## 23. Evolucoes Futuras

- provider OpenAI real;
- provider Claude real;
- provider Gemini real;
- provider Ollama real;
- provider LM Studio real;
- streaming de resposta;
- ferramentas/function calling;
- simulacoes persistidas;
- metas financeiras;
- memoria editavel;
- consentimento para envio externo;
- painel de auditoria de IA;
- avaliacao de qualidade das respostas;
- modo offline/local.

## 24. Resumo

O AI Engine e a camada de inteligencia do sistema.

Ele deve:

- consumir dados financeiros estruturados;
- montar contexto resumido;
- construir prompts seguros;
- chamar provedores substituiveis;
- persistir conversas;
- manter memoria;
- gerar recomendacoes;
- apoiar simulacoes;
- preservar privacidade.

A arquitetura foi desenhada para permitir evoluir de um provider local para modelos externos sem alterar os demais modulos do sistema.

