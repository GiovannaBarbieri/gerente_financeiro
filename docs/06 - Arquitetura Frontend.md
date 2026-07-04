# 06 - Arquitetura Frontend

## 1. Objetivo da Arquitetura

A arquitetura frontend tem como objetivo organizar a interface do sistema de forma modular, escalavel e consistente, permitindo que novas funcionalidades sejam adicionadas com baixo acoplamento e alta reutilizacao de componentes.

Atualmente, o frontend esta organizado como uma aplicacao React com TypeScript, utilizando componentes em `src/components`, configuracoes globais em `src/lib`, estilos em `src/styles.css` e uma aplicacao principal concentrada em `src/App.tsx`.

Essa estrutura foi suficiente para as primeiras fases do produto, mas, com a evolucao para Dashboard Executivo, Lancamentos, Importacoes Inteligentes, Gestao Financeira, Analytics e Assistente Financeiro, o frontend precisa evoluir para uma arquitetura orientada por features.

O objetivo da arquitetura proposta e:

- separar funcionalidades por dominio;
- reduzir o tamanho e responsabilidade do `App.tsx`;
- padronizar componentes compartilhados;
- organizar comunicacao com API;
- facilitar testes;
- melhorar manutencao;
- permitir crescimento do produto sem perda de clareza.

## 2. Stack

### React

Biblioteca principal para construcao da interface.

Foi escolhida por permitir componentizacao, reutilizacao, ecossistema amplo e boa adaptacao a dashboards, formularios, tabelas e fluxos interativos.

### TypeScript

Camada de tipagem estatica usada para reduzir erros, documentar contratos e melhorar manutencao.

Deve ser usado para tipar:

- props de componentes;
- respostas da API;
- formularios;
- filtros;
- entidades de dominio;
- hooks e services.

### Tailwind CSS

Framework utilitario de CSS usado para estilizar rapidamente componentes e telas.

Foi escolhido por permitir consistencia visual, responsividade e produtividade sem criar muitos arquivos CSS separados.

Uso recomendado:

- layouts;
- espacamentos;
- cores;
- grid;
- estados visuais;
- responsividade.

### Axios

Cliente HTTP utilizado para comunicacao com a API.

Foi escolhido por oferecer uma interface simples, suporte a interceptors, configuracao centralizada e tratamento de respostas.

### Recharts

Biblioteca de graficos utilizada em dashboards e relatorios.

Foi escolhida por integrar bem com React e atender graficos de barras, linhas e pizza usados no sistema.

### Lucide React

Biblioteca de icones utilizada na interface.

Foi escolhida por possuir icones consistentes, leves e adequados para botoes, menus, cards e estados visuais.

### Esbuild

Ferramenta de build utilizada no frontend.

Foi escolhida por ser simples e rapida para a fase atual do projeto.

### Express no Frontend Dev Server

Servidor local usado para servir a aplicacao durante desenvolvimento.

Em evolucoes futuras, pode ser avaliada migracao para Vite padrao ou outro empacotador, desde que a arquitetura por features seja preservada.

## 3. Estrutura de Pastas Oficial

A estrutura frontend recomendada para evolucao do projeto e:

```text
src/
  app/
  features/
  shared/
  components/
  layouts/
  hooks/
  services/
  contexts/
  types/
  utils/
  styles/
  assets/
```

### `src/app/`

Responsavel pela composicao principal da aplicacao.

Deve conter:

- inicializacao do app;
- definicao de rotas ou navegacao principal;
- providers globais;
- configuracao de layout raiz.

Exemplos futuros:

- `App.tsx`;
- `routes.tsx`;
- `providers.tsx`;
- `navigation.ts`.

### `src/features/`

Pasta principal para funcionalidades de negocio.

Cada modulo funcional deve possuir sua propria feature.

Exemplos:

- `dashboard`;
- `transactions`;
- `imports`;
- `accounts`;
- `cards`;
- `categories`;
- `analytics`;
- `ai`;
- `settings`.

### `src/shared/`

Elementos compartilhados entre features.

Deve conter componentes, hooks, tipos e utilitarios que nao pertencem a uma funcionalidade especifica.

Exemplos:

- botoes;
- campos;
- modais;
- tabelas;
- badges;
- formatadores;
- helpers.

### `src/components/`

Pasta atualmente utilizada para componentes.

Na arquitetura alvo, deve ser gradualmente reduzida ou convertida para `src/shared/components`.

Componentes muito especificos devem migrar para suas respectivas features.

### `src/layouts/`

Layouts reutilizaveis da aplicacao.

Exemplos:

- layout principal;
- layout com menu lateral;
- layout de dashboard;
- layout de chat;
- layout de tela cheia.

### `src/hooks/`

Hooks compartilhados.

Exemplos:

- `useDebounce`;
- `usePagination`;
- `useFilters`;
- `useLocalStorage`;
- `useApiError`.

Hooks especificos de uma feature devem ficar dentro da propria feature.

### `src/services/`

Camada de comunicacao com API.

Deve conter:

- cliente HTTP;
- services por dominio;
- tratamento de erros;
- interceptors;
- DTOs de entrada e saida quando aplicavel.

### `src/contexts/`

Contexts globais da aplicacao.

Exemplos:

- autenticacao futura;
- preferencias do usuario;
- tema;
- notificacoes;
- configuracoes globais.

### `src/types/`

Tipos globais compartilhados.

Exemplos:

- `FinancialEntry`;
- `Account`;
- `Card`;
- `Category`;
- `ApiResponse`;
- `Pagination`.

Tipos especificos devem ficar dentro das features.

### `src/utils/`

Funcoes utilitarias puras.

Exemplos:

- formatacao de moeda;
- formatacao de data;
- normalizacao de texto;
- helpers de filtros;
- calculos simples de apresentacao.

### `src/styles/`

Estilos globais, tokens visuais e possiveis extensoes do Tailwind.

Exemplos:

- `globals.css`;
- `tokens.css`;
- `tailwind.css`.

### `src/assets/`

Arquivos estaticos.

Exemplos:

- logos;
- imagens;
- icones especificos;
- ilustracoes;
- fontes.

## 4. Organizacao por Feature

Toda nova funcionalidade deve ser criada dentro de uma feature.

Uma feature representa um dominio funcional do produto.

Estrutura recomendada:

```text
features/
  dashboard/
    components/
    hooks/
    services/
    types/
    utils/
    pages/
    index.ts
```

### Responsabilidades por subpasta

#### `components/`

Componentes especificos da feature.

Exemplo:

- `SummaryCard`;
- `FinancialChart`;
- `CategoryChart`.

#### `hooks/`

Hooks especificos da feature.

Exemplo:

- `useDashboardFilters`;
- `useImportPreview`;
- `useFinancialAssistant`.

#### `services/`

Chamadas de API da feature.

Exemplo:

- `dashboardService.ts`;
- `transactionService.ts`;
- `aiService.ts`.

#### `types/`

Tipos da feature.

Exemplo:

- `DashboardSummary`;
- `ImportPreview`;
- `Conversation`.

#### `utils/`

Funcoes auxiliares especificas da feature.

#### `pages/`

Componentes de tela da feature.

#### `index.ts`

Arquivo de exportacao publica da feature.

## 5. Features Oficiais

### `dashboard`

Responsavel pelo Dashboard Executivo e visualizacoes principais.

Deve conter:

- cards de resumo;
- graficos financeiros;
- widgets de contas;
- widgets de cartoes;
- calendario financeiro;
- indicadores.

### `transactions`

Responsavel pelo historico unificado de lancamentos.

Deve conter:

- tabela de lancamentos;
- filtros;
- formulario de cadastro;
- edicao;
- revisao;
- detalhes do lancamento.

### `imports`

Responsavel pela Central Inteligente de Importacoes.

Deve conter:

- upload;
- pre-validacao;
- tabela de revisao;
- historico de importacoes;
- relatorio final.

### `accounts`

Responsavel pela gestao de contas.

Deve conter:

- lista de contas;
- cards;
- formulario;
- saldo;
- status.

### `cards`

Responsavel pela gestao de cartoes.

Deve conter:

- lista de cartoes;
- limite;
- faturas;
- utilizacao;
- vencimento.

### `categories`

Responsavel por categorias e subcategorias.

Deve conter:

- gerenciador de categorias;
- subcategorias;
- cores;
- icones;
- status.

### `analytics`

Responsavel por componentes analiticos reutilizaveis.

Pode ser consumido por Dashboard, Relatorios e Assistente.

### `ai`

Responsavel pelo Assistente Financeiro.

Deve conter:

- chat;
- historico;
- configuracoes;
- recomendacoes;
- contexto financeiro.

### `settings`

Responsavel por preferencias e parametros globais.

## 6. Componentes Compartilhados

Componentes compartilhados devem ser reutilizaveis, desacoplados de regras de negocio e controlados por props.

### Button

Botao padronizado.

Variações recomendadas:

- primary;
- secondary;
- ghost;
- danger;
- icon.

### Input

Campo de texto padronizado.

Deve suportar:

- label;
- erro;
- placeholder;
- estado desabilitado;
- ajuda contextual.

### Modal

Janela modal para formularios, confirmacoes e detalhes.

Deve conter:

- cabecalho;
- corpo;
- rodape;
- botao de fechar;
- controle de foco.

### Card

Container visual para blocos de informacao.

Usado em:

- dashboards;
- contas;
- cartoes;
- indicadores;
- recomendacoes.

### Table

Tabela simples reutilizavel.

Deve ser usada para dados tabulares pequenos e medios.

### Badge

Indicador visual de status, categoria, prioridade ou tipo.

Exemplos:

- Pendente;
- Revisado;
- Alta;
- Cartao;
- Conta.

### Drawer

Painel lateral para detalhes ou revisao.

Uso recomendado:

- detalhes do lancamento;
- revisao de importacao;
- configuracoes contextuais.

### Tooltip

Explicacao curta para icones, acoes ou informacoes tecnicas.

### Avatar

Representacao visual de usuario, conta, instituicao ou assistente.

### DataGrid

Tabela avancada para grandes volumes.

Deve suportar futuramente:

- paginacao;
- ordenacao;
- selecao;
- colunas configuraveis;
- virtualizacao.

### SearchBar

Campo de busca reutilizavel.

Deve suportar:

- busca textual;
- debounce;
- atalhos;
- limpeza rapida.

### EmptyState

Estado visual para ausencia de dados.

Deve explicar o que aconteceu e sugerir proxima acao.

### Loading

Estado de carregamento padronizado.

### ErrorState

Estado de erro padronizado.

Deve apresentar mensagem clara e acao de tentar novamente quando aplicavel.

## 7. Gerenciamento de Estado

### Estado Local

Deve ser usado para estados simples e especificos de componentes.

Exemplos:

- campo de formulario;
- modal aberto/fechado;
- aba selecionada;
- item expandido;
- pagina atual.

### Hooks

Hooks devem encapsular estados e comportamentos reutilizaveis.

Exemplos:

- filtros;
- paginacao;
- carregamento;
- chamadas de API;
- formularios.

### Context

Context deve ser usado apenas para estado realmente global.

Exemplos:

- usuario autenticado futuro;
- preferencias globais;
- tema;
- notificacoes;
- configuracoes compartilhadas.

Evitar Context para estados muito volateis ou grandes listas de dados.

### React Query

Nao e utilizado atualmente.

Pode ser adotado futuramente para:

- cache de API;
- refetch automatico;
- controle de loading e erro;
- invalidacao de queries;
- sincronizacao de dados remotos.

Se adotado, deve ser usado como camada padrao para dados vindos da API.

### Estado Global

Deve ser minimo.

Estados globais devem ser justificados e documentados.

Preferir:

- estado local;
- hooks de feature;
- cache de API;
- URL/filtros quando aplicavel.

## 8. Comunicacao com API

### Cliente HTTP

O sistema utiliza Axios como cliente HTTP.

O cliente deve ser centralizado e configurado com:

- `baseURL`;
- timeout;
- headers padrao;
- interceptors;
- tratamento global de erros.

### Services

Cada feature deve possuir seu proprio service.

Exemplos:

- `dashboardService`;
- `transactionService`;
- `importService`;
- `accountService`;
- `aiService`.

Services devem:

- encapsular endpoints;
- converter parametros;
- retornar DTOs tipados;
- evitar chamadas soltas dentro de componentes.

### DTOs

DTOs devem representar contratos entre frontend e backend.

Exemplos:

- `FinancialEntryDTO`;
- `ImportPreviewDTO`;
- `DashboardAnalyticsDTO`;
- `AIConversationDTO`.

### Tratamento de Erros

Erros devem ser tratados em camadas:

1. interceptor global para erros comuns;
2. service para erros especificos de dominio;
3. componente para mensagem amigavel ao usuario.

### Interceptors

Interceptors devem ser usados para:

- anexar token futuro;
- tratar erro 401;
- tratar erro de rede;
- registrar logs;
- padronizar mensagens.

### Timeout

Chamadas devem possuir timeout.

Operacoes longas, como importacoes grandes, devem evoluir para processamento assincrono.

### Retry

Retry deve ser usado com cuidado.

Pode ser adequado para:

- falhas temporarias de rede;
- consultas idempotentes;
- dashboards;
- historico.

Nao deve ser usado automaticamente para:

- criacao de lancamento;
- confirmacao de importacao;
- pagamentos;
- operacoes que possam duplicar dados.

## 9. Boas Praticas

### Nomenclatura

Usar nomes claros e alinhados ao Glossario Oficial.

Exemplos:

- `FinancialEntry`;
- `ImportBatch`;
- `DashboardSummary`;
- `CreditCardWidget`;
- `AIConversation`.

Evitar nomes genericos como:

- `Data`;
- `Info`;
- `Thing`;
- `Manager` sem contexto.

### Organizacao

Cada arquivo deve ter uma responsabilidade clara.

Regras:

- componentes de tela ficam em `pages`;
- componentes pequenos ficam em `components`;
- chamadas de API ficam em `services`;
- tipos ficam em `types`;
- regras de apresentacao reutilizaveis ficam em `utils` ou `hooks`.

### Componentizacao

Componentes devem ser pequenos, legiveis e reutilizaveis.

Separar:

- container de dados;
- componente visual;
- formulario;
- tabela;
- estado vazio;
- loading;
- erro.

### Performance

Cuidados recomendados:

- evitar chamadas repetidas desnecessarias;
- usar memoizacao quando houver calculos caros;
- paginar ou virtualizar listas grandes;
- evitar renderizar milhares de linhas;
- carregar dados sob demanda;
- manter graficos leves;
- separar componentes pesados.

### Acessibilidade

Requisitos recomendados:

- botoes com texto ou `aria-label`;
- contraste adequado;
- foco visivel;
- labels em campos;
- navegacao por teclado;
- modais com controle de foco;
- mensagens de erro claras.

### Responsividade

Todas as telas devem funcionar em:

- desktop;
- notebooks;
- tablets;
- celulares.

Regras:

- grids devem quebrar adequadamente;
- tabelas devem ter scroll horizontal quando necessario;
- botoes nao devem sobrepor texto;
- cards devem manter leitura clara;
- filtros devem empilhar em telas pequenas.

### Estilo Visual

O produto deve manter visual:

- minimalista;
- limpo;
- profissional;
- com espacamento adequado;
- poucas cores;
- sombras discretas;
- componentes consistentes.

## 10. Estrategia de Evolucao

### Estado Atual

O frontend atual possui:

- `App.tsx` concentrando navegacao e varias telas;
- componentes em `src/components`;
- API centralizada em `src/lib/api.ts`;
- estilos globais em `src/styles.css`;
- algumas subpastas por dominio, como `components/ai`, `components/dashboard`, `components/imports` e `components/finance`.

### Estado Alvo

O frontend deve evoluir para:

```text
src/
  app/
  features/
    dashboard/
    transactions/
    imports/
    accounts/
    cards/
    categories/
    analytics/
    ai/
    settings/
  shared/
    components/
    hooks/
    services/
    types/
    utils/
  layouts/
  styles/
  assets/
```

### Caminho de Migracao

1. Criar estrutura `features`.
2. Migrar Dashboard para `features/dashboard`.
3. Migrar Lancamentos para `features/transactions`.
4. Migrar Importacoes para `features/imports`.
5. Migrar Assistente para `features/ai`.
6. Criar `shared/components`.
7. Mover componentes reutilizaveis.
8. Criar services por feature.
9. Reduzir responsabilidades do `App.tsx`.
10. Adotar React Query futuramente se necessario.

## 11. Resumo da Arquitetura Proposta

A arquitetura frontend proposta e modular, orientada por features e baseada em componentes reutilizaveis.

Principios principais:

- cada funcionalidade deve viver em sua propria feature;
- componentes compartilhados devem ficar em camada `shared`;
- comunicacao com API deve ser feita por services tipados;
- estado global deve ser minimo;
- estado remoto pode futuramente ser gerenciado por React Query;
- telas devem usar componentes padronizados;
- performance, acessibilidade e responsividade devem ser tratadas como requisitos;
- nomenclatura deve seguir o Glossario Oficial.

Essa arquitetura prepara o frontend para crescer com seguranca, mantendo clareza, consistencia visual e facilidade de manutencao.

