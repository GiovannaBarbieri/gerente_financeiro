# 07 - Arquitetura Backend

## 1. Proposito do Documento

Este documento descreve a arquitetura backend oficial do sistema.

Ele documenta a organizacao atual, a arquitetura alvo, o fluxo de requisicoes, responsabilidades das camadas, boas praticas, escalabilidade e pontos de evolucao.

O objetivo e garantir que o backend continue evoluindo de forma modular, segura e previsivel, evitando acoplamento excessivo entre rotas, regras de negocio, banco de dados e integracoes externas.

## 2. Objetivo da Arquitetura Backend

O backend deve ser a camada responsavel por:

- expor APIs para o frontend;
- centralizar regras de negocio;
- persistir dados;
- processar importacoes;
- normalizar e classificar lancamentos;
- calcular analytics;
- orquestrar o Assistente Financeiro;
- preservar auditoria e rastreabilidade;
- proteger dados sensiveis;
- preparar integracoes futuras.

A arquitetura deve seguir o principio de separacao de responsabilidades.

Rotas nao devem conter regra de negocio complexa. Services devem concentrar comportamento de negocio. Acesso ao banco deve ser padronizado. Integracoes externas devem ser isoladas por interfaces ou providers.

## 3. Stack Backend

### Node.js

Ambiente de execucao do backend.

Foi escolhido por permitir desenvolvimento rapido, bom ecossistema, compatibilidade com TypeScript e facilidade para construir APIs, processar arquivos e integrar servicos externos.

### Express

Framework HTTP utilizado para expor rotas da API.

Foi escolhido por ser simples, flexivel e suficiente para a fase atual do produto.

Responsabilidades:

- registrar rotas;
- aplicar middlewares;
- receber requisicoes;
- enviar respostas;
- centralizar tratamento de erros.

### TypeScript

Camada de tipagem usada para aumentar confiabilidade e documentar contratos internos.

Deve ser usado para:

- tipos de services;
- DTOs;
- contratos de providers;
- entidades de dominio;
- respostas de API;
- filtros;
- configuracoes.

### Prisma

ORM utilizado para acesso ao banco de dados.

Responsabilidades:

- mapear modelos;
- executar queries;
- controlar migrations ou sincronizacao de schema;
- gerar client tipado;
- manter consistencia entre aplicacao e banco.

### SQLite

Banco atual do projeto.

Adequado para desenvolvimento local e uso inicial.

Em cenarios de crescimento, pode ser avaliada migracao para PostgreSQL ou outro banco relacional mais robusto.

### Multer

Middleware usado para upload de arquivos.

Utilizado principalmente no fluxo de importacoes.

### Fast CSV

Biblioteca usada para leitura de CSV.

### XLSX

Biblioteca usada para leitura de planilhas Excel.

### Zod

Biblioteca de validacao usada em algumas rotas.

Deve evoluir para ser o padrao oficial de validacao de entrada.

## 4. Estrutura Atual de Pastas

Estrutura atual simplificada:

```text
backend/
  prisma/
    schema.prisma
    seed.ts
    dev.db
    migrations/
  src/
    server.ts
    prisma.ts
    routes/
      finance.ts
      imports.ts
      ai.ts
    services/
      importService.ts
      batchImportService.ts
      importManager.ts
      financialEntryService.ts
      financialManagementService.ts
      analyticsService.ts
      reportService.ts
      classification.ts
      normalization.ts
      hashService.ts
      fileParser.ts
      columnMapping.ts
      parsers.ts
      parserRegistry.ts
      ai/
        aiEngine.ts
        aiProvider.ts
        financialContextService.ts
        promptBuilder.ts
        promptTemplates.ts
        contextCompressor.ts
        conversationService.ts
        memoryService.ts
        aiRecommendationService.ts
        responseFormatter.ts
    utils/
      format.ts
```

## 5. Estrutura de Pastas Alvo

Estrutura recomendada para evolucao:

```text
backend/
  prisma/
  src/
    app/
    config/
    modules/
      financial-entries/
        controllers/
        services/
        repositories/
        dto/
        validators/
        types/
      imports/
      analytics/
      accounts/
      cards/
      categories/
      ai/
    shared/
      middlewares/
      errors/
      helpers/
      utils/
      validation/
      logging/
      types/
    infrastructure/
      database/
      providers/
      storage/
      queues/
```

### `app/`

Inicializacao da aplicacao.

Responsabilidades:

- configurar Express;
- registrar middlewares;
- registrar rotas;
- configurar tratamento de erros;
- inicializar dependencias.

### `config/`

Configuracoes da aplicacao.

Exemplos:

- porta;
- URL do frontend;
- banco;
- limites de upload;
- configuracoes de IA;
- variaveis de ambiente.

### `modules/`

Modulos de negocio.

Cada modulo deve conter suas proprias rotas, controllers, services, DTOs e validacoes.

Exemplos:

- `financial-entries`;
- `imports`;
- `analytics`;
- `accounts`;
- `cards`;
- `categories`;
- `ai`.

### `shared/`

Codigo compartilhado entre modulos.

Exemplos:

- middlewares;
- erros;
- helpers;
- validadores;
- tipos comuns;
- formatadores.

### `infrastructure/`

Camada de infraestrutura.

Exemplos:

- banco de dados;
- storage;
- filas;
- provedores externos;
- clientes HTTP;
- integracoes.

## 6. Arquitetura em Camadas

### Camada de Rotas

Responsavel por mapear endpoints HTTP.

Exemplo:

- `GET /api/financial-entries`;
- `POST /api/imports/smart/preview`;
- `GET /api/analytics-dashboard`;
- `POST /api/ai/chat`.

Rotas devem:

- receber requisicao;
- chamar controller ou service;
- retornar resposta;
- nao conter regra de negocio complexa.

### Camada de Controllers

Atualmente, controllers ainda nao estao separados formalmente.

Na arquitetura alvo, controllers devem:

- extrair parametros da requisicao;
- validar entrada;
- chamar services;
- definir status HTTP;
- formatar resposta.

Controllers nao devem:

- acessar Prisma diretamente;
- processar regra financeira;
- manipular arquivos complexos;
- montar analytics;
- chamar provedores externos diretamente.

### Camada de Services

Camada onde ficam as regras de negocio.

Atualmente, a maior parte da regra esta em `src/services`.

Responsabilidades:

- criar lancamentos;
- processar importacoes;
- classificar dados;
- calcular analytics;
- gerar recomendacoes;
- montar contexto de IA;
- aplicar regras financeiras;
- orquestrar persistencia.

### Camada de Repositories

Ainda nao existe formalmente.

Na arquitetura alvo, repositories devem encapsular acesso ao banco.

Responsabilidades:

- queries;
- persistencia;
- filtros complexos;
- transacoes;
- paginacao;
- consultas reutilizaveis.

Beneficio:

- desacoplar services do Prisma;
- facilitar testes;
- permitir troca ou evolucao de banco;
- reduzir duplicacao de queries.

### Camada de DTOs

DTOs representam contratos de entrada e saida.

Devem ser usados para:

- payloads de criacao;
- respostas;
- filtros;
- parametros;
- dados vindos de importacoes;
- dados enviados ao frontend.

### Camada de Validators

Responsavel por validar dados de entrada.

Zod deve ser o padrao recomendado.

Validacoes devem ocorrer antes da execucao da regra de negocio.

### Camada de Helpers e Utils

Funcoes auxiliares puras e reutilizaveis.

Exemplos:

- formatacao de data;
- formatacao de moeda;
- normalizacao de texto;
- parse de valores;
- geracao de fingerprint;
- helpers de competencia.

### Camada de Providers

Abstracoes para integracoes externas.

Exemplos:

- provedores de IA;
- storage;
- Open Finance;
- envio de email;
- filas;
- notificacoes.

Providers devem ser substituiveis.

## 7. Fluxo de uma Requisicao

Fluxo recomendado:

```text
Cliente HTTP
  -> Express
  -> Middlewares globais
  -> Route
  -> Controller
  -> Validator
  -> Service
  -> Repository / Prisma
  -> Service
  -> Controller
  -> Response
```

Fluxo atual simplificado:

```text
Cliente HTTP
  -> Express
  -> Route
  -> Service
  -> Prisma
  -> Response
```

### Exemplo: Criar Lancamento

1. Frontend envia `POST /api/financial-entries`.
2. Route recebe payload.
3. Zod valida campos basicos.
4. Service normaliza dados.
5. Service aplica classificacao quando necessario.
6. Service salva em `financial_transactions`.
7. API retorna lancamento criado.

### Exemplo: Importacao Inteligente

1. Frontend envia arquivos.
2. Multer recebe uploads.
3. Route chama Import Manager.
4. Import Manager orquestra batch import.
5. Parser le arquivos.
6. Column Mapping padroniza colunas.
7. Classification classifica dados.
8. Hash Service detecta duplicidades.
9. Service salva registros brutos e lancamentos.
10. API retorna resumo.

### Exemplo: Chat com IA

1. Frontend envia pergunta.
2. Route `/api/ai/chat` valida payload.
3. AI Engine cria ou recupera conversa.
4. Financial Context Service monta contexto resumido.
5. Prompt Builder monta prompt.
6. AI Provider gera resposta.
7. Conversation Service persiste mensagens.
8. API retorna resposta.

## 8. Routes

Rotas atuais principais:

### Finance

Arquivo:

- `src/routes/finance.ts`

Responsavel por:

- dashboard;
- analytics;
- lancamentos;
- categorias;
- contas;
- cartoes;
- formas de pagamento;
- tags;
- filtros salvos;
- recorrencias;
- transferencias;
- pesquisa global;
- relatorios;
- conciliacao.

### Imports

Arquivo:

- `src/routes/imports.ts`

Responsavel por:

- importacao inteligente;
- importacao em lote;
- importacao individual legada;
- pre-visualizacao;
- confirmacao;
- historico de importacoes.

### AI

Arquivo:

- `src/routes/ai.ts`

Responsavel por:

- chat;
- historico;
- contexto;
- recomendacoes;
- configuracoes de IA.

## 9. Services

Services atuais importantes:

### `financialEntryService`

Responsavel por:

- listar lancamentos;
- criar lancamento manual;
- editar lancamento;
- ignorar lancamento;
- padronizar status;
- integrar classificacao.

### `financialManagementService`

Responsavel por:

- contas;
- cartoes;
- formas de pagamento;
- tags;
- filtros salvos;
- recorrencias;
- transferencias;
- pesquisa global.

### `importManager`

Orquestrador da importacao inteligente.

Responsavel por:

- pre-visualizar importacao;
- confirmar importacao;
- listar historico.

### `batchImportService`

Motor principal de importacao em lote.

Responsavel por:

- criar lote;
- processar arquivos;
- validar;
- detectar duplicidades;
- salvar lancamentos.

### `importService`

Fluxo legado de importacao individual.

Mantido por compatibilidade.

### `analyticsService`

Responsavel por:

- agregacoes financeiras;
- dashboard executivo;
- indicadores;
- ranking;
- calendario financeiro;
- cache de analytics.

### `classification`

Responsavel por:

- classificacao automatica;
- regras;
- categoria;
- subcategoria;
- origem;
- confianca.

### `normalization`

Responsavel por:

- normalizar lancamentos;
- descricao;
- natureza financeira;
- tipo;
- impacto em caixa;
- impacto em consumo real.

### `hashService`

Responsavel por:

- hashes de duplicidade;
- hash estrito;
- hash flexivel;
- hash de linha bruta.

### `ai/*`

Servicos do Motor de IA:

- AI Engine;
- AI Provider;
- Financial Context Service;
- Prompt Builder;
- Prompt Templates;
- Context Compressor;
- Conversation Service;
- Memory Service;
- Recommendation Service;
- Response Formatter.

## 10. Middlewares

### Middlewares Atuais

Atualmente o backend utiliza:

- `cors`;
- `express.json`;
- `multer`;
- middleware global de erro.

### Middlewares Recomendados

Evolucoes recomendadas:

- request logger;
- correlation ID;
- authentication;
- authorization;
- rate limit;
- upload limits;
- validation middleware;
- error handler padronizado;
- audit middleware;
- security headers.

## 11. Validation

### Estado Atual

Algumas rotas usam Zod para validar payloads.

### Estado Alvo

Toda entrada externa deve ser validada.

Validar:

- body;
- query params;
- route params;
- arquivos;
- tipos;
- datas;
- valores monetarios;
- enums;
- limites de tamanho.

### Padrao Recomendado

Usar schemas Zod por DTO.

Exemplo conceitual:

```text
CreateFinancialEntrySchema
UpdateFinancialEntrySchema
ImportPreviewSchema
AIChatSchema
```

## 12. DTOs

DTOs devem padronizar contratos entre camadas.

### DTOs de Entrada

Exemplos:

- `CreateFinancialEntryDTO`;
- `UpdateFinancialEntryDTO`;
- `ImportPreviewDTO`;
- `AIChatRequestDTO`;
- `DashboardFilterDTO`.

### DTOs de Saida

Exemplos:

- `FinancialEntryResponseDTO`;
- `ImportPreviewResponseDTO`;
- `AnalyticsDashboardDTO`;
- `AIChatResponseDTO`.

### Beneficios

- reduzir ambiguidade;
- documentar API;
- facilitar testes;
- evitar dependencia direta do modelo Prisma;
- proteger campos internos.

## 13. Repositories

Repositories ainda nao estao formalmente separados.

### Objetivo Futuro

Criar uma camada de repositories para acesso a dados.

Exemplos:

- `FinancialEntryRepository`;
- `ImportRepository`;
- `AccountRepository`;
- `CardRepository`;
- `AnalyticsRepository`;
- `ConversationRepository`.

### Beneficios

- reduzir acoplamento com Prisma;
- facilitar testes unitarios;
- centralizar queries;
- melhorar legibilidade;
- permitir otimizacao de consultas.

## 14. Helpers e Utils

### Utils Atuais

Arquivo:

- `src/utils/format.ts`

Responsavel por:

- normalizar texto;
- converter datas;
- converter valores monetarios;
- formatar competencia;
- gerar fingerprint;
- tratar nomes.

### Regras para Utils

Utils devem:

- ser puras quando possivel;
- nao acessar banco;
- nao depender de Express;
- nao conter regra de negocio complexa;
- ser reutilizaveis.

## 15. Tratamento de Erros

### Estado Atual

Existe middleware global de erro em `server.ts`.

Ele captura erros e retorna mensagem generica ou mensagem do erro.

### Estado Alvo

Criar erros padronizados.

Exemplos:

- `AppError`;
- `ValidationError`;
- `NotFoundError`;
- `ConflictError`;
- `UnauthorizedError`;
- `ForbiddenError`;
- `ImportError`;

### Resposta Padrao de Erro

Formato recomendado:

```json
{
  "message": "Mensagem amigavel",
  "code": "ERROR_CODE",
  "details": {},
  "correlationId": "..."
}
```

### Regras

- nao expor stack trace em producao;
- registrar erro internamente;
- retornar mensagens compreensiveis;
- diferenciar erro de validacao, negocio e infraestrutura.

## 16. Logs

### Estado Atual

Logs ainda sao basicos, principalmente via console.

### Estado Alvo

Criar camada de logging.

Logs recomendados:

- requisicoes;
- erros;
- importacoes;
- chamadas de IA;
- tempo de processamento;
- falhas de parser;
- duplicidades;
- operacoes criticas.

### Campos Recomendados

- timestamp;
- nivel;
- correlation ID;
- rota;
- usuario;
- modulo;
- duracao;
- mensagem;
- detalhes tecnicos.

### Niveis

- debug;
- info;
- warn;
- error.

## 17. Autenticacao e Autorizacao

### Estado Atual

O sistema ainda nao possui autenticacao completa.

### Preparacao Futura

Adicionar:

- usuarios reais;
- login;
- sessoes ou JWT;
- refresh token;
- permissoes;
- multiusuario;
- segregacao de dados por usuario;
- protecao de rotas.

### Regras Futuras

- todo lancamento deve pertencer a um usuario;
- dados financeiros devem ser isolados por usuario;
- consultores podem acessar clientes apenas com permissao;
- chaves e configuracoes devem ser protegidas.

### Middlewares Futuros

- `authenticate`;
- `authorize`;
- `requireRole`;
- `tenantScope`;
- `auditUserAction`.

## 18. Escalabilidade

### Escalabilidade Tecnica

Recomendacoes:

- separar controllers e repositories;
- adotar filas para importacoes grandes;
- mover arquivos para storage dedicado;
- usar PostgreSQL em ambiente multiusuario;
- criar indices conforme volume;
- cachear analytics;
- paginar listas;
- processar IA de forma assincrona quando necessario.

### Escalabilidade Funcional

Recomendacoes:

- manter lancamentos como entidade central;
- adicionar novos parsers via registry;
- adicionar novos provedores de IA via provider;
- criar DTOs para contratos estaveis;
- evitar regra duplicada em frontend e backend.

### Escalabilidade de Dados

Pontos de atencao:

- `financial_transactions` tende a crescer rapidamente;
- `raw_import_records` pode armazenar grande volume;
- historico de IA pode crescer;
- auditoria pode crescer;
- anexos exigem storage externo no futuro.

## 19. Boas Praticas Backend

### Organizacao

- manter arquivos pequenos;
- separar regra de negocio de rotas;
- agrupar por modulo;
- evitar services gigantes;
- criar interfaces para providers.

### Banco de Dados

- usar migrations versionadas;
- evitar alteracoes destrutivas;
- criar backups antes de mudancas estruturais;
- preferir campos opcionais em evolucoes incrementais;
- documentar novas tabelas.

### API

- manter endpoints REST consistentes;
- usar plural em recursos;
- validar entradas;
- padronizar respostas;
- paginar listas grandes;
- documentar contratos.

### Regras de Negocio

- centralizar regras em services;
- evitar duplicidade de regra;
- preservar rastreabilidade;
- nao misturar regra financeira com apresentacao;
- manter compatibilidade com fluxos antigos durante transicoes.

### Seguranca

- nao expor dados sensiveis em logs;
- mascarar chaves de API;
- limitar uploads;
- validar arquivos;
- preparar isolamento por usuario;
- evitar envio de dados brutos para IA sem necessidade.

## 20. Sugestoes para Desacoplamento

### Separar Controllers

Mover logica de `routes` para controllers.

Beneficio:

- rotas mais simples;
- testes mais diretos;
- melhor organizacao por modulo.

### Criar Repositories

Encapsular Prisma em repositories.

Beneficio:

- services menos acoplados;
- consultas reutilizaveis;
- facilidade de mock em testes.

### Criar DTOs Tipados

Evitar retornar modelos Prisma diretamente.

Beneficio:

- contratos mais estaveis;
- seguranca;
- menor acoplamento com banco.

### Modularizar Services Grandes

Separar services por responsabilidade.

Exemplo:

- Import Preview Service;
- Import Confirm Service;
- Duplicate Detection Service;
- Financial Entry Creation Service.

### Criar Camada de Eventos

Futuramente, operacoes podem emitir eventos.

Exemplos:

- `financialEntry.created`;
- `import.completed`;
- `category.reviewed`;
- `invoice.reconciled`;
- `ai.recommendation.generated`.

Beneficio:

- automacoes desacopladas;
- notificacoes;
- auditoria;
- integrações futuras.

## 21. Resumo da Arquitetura Backend

O backend atual ja possui uma base funcional robusta:

- Node.js;
- Express;
- Prisma;
- SQLite;
- services de negocio;
- importacao inteligente;
- analytics;
- assistente financeiro;
- cadastros financeiros.

A arquitetura alvo deve evoluir para uma organizacao modular em camadas:

```text
Routes
  -> Controllers
  -> Validators / DTOs
  -> Services
  -> Repositories
  -> Prisma / Providers
```

Principios centrais:

- lancamentos financeiros como entidade principal;
- services concentrando regra de negocio;
- repositories isolando persistencia;
- providers isolando integracoes;
- validacao padronizada;
- erros padronizados;
- logs estruturados;
- seguranca preparada para multiusuario;
- escalabilidade por modulos.

Essa arquitetura prepara o backend para crescer com seguranca, mantendo compatibilidade com o que ja existe e reduzindo riscos em futuras evolucoes.

