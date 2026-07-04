# 10 - Import Engine

## 1. Proposito do Documento

Este documento descreve a arquitetura oficial do Import Engine, ou Motor de Importacao, do sistema.

Ele documenta parser registry, deteccao automatica, leitura de CSV e Excel, preparacao para Open Finance, pre-validacao, normalizacao, classificacao, duplicidade, auditoria, importacao em lote, importacao individual, fluxo completo, entradas, saidas e estrategia futura para novos bancos.

O Import Engine deve permitir que dados financeiros externos sejam transformados em lancamentos financeiros confiaveis, rastreaveis e consistentes.

## 2. Objetivo do Import Engine

O objetivo do Import Engine e receber dados financeiros de diferentes origens e transforma-los em lancamentos padronizados no historico financeiro unificado.

Ele deve esconder a complexidade tecnica do usuario.

O usuario deve pensar apenas em:

> Importar Extratos

O sistema deve ser responsavel por detectar formato, instituicao, tipo, parser, colunas, erros e duplicidades.

## 3. Principios do Import Engine

### Entrada Flexivel

O sistema deve aceitar diferentes formatos e origens:

- CSV;
- Excel;
- arquivos de conta;
- arquivos de cartao;
- lotes com multiplos arquivos;
- futuras fontes Open Finance.

### Saida Unificada

Independentemente da origem, o resultado final deve ser sempre um lancamento financeiro em `financial_transactions`.

### Rastreabilidade

Toda importacao deve preservar:

- lote;
- arquivo;
- linha bruta;
- parser utilizado;
- instituicao;
- hashes;
- status;
- erros.

### Segurança

Arquivos devem ser processados com validacao e limites.

Dados brutos devem ser preservados para auditoria, mas nao expostos sem necessidade.

### Extensibilidade

Novos bancos e formatos devem ser adicionados por meio de parsers e registry, evitando `if/else` espalhado.

## 4. Componentes Principais

### Import Manager

Camada orquestradora da importacao inteligente.

Responsabilidades:

- receber arquivos;
- iniciar pre-visualizacao;
- acionar importacao em lote;
- enriquecer resumo;
- listar historico;
- confirmar importacao;
- gerar relatorio final.

### Batch Import Service

Motor principal da importacao em lote.

Responsabilidades:

- criar lote;
- mover arquivos temporarios;
- analisar arquivos;
- criar registros de arquivo;
- validar dados;
- detectar duplicidades;
- confirmar importacao;
- salvar registros brutos e lancamentos.

### Import Service

Fluxo de importacao individual legado.

Responsabilidades:

- pre-visualizar arquivo individual;
- importar arquivo de conta;
- importar arquivo de cartao;
- manter compatibilidade com fluxos antigos.

### File Parser

Camada responsavel por ler arquivos.

Responsabilidades:

- ler CSV;
- ler Excel;
- normalizar cabecalhos;
- normalizar linhas;
- devolver linhas brutas e linhas normalizadas.

### Column Mapping

Camada responsavel por mapear colunas externas para campos internos.

Responsabilidades:

- reconhecer aliases;
- mapear campos obrigatorios;
- mapear campos opcionais;
- inferir dados ausentes quando possivel;
- gerar previa estruturada.

### Parser Registry

Registro central de parsers disponiveis.

Responsabilidades:

- listar parsers;
- indicar instituicao;
- indicar prioridade;
- indicar tipos suportados;
- permitir selecao automatica;
- evitar logica espalhada.

### Parsers

Componentes que transformam linhas padronizadas em transacoes parseadas.

Exemplos:

- parser generico de conta;
- parser generico de cartao;
- parser de conta Nubank;
- parser de cartao Nubank.

### Normalization

Camada que transforma dados parseados em lancamentos normalizados.

Responsabilidades:

- normalizar descricao;
- definir competencia;
- definir natureza financeira;
- definir impactos;
- calcular pessoa/empresa;
- preparar dados para persistencia.

### Classification

Camada que atribui categoria, subcategoria, origem e confianca.

### Hash Service

Camada que gera hashes para duplicidade e auditoria.

## 5. Parser Registry

### Objetivo

Permitir que o sistema descubra automaticamente qual parser utilizar para cada arquivo.

### Estrutura Conceitual de um Parser

Cada parser deve informar:

- nome;
- instituicao;
- prioridade;
- tipos suportados;
- funcao `canParse`;
- funcao `parse`.

### Regras

- parsers mais especificos devem ter prioridade maior;
- parsers genericos devem ser fallback;
- o registry deve evitar condicoes espalhadas no codigo;
- novos bancos devem ser adicionados registrando novos parsers.

### Exemplos de Parsers

```text
NubankAccountParser
NubankCreditCardParser
GenericAccountParser
GenericCreditCardParser
```

### Estrategia de Selecao

1. Sistema detecta tipo do arquivo.
2. Sistema detecta instituicao.
3. Registry filtra parsers compativeis.
4. Parsers sao ordenados por prioridade.
5. Sistema escolhe o primeiro parser cujo `canParse` retorna verdadeiro.
6. Se nenhum parser especifico for encontrado, usa parser generico.

## 6. Deteccao Automatica

### Objetivo

Identificar automaticamente caracteristicas do arquivo antes da importacao.

### Dados Detectados

- instituicao;
- tipo do arquivo;
- conta;
- cartao;
- formato;
- parser;
- quantidade de registros;
- colunas.

### Instituicoes Esperadas

Exemplos:

- Nubank;
- Inter;
- Sicredi;
- Bradesco;
- Caixa;
- Banco do Brasil;
- Santander;
- Itau;
- Outros.

### Tipos Detectados

- Conta Corrente;
- Conta Poupanca;
- Conta Investimento;
- Cartao de Credito;
- Origem desconhecida.

### Regras

- deteccao deve usar nome do arquivo, colunas e sinais do conteudo;
- quando nao for possivel detectar, sistema deve indicar origem desconhecida;
- usuario deve poder revisar ou corrigir em fase futura;
- deteccao nao deve bloquear processamento quando houver parser generico aplicavel.

## 7. CSV

### Objetivo

Ler arquivos CSV exportados por bancos, cartoes e plataformas financeiras.

### Regras de Leitura

- usar parser CSV confiavel;
- considerar virgula como delimitador quando aplicavel;
- respeitar campos entre aspas;
- preservar linhas brutas;
- normalizar cabecalhos;
- remover espacos extras;
- nao tratar linha inteira como texto unico.

### Entradas

- arquivo `.csv`;
- cabecalho;
- linhas;
- delimitador;
- aspas.

### Saidas

- `rawRows`;
- `normalizedRows`;
- colunas detectadas.

### Pontos de Atencao

- alguns CSVs usam ponto e virgula;
- alguns bancos usam encoding diferente;
- valores podem usar virgula decimal;
- datas podem variar de formato.

## 8. Excel

### Objetivo

Ler arquivos de planilha exportados ou montados manualmente.

### Formatos

- `.xlsx`;
- `.xls`.

### Regras de Leitura

- ler primeira aba por padrao;
- converter linhas para JSON;
- preservar dados brutos;
- normalizar cabecalhos;
- tratar datas de Excel;
- tratar valores textuais e numericos.

### Entradas

- arquivo Excel;
- primeira aba;
- cabecalhos;
- linhas.

### Saidas

- `rawRows`;
- `normalizedRows`;
- colunas detectadas.

### Pontos de Atencao

- planilhas podem ter linhas de titulo antes do cabecalho;
- pode haver multiplas abas;
- datas podem vir como serial numerico;
- formulas podem ser exportadas como texto.

## 9. Open Finance (Preparacao)

### Objetivo Futuro

Permitir que dados financeiros sejam sincronizados por integracoes autorizadas, reduzindo dependencia de arquivos manuais.

### Papel no Import Engine

Open Finance deve ser tratado como mais uma fonte de entrada.

Assim como CSV e Excel, dados vindos de Open Finance devem passar por:

- normalizacao;
- classificacao;
- duplicidade;
- auditoria;
- persistencia como lancamento financeiro.

### Fluxo Futuro

```text
Conector Open Finance
  -> Dados brutos da instituicao
  -> Adaptador
  -> Normalizacao
  -> Classificacao
  -> Duplicidade
  -> Lancamentos
```

### Regras Futuras

- consentimento deve ser registrado;
- sincronizacao deve ser auditavel;
- usuario deve poder revogar acesso;
- dados sincronizados devem ter origem rastreavel;
- duplicidade com importacoes manuais deve ser tratada.

## 10. Pre-validacao

### Objetivo

Validar arquivos e dados antes de salvar lancamentos.

### Responsabilidades

- verificar colunas obrigatorias;
- contar linhas;
- identificar registros validos;
- identificar duplicados;
- identificar erros;
- mostrar parser utilizado;
- mostrar instituicao detectada;
- exibir previa.

### Campos Obrigatorios

Para conta:

- data;
- descricao;
- valor.

Para cartao:

- data;
- descricao;
- valor.

### Saidas

- resumo por arquivo;
- resumo consolidado;
- lista de problemas;
- previa de lancamentos;
- status de cada arquivo.

### Regras

- pre-validacao nao deve salvar lancamentos finais;
- arquivo com erro deve ser marcado individualmente;
- lote deve continuar mesmo quando um arquivo falha;
- usuario deve revisar antes de confirmar.

## 11. Normalizacao

### Objetivo

Transformar dados externos em formato financeiro interno consistente.

### Responsabilidades

- converter datas;
- converter valores;
- normalizar descricao;
- calcular competencia;
- identificar pessoa/empresa;
- definir natureza financeira;
- definir tipo de transacao;
- definir impacto em caixa;
- definir impacto em consumo real.

### Entradas

- dados parseados;
- contexto de origem;
- instituicao;
- conta/cartao;
- competencia;

### Saidas

- lancamento normalizado;
- campos internos padronizados;
- hashes;
- flags de impacto.

### Regras

- valores devem ser parseados com cuidado para formato brasileiro;
- descricoes devem ser preservadas em forma original e normalizada;
- competencia deve ser calculada quando ausente;
- compra de cartao deve impactar consumo real;
- pagamento de fatura deve ser tratado como transferencia.

## 12. Classificacao

### Objetivo

Classificar lancamentos importados com categoria, subcategoria, origem e natureza.

### Responsabilidades

- aplicar regras ativas;
- respeitar prioridade;
- calcular confianca;
- identificar origem;
- identificar transferencia, investimento ou despesa;
- sinalizar revisao quando necessario.

### Entradas

- descricao normalizada;
- source type;
- regras de classificacao;
- categoria padrao.

### Saidas

- categoria;
- subcategoria;
- origem;
- natureza;
- confianca;
- fonte da classificacao.

### Regras

- regra especifica deve prevalecer sobre generica;
- ausencia de regra deve resultar em categoria padrao;
- confianca baixa deve indicar revisao;
- classificacao nao deve apagar descricao original.

## 13. Duplicidade

### Objetivo

Evitar importacao repetida de lancamentos.

### Tipos

- duplicado exato;
- duplicado possivel;
- novo registro.

### Responsabilidades

- gerar hash da linha bruta;
- gerar hash estrito;
- gerar hash flexivel;
- comparar com lancamentos existentes;
- contar duplicados;
- apresentar resultado na revisao.

### Entradas

- data;
- valor;
- descricao;
- instituicao;
- conta/cartao;
- linha bruta.

### Saidas

- status de duplicidade;
- contadores;
- decisao de salvar ou ignorar.

### Regras

- duplicidade exata deve ser evitada;
- duplicidade possivel deve ser revisavel;
- importacao nao deve apagar lancamento existente;
- duplicidade nao deve bloquear todo o lote.

## 14. Auditoria

### Objetivo

Garantir rastreabilidade completa do processo de importacao.

### Elementos Auditaveis

- lote;
- arquivo;
- linha bruta;
- parser;
- instituicao;
- status;
- erros;
- hashes;
- lancamento final.

### Tabelas Envolvidas

- `import_batches`;
- `import_files`;
- `raw_import_records`;
- `imports`;
- `financial_transactions`.

### Regras

- linha bruta deve ser preservada;
- registros processados devem ser marcados;
- arquivo deve manter status;
- lote deve manter resumo;
- erro deve ser registrado sem interromper todo o processo.

## 15. Importacao em Lote

### Objetivo

Processar varios arquivos em uma unica operacao.

### Fluxo

```text
Upload de multiplos arquivos
  -> Criacao do lote
  -> Analise individual por arquivo
  -> Resumo consolidado
  -> Revisao
  -> Confirmacao
  -> Salvamento dos arquivos validos
  -> Relatorio final
```

### Regras

- cada arquivo deve ter status proprio;
- erro em um arquivo nao deve bloquear os demais;
- usuario pode remover arquivos do lote;
- confirmacao deve salvar apenas arquivos selecionados;
- resumo final deve consolidar importados, duplicados e erros.

## 16. Importacao Individual

### Objetivo

Manter compatibilidade com fluxos antigos de importacao por conta ou cartao.

### Fluxos Existentes

- pre-visualizar conta;
- importar conta;
- pre-visualizar cartao;
- importar cartao.

### Regras

- deve continuar salvando em `financial_transactions`;
- deve reaproveitar normalizacao, classificacao e hash;
- nao deve ser o fluxo principal para o usuario final;
- deve permanecer enquanto houver dependencia ou necessidade operacional.

## 17. Fluxo Completo do Import Engine

```text
Arquivo ou fonte externa
  -> Upload ou sincronizacao
  -> Leitura do formato
  -> Preservacao de dados brutos
  -> Normalizacao de cabecalhos
  -> Deteccao de instituicao
  -> Deteccao de tipo
  -> Selecao de parser
  -> Mapeamento de colunas
  -> Pre-validacao
  -> Parse das linhas
  -> Normalizacao financeira
  -> Classificacao
  -> Geracao de hashes
  -> Deteccao de duplicidade
  -> Revisao do usuario
  -> Confirmacao
  -> Persistencia
  -> Auditoria
  -> Relatorio final
  -> Lancamentos disponiveis no historico
```

## 18. Entradas do Import Engine

- arquivos CSV;
- arquivos Excel;
- dados futuros de Open Finance;
- nome do arquivo;
- metadados;
- colunas;
- linhas;
- configuracoes de parser;
- decisoes do usuario;
- regras de classificacao existentes.

## 19. Saidas do Import Engine

- lancamentos financeiros;
- registros brutos;
- lote de importacao;
- arquivos processados;
- erros;
- duplicidades;
- resumo;
- relatorio final;
- historico de importacao;
- dados para analytics.

## 20. Estrategia para Novos Bancos

### Passo 1: Coletar Amostras

Obter arquivos reais exportados pela instituicao.

Coletar:

- CSV;
- Excel;
- conta;
- cartao;
- diferentes periodos;
- casos com parcelas;
- casos com estornos.

### Passo 2: Identificar Sinais

Mapear:

- nome do arquivo;
- colunas;
- padroes de descricao;
- formato de data;
- formato de valor;
- identificadores proprios.

### Passo 3: Criar Parser Especifico

Adicionar parser quando o generico nao for suficiente.

O parser deve:

- informar nome;
- informar instituicao;
- informar tipos suportados;
- implementar `canParse`;
- implementar `parse`.

### Passo 4: Registrar no Parser Registry

Adicionar parser com prioridade adequada.

Parsers especificos devem vir antes dos genericos.

### Passo 5: Criar Casos de Teste

Validar:

- leitura;
- mapeamento;
- datas;
- valores;
- descricao;
- classificacao;
- duplicidade.

### Passo 6: Documentar

Atualizar documentacao com:

- instituicao suportada;
- formatos aceitos;
- colunas esperadas;
- limitacoes.

## 21. Bancos e Instituicoes Prioritarias

Lista sugerida para evolucao:

- Nubank;
- Inter;
- Sicredi;
- Bradesco;
- Caixa;
- Banco do Brasil;
- Santander;
- Itau;
- C6;
- XP;
- BTG;
- Outros.

## 22. Pontos de Atencao

### Dados Bancarios Variam Muito

Mesmo dentro da mesma instituicao, o formato pode mudar conforme produto, periodo ou canal de exportacao.

### Excel Pode Nao Ser Estruturado

Algumas planilhas podem ter cabecalhos extras, rodapes, totais e linhas vazias.

### Valores Podem Ser Ambiguos

Alguns arquivos usam:

- valores negativos;
- coluna de debito/credito;
- sinal separado;
- moeda junto ao valor.

### Cartao e Conta Devem Ser Atributos

O Import Engine pode detectar origem operacional, mas a experiencia final deve continuar baseada em lancamentos unificados.

### Duplicidade Deve Ser Conservadora

Falso positivo pode impedir dado valido.

Falso negativo pode duplicar despesa.

Casos duvidosos devem ser revisaveis.

## 23. Evolucoes Futuras

- selecao manual de instituicao quando desconhecida;
- treinamento de mapeamento por usuario;
- suporte a mais delimitadores CSV;
- leitura de multiplas abas Excel;
- revisao linha a linha antes de salvar;
- decisao por duplicado: importar, ignorar, substituir;
- processamento assincrono para lotes grandes;
- fila de importacao;
- suporte a Open Finance;
- parsers versionados;
- testes automatizados por banco;
- historico de mudancas de formato por instituicao.

## 24. Resumo

O Import Engine e responsavel por transformar dados externos em lancamentos financeiros confiaveis.

Ele deve:

- aceitar diferentes formatos;
- detectar origem automaticamente;
- escolher parser adequado;
- validar antes de salvar;
- normalizar dados;
- classificar lancamentos;
- detectar duplicidade;
- preservar auditoria;
- salvar no historico unificado.

A arquitetura deve continuar modular para permitir novos bancos, novos formatos e futuras integracoes Open Finance sem reescrever o sistema.

