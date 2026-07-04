# 13 - Design System

## 1. Proposito do Documento

Este documento define o Design System oficial do sistema.

Ele documenta cores, tipografia, grid, espacamentos, botoes, inputs, selects, cards, tabelas, drawers, modais, sidebar, header, icones, badges, estados, loading, empty state, dark mode, light mode, acessibilidade e responsividade.

O objetivo e garantir consistencia visual, usabilidade e escalabilidade da interface.

## 2. Principios Visuais

O sistema deve transmitir:

- clareza;
- confiabilidade;
- simplicidade;
- organizacao;
- profissionalismo;
- leveza visual.

A interface deve se aproximar de produtos financeiros modernos, como Mobills, Organizze, Monarch Money e YNAB, mantendo identidade propria.

## 3. Temas

### Light Mode

Light Mode e o tema principal atual.

Deve ser limpo, claro e com alto contraste.

Caracteristicas:

- fundo geral claro;
- cards brancos;
- bordas suaves;
- sombras discretas;
- cores funcionais com uso moderado.

### Dark Mode

Dark Mode e uma preparacao futura.

Nao deve ser implementado de forma improvisada. Deve seguir tokens de cor e garantir contraste adequado.

Regras futuras:

- fundo principal escuro;
- cards com contraste moderado;
- textos com hierarquia clara;
- cores sem saturacao excessiva;
- graficos adaptados ao fundo escuro.

## 4. Cores

### Cores Principais

#### Ink

Uso:

- texto principal;
- botoes primarios;
- navegacao ativa.

Valor atual recomendado:

```text
#17202A
```

#### Surface

Uso:

- fundo geral da aplicacao.

Valor atual recomendado:

```text
#F7F8FA
```

#### White

Uso:

- cards;
- paineis;
- tabelas;
- inputs.

Valor:

```text
#FFFFFF
```

#### Line

Uso:

- bordas;
- divisores;
- contornos de inputs.

Valor atual recomendado:

```text
#E2E8F0
```

#### Muted

Uso:

- textos secundarios;
- descricoes;
- labels;
- metadados.

Valor atual recomendado:

```text
#64748B
```

### Cores Funcionais

#### Verde

Uso:

- receitas;
- sucesso;
- positivo;
- revisado;
- importado.

#### Vermelho

Uso:

- despesas;
- erros;
- alertas criticos;
- vencido;
- negativo.

#### Azul

Uso:

- informacao;
- cartoes;
- links funcionais;
- estados em revisao;
- destaques neutros.

#### Amarelo/Laranja

Uso:

- alertas moderados;
- atencao;
- pendencias.

### Regras de Uso de Cores

- nao usar cor apenas como unico indicador de estado;
- sempre combinar cor com texto, icone ou badge;
- evitar excesso de cores na mesma tela;
- usar verde/vermelho principalmente para sentido financeiro;
- usar azul para informacao e acoes secundarias;
- manter contraste adequado.

## 5. Tipografia

### Fonte

Fonte principal:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

### Hierarquia

#### Titulo de Pagina

Uso:

- nome da tela;
- titulo principal.

Peso:

- semibold.

Tamanho recomendado:

- 24px.

#### Titulo de Secao

Uso:

- cabecalho de card ou painel.

Tamanho recomendado:

- 16px a 20px.

#### Texto Principal

Uso:

- conteudo geral.

Tamanho recomendado:

- 14px.

#### Texto Secundario

Uso:

- descricoes;
- metadados;
- labels auxiliares.

Tamanho recomendado:

- 12px a 14px.

### Regras Tipograficas

- nao usar texto grande dentro de componentes compactos;
- manter hierarquia clara;
- evitar excesso de negrito;
- nao usar letter-spacing negativo;
- nao escalar fonte com viewport;
- garantir legibilidade em mobile.

## 6. Grid e Layout

### Container

Largura maxima recomendada:

```text
max-w-7xl
```

Uso:

- telas principais;
- dashboard;
- lancamentos;
- importacoes.

### Grid

O grid deve ser responsivo.

Exemplos:

- 1 coluna em mobile;
- 2 colunas em tablet;
- 4 colunas em desktop;
- 5 colunas para cards executivos quando houver espaco.

### Regras

- cards devem quebrar linha naturalmente;
- tabelas podem ter scroll horizontal;
- filtros devem empilhar em telas pequenas;
- evitar layouts fixos que quebrem em mobile.

## 7. Espacamentos

### Escala Recomendada

```text
4px
8px
12px
16px
20px
24px
32px
```

### Uso

- 8px: gap pequeno entre icone e texto;
- 12px: padding de botoes e inputs;
- 16px: padding padrao de cards;
- 20px/24px: separacao entre secoes;
- 32px: separacao de blocos maiores.

### Regras

- manter respiro visual;
- nao colocar cards colados;
- evitar excesso de densidade em dashboards;
- formularios devem ter alinhamento consistente.

## 8. Bordas, Raios e Sombras

### Border Radius

Padrao:

```text
6px a 8px
```

Regras:

- cards devem usar raio discreto;
- botoes devem usar raio medio;
- badges devem usar raio pequeno;
- evitar elementos excessivamente arredondados.

### Bordas

Cor padrao:

```text
Line
```

Uso:

- cards;
- inputs;
- tabelas;
- divisores.

### Sombras

Sombras devem ser discretas.

Uso:

- cards principais;
- paineis;
- modais;
- dropdowns.

Evitar:

- sombras pesadas;
- efeitos decorativos exagerados.

## 9. Botoes

### Tipos

#### Primary

Uso:

- acao principal da tela;
- salvar;
- confirmar;
- importar;
- enviar.

Visual:

- fundo escuro;
- texto branco;
- icone opcional.

#### Secondary

Uso:

- acoes secundarias;
- cancelar;
- voltar;
- ver detalhes;
- filtros.

Visual:

- fundo branco;
- borda;
- texto escuro.

#### Danger

Uso:

- excluir;
- ignorar;
- arquivar;
- remover.

Visual:

- vermelho discreto;
- confirmar quando destrutivo.

#### Icon Button

Uso:

- acoes compactas;
- remover;
- expandir;
- editar;
- anexar.

### Regras

- todo botao deve ter estado disabled;
- icones devem ser de Lucide quando disponivel;
- botoes com icone isolado devem ter tooltip ou label acessivel;
- acao primaria deve ser unica por bloco quando possivel;
- evitar botoes com texto longo.

## 10. Inputs

### Tipos

- texto;
- numero;
- data;
- mes;
- busca;
- moeda;
- textarea.

### Visual

- altura padrao de 40px;
- borda `Line`;
- raio de 6px;
- padding horizontal de 12px;
- fundo branco.

### Regras

- todo input deve ter label quando estiver em formulario;
- placeholder nao substitui label;
- erros devem ser exibidos abaixo do campo;
- campos desabilitados devem ter baixa opacidade;
- campos monetarios devem respeitar formato brasileiro.

## 11. Selects

### Uso

- filtros;
- tipo de lancamento;
- categoria;
- conta;
- cartao;
- status;
- provider de IA.

### Regras

- primeira opcao deve representar "Todos" quando usado como filtro;
- em formulario, primeira opcao pode ser vazia ou instrutiva;
- selects devem ter mesma altura dos inputs;
- evitar selects com listas excessivamente grandes sem busca.

## 12. Cards

### Uso

- indicadores;
- contas;
- cartoes;
- recomendacoes;
- blocos de dashboard;
- paineis de gestao.

### Estrutura

```text
Card
  Header
  Content
  Footer opcional
```

### Regras

- padding padrao de 16px;
- borda discreta;
- sombra leve;
- titulo curto;
- valor em destaque quando for KPI;
- nao aninhar cards dentro de cards sem necessidade.

## 13. Tables

### Uso

- lancamentos;
- importacoes;
- historico;
- categorias;
- resultados analiticos.

### Estrutura

- cabecalho fixo quando houver scroll vertical;
- texto alinhado a esquerda;
- valores monetarios alinhados a direita;
- linhas com divisores;
- hover discreto.

### Regras

- tabelas grandes devem ter scroll;
- usar paginacao ou virtualizacao futuramente;
- evitar colunas tecnicas para usuario comum;
- acoes devem ficar no final;
- status devem usar badges.

## 14. DataGrid

DataGrid e a evolucao recomendada para tabelas grandes.

Deve suportar futuramente:

- paginacao;
- selecao;
- ordenacao;
- filtros por coluna;
- colunas configuraveis;
- virtualizacao;
- estados de loading e erro.

## 15. Drawer

### Uso

- detalhes de lancamento;
- revisao de importacao;
- filtros avancados;
- configuracoes contextuais.

### Regras

- abrir lateralmente;
- preservar contexto da tela;
- conter cabecalho, conteudo e rodape;
- permitir fechar por botao e tecla Escape;
- controlar foco.

## 16. Modal

### Uso

- confirmacoes;
- formularios curtos;
- alertas importantes.

### Regras

- usar modal apenas quando exigir foco total;
- evitar modais para fluxos longos;
- conter titulo claro;
- conter acoes no rodape;
- acao destrutiva deve ser confirmada.

## 17. Sidebar

### Uso

- navegacao principal futura;
- area lateral do Assistente Financeiro;
- filtros persistentes.

### Regras

- itens devem ter icone e texto;
- estado ativo deve ser evidente;
- em mobile, sidebar deve colapsar ou virar menu;
- nao esconder funcionalidades principais sem alternativa.

## 18. Header

### Uso

- identidade do sistema;
- navegacao;
- filtros globais;
- acoes principais.

### Regras

- header deve ser limpo;
- nao sobrecarregar com muitos botoes;
- filtros globais devem ficar visiveis quando relevantes;
- titulo deve indicar contexto atual.

## 19. Icones

### Biblioteca Oficial

Usar Lucide React.

### Regras

- icones devem reforcar significado;
- evitar icones decorativos sem funcao;
- tamanho comum entre 14px e 20px;
- botoes com icone devem ter texto ou tooltip;
- manter consistencia visual.

## 20. Badges

### Uso

- status;
- prioridade;
- tipo;
- origem;
- classificacao.

### Exemplos

- Pendente;
- Revisado;
- Ignorado;
- Conta;
- Cartao;
- Alta;
- Media;
- Baixa.

### Regras

- texto curto;
- cor funcional;
- nao usar badge para frases longas;
- sempre manter contraste adequado.

## 21. Estados Visuais

### Success

Uso:

- importado;
- salvo;
- revisado;
- positivo.

### Warning

Uso:

- pendente;
- revisao recomendada;
- atencao.

### Error

Uso:

- erro;
- falha;
- vencido;
- negativo critico.

### Info

Uso:

- dica;
- contexto;
- status em processamento;
- revisao.

## 22. Loading

### Uso

- carregamento de dashboard;
- chamadas de API;
- importacao;
- assistente digitando.

### Regras

- indicar que algo esta acontecendo;
- evitar telas em branco;
- usar texto curto;
- em operacoes longas, mostrar progresso quando possivel.

## 23. Empty State

### Uso

- sem lancamentos;
- sem importacoes;
- sem conversas;
- sem categorias;
- sem resultados de busca.

### Estrutura

```text
Titulo
Descricao curta
Acao sugerida
```

### Regras

- explicar ausencia de dados;
- sugerir proximo passo;
- evitar tom tecnico;
- nao deixar grandes espacos vazios sem orientacao.

## 24. Error State

### Uso

- erro de API;
- falha de importacao;
- erro de validacao;
- indisponibilidade de IA.

### Estrutura

```text
Mensagem clara
Detalhe opcional
Acao de tentar novamente
```

### Regras

- nao expor stack trace;
- explicar em linguagem simples;
- oferecer acao quando possivel.

## 25. Acessibilidade

### Regras Gerais

- todo campo deve ter label;
- botoes icon-only devem ter `aria-label`;
- contraste deve ser suficiente;
- foco deve ser visivel;
- modais devem controlar foco;
- navegacao por teclado deve funcionar;
- mensagens de erro devem ser claras;
- nao depender apenas de cor.

### Teclado

Componentes interativos devem ser acessiveis por teclado.

### Leitores de Tela

Elementos importantes devem possuir texto semantico.

## 26. Responsividade

### Breakpoints Conceituais

- mobile;
- tablet;
- desktop;
- wide desktop.

### Regras

- dashboards devem reorganizar cards;
- filtros devem empilhar em mobile;
- tabelas devem ter scroll horizontal;
- botoes devem manter area clicavel adequada;
- textos nao devem sobrepor conteudo;
- cards devem manter altura visual equilibrada.

## 27. Formularios

### Regras

- labels claros;
- agrupamento por assunto;
- validacao visual;
- mensagens de erro proximas ao campo;
- acoes no final;
- cancelar sempre disponivel quando aplicavel.

### Ordem Recomendada

1. Dados principais.
2. Classificacao.
3. Conta/cartao.
4. Datas.
5. Observacoes.
6. Anexos.

## 28. Graficos

### Uso

- dashboard;
- analytics;
- relatorios.

### Regras

- usar Recharts;
- manter cores consistentes;
- usar tooltips;
- evitar excesso de series;
- graficos devem responder a filtros;
- sempre que possivel, acompanhar grafico com resumo textual.

## 29. Linguagem Visual por Modulo

### Dashboard

Mais analitico e executivo.

Usar:

- cards;
- graficos;
- rankings;
- indicadores.

### Lancamentos

Mais operacional.

Usar:

- filtros;
- tabela;
- acoes claras;
- badges de status.

### Importacoes

Mais guiado.

Usar:

- upload zone;
- etapas;
- resumo;
- tabela de auditoria;
- relatorio final.

### Assistente Financeiro

Mais conversacional.

Usar:

- layout de chat;
- sugestoes;
- recomendacoes;
- resumo lateral.

## 30. Regras de Utilizacao

1. Usar componentes compartilhados sempre que existirem.
2. Evitar criar estilos isolados sem necessidade.
3. Manter paddings, alturas e bordas consistentes.
4. Usar badges para estados.
5. Usar tabelas para dados comparativos.
6. Usar cards para indicadores e blocos.
7. Usar drawer para detalhes contextuais.
8. Usar modal apenas quando exigir foco.
9. Usar icones Lucide.
10. Garantir responsividade antes de concluir uma tela.
11. Garantir acessibilidade basica.
12. Seguir o Glossario Oficial para nomes de tela e campos.

## 31. Resumo

O Design System define uma interface clara, moderna e consistente para uma plataforma de gestao financeira inteligente.

Ele deve garantir:

- consistencia visual;
- facilidade de uso;
- responsividade;
- acessibilidade;
- reutilizacao;
- escalabilidade da interface.

Toda nova tela ou componente deve seguir estes padroes para manter o produto coeso e profissional.

