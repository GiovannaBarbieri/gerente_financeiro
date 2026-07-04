# 04 - Fluxos do Sistema

## 1. Proposito do Documento

Este documento descreve os principais fluxos funcionais do sistema, detalhando objetivo, fluxograma textual, entradas, processamento, saidas, regras e pontos de atencao.

Ele deve ser usado como referencia oficial para evolucao de funcionalidades, testes, validacao de regras de negocio e alinhamento entre produto e tecnologia.

## 2. Fluxo de Cadastro Manual de Lancamento

### Objetivo

Permitir que o usuario registre manualmente uma receita, despesa, transferencia, ajuste ou estorno no historico financeiro unificado.

### Fluxograma Textual

1. Usuario acessa a tela de Lancamentos.
2. Usuario clica em Novo Lancamento.
3. Sistema exibe formulario de cadastro.
4. Usuario informa dados principais.
5. Sistema valida campos obrigatorios.
6. Sistema normaliza data, valor, descricao e competencia.
7. Sistema aplica classificacao automatica quando categoria nao e informada.
8. Sistema gera identificadores e hash interno.
9. Sistema salva o lancamento na base principal.
10. Sistema atualiza historico, dashboard e analytics.

### Entradas

- tipo do lancamento;
- data;
- competencia;
- descricao;
- valor;
- conta;
- cartao;
- categoria;
- subcategoria;
- forma de pagamento;
- status;
- origem;
- instituicao;
- observacoes.

### Processamento

- validacao de campos obrigatorios;
- conversao de data;
- conversao de valor;
- definicao de natureza financeira;
- definicao de tipo de transacao;
- normalizacao da descricao;
- classificacao automatica opcional;
- persistencia em `financial_transactions`.

### Saidas

- lancamento criado;
- historico atualizado;
- indicadores recalculaveis;
- dados disponiveis para dashboard, relatorios e IA.

### Regras

- lancamentos manuais devem ter origem manual ou equivalente;
- conta e cartao nao devem ser obrigatorios ao mesmo tempo;
- categoria pode ser opcional, permitindo classificacao automatica;
- valor deve ser interpretado conforme natureza/tipo;
- exclusao fisica nao deve ser o comportamento padrao;
- lancamentos ignorados nao devem impactar indicadores principais.

### Pontos de Atencao

- evitar duplicidade manual acidental;
- garantir que despesas e receitas sejam sinalizadas corretamente;
- preservar historico de alteracoes quando auditoria estiver ativa;
- manter consistencia entre status visual e status persistido.

## 3. Fluxo de Edicao de Lancamento

### Objetivo

Permitir corrigir ou complementar dados de um lancamento existente.

### Fluxograma Textual

1. Usuario acessa o historico de lancamentos.
2. Usuario seleciona um lancamento.
3. Sistema carrega dados atuais.
4. Usuario altera campos permitidos.
5. Sistema valida alteracoes.
6. Sistema atualiza o lancamento.
7. Sistema registra auditoria quando aplicavel.
8. Sistema recalcula visualizacoes dependentes.

### Entradas

- identificador do lancamento;
- campos editados;
- categoria;
- subcategoria;
- conta;
- cartao;
- status;
- observacoes.

### Processamento

- busca do lancamento;
- validacao de permissao funcional;
- normalizacao de campos alterados;
- atualizacao da base principal;
- eventual registro de auditoria.

### Saidas

- lancamento atualizado;
- historico revisado;
- dashboards e relatorios refletindo nova informacao.

### Regras

- alteracoes nao devem quebrar rastreabilidade de importacao;
- dados brutos de importacao devem permanecer preservados;
- hashes originais devem ser tratados com cuidado;
- alteracoes de categoria podem atualizar status de revisao.

### Pontos de Atencao

- edicoes em lancamentos importados nao devem apagar a linha bruta original;
- mudancas em valor/data podem afetar relatorios historicos;
- alteracoes em conta/cartao podem impactar saldos e faturas.

## 4. Fluxo de Importacao Inteligente

### Objetivo

Permitir importar um ou varios arquivos financeiros sem que o usuario precise escolher manualmente se sao conta corrente, cartao ou lote.

### Fluxograma Textual

1. Usuario acessa Importar Extratos.
2. Usuario arrasta ou seleciona arquivos CSV/XLS/XLSX.
3. Sistema envia arquivos para pre-visualizacao.
4. Import Manager inicia processamento.
5. Sistema le cada arquivo.
6. Sistema normaliza cabecalhos.
7. Sistema detecta instituicao e tipo.
8. Parser Registry seleciona parser adequado.
9. Sistema mapeia colunas para o padrao interno.
10. Sistema valida campos obrigatorios.
11. Sistema gera previa consolidada.
12. Usuario revisa arquivos, erros e duplicidades.
13. Usuario confirma importacao.
14. Sistema salva lote, arquivos, linhas brutas e lancamentos.
15. Sistema exibe relatorio final.

### Entradas

- arquivos CSV;
- arquivos XLS/XLSX;
- nome dos arquivos;
- colunas;
- linhas brutas;
- decisoes do usuario na revisao.

### Processamento

- upload temporario;
- leitura por parser CSV/Excel;
- normalizacao de cabecalhos;
- deteccao de origem;
- escolha de parser;
- mapeamento de colunas;
- validacao;
- normalizacao financeira;
- classificacao;
- deteccao de duplicidade;
- persistencia.

### Saidas

- lote de importacao;
- arquivos de importacao;
- registros brutos;
- lancamentos financeiros;
- resumo geral;
- relatorio final;
- historico de importacoes.

### Regras

- arquivos com erro nao devem bloquear todo o lote;
- todos os dados salvos devem cair no historico unico;
- registros brutos devem ser mantidos para auditoria;
- duplicidades devem ser detectadas antes de salvar;
- importacao deve preservar compatibilidade com os servicos existentes.

### Pontos de Atencao

- arquivos CSV podem ter delimitadores e aspas;
- planilhas Excel podem possuir formatos diferentes;
- nomes de colunas podem variar por instituicao;
- deteccao automatica pode falhar e exigir revisao;
- grandes volumes exigem paginacao, cache ou processamento assincromo futuro.

## 5. Fluxo de Classificacao

### Objetivo

Categorizar lancamentos automaticamente com base na descricao, origem, tipo e regras cadastradas.

### Fluxograma Textual

1. Sistema recebe lancamento normalizado.
2. Sistema normaliza descricao.
3. Sistema consulta regras de classificacao ativas.
4. Sistema compara descricao com palavras-chave.
5. Sistema aplica regra mais prioritaria.
6. Sistema define categoria, subcategoria, origem e natureza.
7. Sistema atribui fonte e confianca da classificacao.
8. Sistema marca lancamento como pendente ou revisado conforme contexto.

### Entradas

- descricao original;
- descricao normalizada;
- tipo de origem;
- valor;
- regras de classificacao;
- categoria informada manualmente, quando existir.

### Processamento

- normalizacao textual;
- avaliacao de regras;
- match por criterio configurado;
- definicao de categoria;
- definicao de subcategoria;
- definicao de natureza financeira;
- definicao de origem;
- calculo de confianca.

### Saidas

- lancamento classificado;
- categoria;
- subcategoria;
- origem;
- natureza financeira;
- confianca;
- status de revisao.

### Regras

- classificacao manual deve prevalecer sobre automatica;
- regras com maior prioridade devem ser avaliadas primeiro;
- ausencia de regra deve manter categoria padrao;
- baixa confianca deve indicar revisao recomendada;
- regras devem ser auditaveis e explicaveis.

### Pontos de Atencao

- descricoes bancarias podem variar muito;
- palavras-chave muito genericas podem classificar incorretamente;
- regras especificas devem ter prioridade maior;
- feedback do usuario deve evoluir regras futuras.

## 6. Fluxo de Duplicidade

### Objetivo

Evitar que o mesmo lancamento seja importado ou cadastrado mais de uma vez.

### Fluxograma Textual

1. Sistema recebe item a ser salvo.
2. Sistema gera hash estrito.
3. Sistema gera hash flexivel quando aplicavel.
4. Sistema consulta lancamentos existentes.
5. Sistema compara hashes.
6. Sistema identifica duplicado exato, possivel duplicado ou novo registro.
7. Sistema apresenta resultado na pre-validacao.
8. Usuario confirma, ignora ou revisa conforme fluxo.

### Entradas

- data;
- valor;
- descricao;
- instituicao;
- conta/cartao;
- linha bruta;
- lote de importacao.

### Processamento

- criacao de hash;
- comparacao com base existente;
- classificacao do tipo de duplicidade;
- contagem por arquivo;
- exibicao na auditoria de importacao.

### Saidas

- novo registro;
- duplicado possivel;
- duplicado exato;
- contadores de duplicidade;
- decisao de importacao.

### Regras

- hash estrito deve ser usado para duplicidade mais segura;
- hash flexivel pode indicar possivel duplicidade;
- duplicidade nao deve apagar dados existentes automaticamente;
- usuario deve poder revisar casos duvidosos;
- importacao em lote deve continuar mesmo se um arquivo possuir duplicados.

### Pontos de Atencao

- compras parceladas podem parecer duplicadas;
- estabelecimentos com nomes iguais e valores iguais podem gerar falso positivo;
- importacoes repetidas devem ser detectadas com alta confiabilidade;
- substituicao de dados deve ser tratada em fase futura com cuidado.

## 7. Fluxo do Dashboard

### Objetivo

Exibir uma visao executiva do comportamento financeiro com base nos lancamentos existentes.

### Fluxograma Textual

1. Usuario acessa Dashboard.
2. Sistema carrega filtros globais.
3. Frontend solicita dados ao endpoint de analytics.
4. Backend consulta lancamentos e cadastros relacionados.
5. Analytics aplica filtros.
6. Analytics calcula agregacoes.
7. Resultado e cacheado por curto periodo.
8. Frontend renderiza cards, graficos, rankings e calendario.
9. Usuario altera filtros.
10. Dashboard atualiza todos os blocos.

### Entradas

- periodo;
- janela de analise;
- conta;
- cartao;
- categoria;
- tipo;
- instituicao;
- tags.

### Processamento

- busca de lancamentos;
- aplicacao de filtros;
- calculo de receitas;
- calculo de despesas;
- calculo de resultado;
- calculo de variacoes;
- agrupamento por categoria;
- agrupamento por conta/cartao;
- montagem de indicadores.

### Saidas

- resumo financeiro;
- fluxo financeiro;
- ranking de categorias;
- contas;
- cartoes;
- calendario financeiro;
- top gastos;
- indicadores.

### Regras

- nao utilizar dados ficticios;
- todos os graficos devem responder aos filtros;
- informacoes devem vir da base principal de lancamentos;
- indicadores devem ser consistentes com relatorios;
- cache nao deve comprometer atualizacao apos mudancas importantes.

### Pontos de Atencao

- filtros podem reduzir muito o conjunto de dados;
- comparacoes exigem periodo anterior disponivel;
- lancamentos ignorados nao devem distorcer analises;
- cartao pode ter impacto diferente em caixa e consumo real.

## 8. Fluxo de Analytics

### Objetivo

Centralizar agregacoes financeiras para alimentar Dashboard, Relatorios e Assistente Financeiro.

### Fluxograma Textual

1. Modulo solicita analytics.
2. Sistema recebe filtros.
3. Sistema verifica cache.
4. Se houver cache valido, retorna resultado.
5. Se nao houver cache, consulta dados financeiros.
6. Sistema aplica filtros.
7. Sistema calcula agregacoes.
8. Sistema monta resposta estruturada.
9. Sistema salva resultado em cache temporario.
10. Modulo consumidor renderiza ou interpreta dados.

### Entradas

- filtros;
- lancamentos;
- contas;
- cartoes;
- categorias;
- recorrencias;
- faturas.

### Processamento

- agregacao por periodo;
- agregacao por categoria;
- agregacao por conta;
- agregacao por cartao;
- calculo de variacoes;
- calculo de indicadores;
- montagem de rankings;
- preparacao de calendario financeiro.

### Saidas

- dados estruturados para dashboard;
- dados para relatorios;
- contexto resumido para IA;
- indicadores financeiros.

### Regras

- analytics nao deve alterar dados;
- deve centralizar logica de agregacao;
- deve evitar repeticao de consultas;
- deve respeitar filtros recebidos;
- deve ser reutilizavel por outros modulos.

### Pontos de Atencao

- cache deve ter tempo limitado;
- grandes volumes podem exigir otimizacao;
- agregacoes precisam diferenciar caixa e consumo real;
- novas metricas devem ser documentadas.

## 9. Fluxo do Assistente Financeiro

### Objetivo

Permitir que o usuario faca perguntas e receba respostas financeiras baseadas em contexto estruturado, resumido e seguro.

### Fluxograma Textual

1. Usuario acessa Assistente Financeiro.
2. Sistema carrega historico, contexto, recomendacoes e configuracoes.
3. Usuario envia pergunta.
4. Sistema cria ou recupera conversa.
5. Sistema monta contexto financeiro resumido.
6. Context Compressor limita tamanho do contexto.
7. Prompt Builder monta prompt conforme intencao.
8. AI Provider gera resposta.
9. Response Formatter prepara resposta final.
10. Sistema salva mensagens.
11. Memory Service registra objetivos quando aplicavel.
12. Resposta aparece no chat.

### Entradas

- pergunta do usuario;
- historico da conversa;
- contexto financeiro;
- memorias;
- configuracoes de IA;
- recomendacoes.

### Processamento

- deteccao de intencao;
- construcao de contexto;
- compressao;
- montagem de prompt;
- chamada ao provider;
- formatacao;
- persistencia;
- atualizacao de memoria.

### Saidas

- resposta do assistente;
- conversa atualizada;
- memoria atualizada;
- recomendacoes;
- simulacoes textuais.

### Regras

- IA nao deve acessar diretamente o banco;
- dados brutos nao devem ser enviados sem necessidade;
- contexto deve ser resumido e agregado;
- provider deve ser substituivel;
- respostas nao devem inventar dados;
- recomendacoes devem ser explicaveis;
- chaves e configuracoes sensiveis devem ser protegidas.

### Pontos de Atencao

- provider local nao substitui modelo externo completo;
- integracoes externas exigem seguranca adicional;
- perguntas financeiras podem envolver decisoes sensiveis;
- assistente deve apoiar, nao substituir julgamento do usuario.

## 10. Fluxo de Recomendacoes

### Objetivo

Gerar recomendacoes financeiras a partir de dados agregados e indicadores.

### Fluxograma Textual

1. Sistema monta contexto financeiro.
2. Sistema avalia categorias, despesas, cartoes e resultado.
3. Sistema identifica riscos ou oportunidades.
4. Sistema cria recomendacoes com prioridade e impacto estimado.
5. Recomendacoes sao persistidas ou exibidas.
6. Assistente e Dashboard podem consumir essas recomendacoes.

### Entradas

- resumo financeiro;
- categorias;
- cartoes;
- indicadores;
- recorrencias;
- alertas.

### Processamento

- avaliacao de maior categoria;
- avaliacao de crescimento;
- avaliacao de limite de cartao;
- avaliacao de resultado negativo;
- estimativa de impacto.

### Saidas

- recomendacoes;
- prioridade;
- impacto estimado;
- mensagem explicativa.

### Regras

- recomendacoes devem ser baseadas em dados reais;
- impacto deve ser estimado de forma conservadora;
- recomendacoes devem ser claras e acionaveis;
- recomendacoes nao devem alterar dados automaticamente.

### Pontos de Atencao

- recomendacoes ruins reduzem confianca;
- e melhor recomendar menos com mais qualidade;
- deve haver explicacao da origem da recomendacao;
- futuras recomendacoes podem usar IA externa.

## 11. Fluxo de Contas

### Objetivo

Permitir gerenciar contas e calcular sua posicao financeira.

### Fluxograma Textual

1. Usuario acessa Contas e Cartoes.
2. Sistema carrega contas.
3. Usuario cria ou edita conta.
4. Sistema salva dados cadastrais.
5. Sistema calcula saldo atual com base em lancamentos.
6. Conta fica disponivel para filtros, lancamentos e transferencias.

### Entradas

- nome;
- banco;
- tipo;
- saldo inicial;
- cor;
- icone;
- status;
- conta padrao.

### Processamento

- validacao;
- persistencia;
- calculo de movimentacao;
- calculo de saldo atual.

### Saidas

- conta criada ou atualizada;
- saldo por conta;
- filtros;
- dados para dashboard.

### Regras

- conta arquivada deve permanecer historica;
- saldo atual depende de saldo inicial e lancamentos;
- exclusao fisica deve ser restrita;
- transferencia utiliza contas como origem e destino.

### Pontos de Atencao

- alteracoes de nome podem afetar vinculos por texto;
- futuramente deve-se preferir vinculo por ID;
- saldo importado e saldo calculado podem divergir.

## 12. Fluxo de Cartoes

### Objetivo

Permitir gerenciar cartoes, limites, faturas e utilizacao.

### Fluxograma Textual

1. Usuario acessa Contas e Cartoes.
2. Sistema carrega cartoes.
3. Usuario cria ou edita cartao.
4. Sistema salva dados cadastrais.
5. Sistema calcula utilizacao com base em compras.
6. Dashboard exibe limite, utilizado e disponivel.

### Entradas

- nome;
- banco;
- bandeira;
- limite;
- fechamento;
- vencimento;
- conta de pagamento;
- status.

### Processamento

- validacao;
- persistencia;
- calculo de compras em aberto;
- calculo de limite disponivel;
- montagem de faturas.

### Saidas

- cartao criado ou atualizado;
- limite utilizado;
- limite disponivel;
- fatura atual;
- dados para dashboard.

### Regras

- compras de cartao devem ser lancamentos;
- fatura deve ser derivada de compras por competencia;
- pagamento de fatura deve ser conciliavel;
- cartao arquivado nao deve ser priorizado.

### Pontos de Atencao

- cartoes ainda podem estar vinculados por nome;
- faturas parciais exigem evolucao futura;
- fechamento e vencimento precisam ser tratados com rigor.

## 13. Fluxo de Categorias

### Objetivo

Permitir organizar lancamentos em categorias e subcategorias para analise e classificacao.

### Fluxograma Textual

1. Usuario acessa Categorias.
2. Sistema carrega categorias e subcategorias.
3. Usuario cria ou edita categoria.
4. Sistema salva configuracao.
5. Categoria fica disponivel para lancamentos e regras.
6. Analytics passa a agrupar dados pela categoria.

### Entradas

- nome;
- tipo;
- subcategorias;
- cor;
- icone;
- status;
- favorito;
- oculto.

### Processamento

- validacao;
- persistencia;
- atualizacao de listas;
- uso em classificacao.

### Saidas

- categoria criada ou atualizada;
- agrupamentos financeiros;
- filtros;
- dados para dashboard.

### Regras

- categorias em uso nao devem ser removidas sem tratamento;
- categorias ocultas nao devem ser destaque;
- classificacao automatica pode usar categoria;
- categoria deve ter tipo coerente com sua finalidade.

### Pontos de Atencao

- excesso de categorias dificulta analise;
- nomes duplicados devem ser evitados;
- mudancas podem alterar comparativos historicos.

## 14. Fluxo de Transferencia entre Contas

### Objetivo

Registrar movimentacao entre contas sem distorcer receitas e despesas reais.

### Fluxograma Textual

1. Usuario acessa Transferencia.
2. Informa conta origem, conta destino, valor e data.
3. Sistema cria lancamento de saida na origem.
4. Sistema cria lancamento de entrada na conta destino.
5. Ambos recebem origem/natureza de transferencia.
6. Dashboard e contas sao atualizados.

### Entradas

- conta origem;
- conta destino;
- valor;
- data;
- observacao.

### Processamento

- validacao de contas;
- criacao de dois lancamentos relacionados;
- classificacao como transferencia;
- atualizacao de saldos.

### Saidas

- lancamento de saida;
- lancamento de entrada;
- saldos atualizados.

### Regras

- transferencia nao deve ser tratada como despesa real;
- origem e destino devem ser diferentes;
- os dois lados devem permanecer rastreaveis;
- fase futura deve criar vinculo formal entre os dois lancamentos.

### Pontos de Atencao

- transferencia pode distorcer fluxo se classificada incorretamente;
- vinculo por descricao ainda e limitado;
- cancelamento deve tratar os dois lancamentos.

## 15. Fluxo de Configuracoes

### Objetivo

Permitir ajustar parametros gerais e preferencias do sistema.

### Fluxograma Textual

1. Usuario acessa Configuracoes.
2. Sistema carrega parametros atuais.
3. Usuario altera preferencias.
4. Sistema valida dados.
5. Sistema salva configuracoes.
6. Modulos consumidores passam a usar os novos valores.

### Entradas

- moeda;
- idioma;
- calendario;
- provedor de IA;
- modelo;
- temperatura;
- limite de contexto;
- futuras chaves e integracoes.

### Processamento

- validacao;
- mascaramento de chaves quando aplicavel;
- persistencia;
- disponibilizacao para modulos consumidores.

### Saidas

- configuracoes atualizadas;
- comportamento ajustado;
- provider de IA configurado.

### Regras

- chaves sensiveis nao devem ser expostas integralmente;
- configuracoes devem possuir valores padrao seguros;
- alteracoes nao devem quebrar historico;
- configuracoes devem ser versionaveis futuramente.

### Pontos de Atencao

- integracoes externas exigem seguranca adicional;
- configuracoes por usuario serao necessarias em ambiente multiusuario;
- alteracoes de moeda/calendario podem afetar apresentacao.

## 16. Fluxo de Relatorios

### Objetivo

Permitir analises especificas e detalhadas sobre dados financeiros.

### Fluxograma Textual

1. Usuario acessa Relatorios.
2. Sistema carrega filtros.
3. Usuario escolhe relatorio ou analise.
4. Sistema consulta dados consolidados.
5. Sistema monta graficos, tabelas e totais.
6. Usuario interpreta ou exporta os dados em fase futura.

### Entradas

- periodo;
- categoria;
- conta;
- cartao;
- origem;
- busca;
- tipo de relatorio.

### Processamento

- filtragem;
- agregacao;
- ordenacao;
- calculo de totais;
- montagem visual.

### Saidas

- relatorio por categoria;
- relatorio de fluxo;
- relatorio de cartoes;
- relatorio de contas;
- relatorios especificos.

### Regras

- relatorios devem usar dados reais;
- relatorios nao devem duplicar regras de analytics sem necessidade;
- filtros devem ser consistentes com Dashboard;
- relatorios especificos devem ser derivados de lancamentos.

### Pontos de Atencao

- relatorios devem ter escopo claro;
- exportacao futura deve preservar privacidade;
- divergencias com Dashboard devem ser investigadas.

## 17. Fluxo de Auditoria e Rastreabilidade

### Objetivo

Permitir entender a origem e as alteracoes dos dados financeiros.

### Fluxograma Textual

1. Sistema recebe dado importado ou manual.
2. Sistema registra origem.
3. Em importacoes, registra lote, arquivo e linha bruta.
4. Em alteracoes, registra estado anterior e posterior quando aplicavel.
5. Usuario ou sistema pode consultar detalhes.

### Entradas

- lote de importacao;
- arquivo;
- linha bruta;
- lancamento;
- alteracoes;
- usuario ou origem da acao.

### Processamento

- vinculacao de IDs;
- armazenamento de JSON bruto;
- registro de hashes;
- registro de auditoria.

### Saidas

- trilha de origem;
- historico de importacao;
- registros brutos;
- auditoria de alteracoes.

### Regras

- dados brutos importados devem ser preservados;
- hash deve permitir identificar duplicidades;
- auditoria nao deve alterar regras financeiras;
- rastreabilidade deve ser mantida mesmo apos edicoes.

### Pontos de Atencao

- auditoria pode crescer bastante;
- dados sensiveis exigem protecao;
- exclusao futura deve considerar retencao e privacidade.

## 18. Principios Gerais dos Fluxos

- todos os caminhos devem convergir para lancamentos financeiros;
- importacoes devem ser auditaveis;
- classificacao deve ser explicavel;
- duplicidade deve ser tratada antes de salvar;
- dashboard e analytics devem ser derivados da mesma fonte;
- IA deve consumir contexto resumido;
- configuracoes devem ter padroes seguros;
- fluxos devem ser incrementais e evitar reescritas completas.

