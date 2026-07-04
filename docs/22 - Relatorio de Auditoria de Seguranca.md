# 22 - Relatorio de Auditoria de Seguranca

## 1. Objetivo

Realizar auditoria de seguranca da aplicacao atual, cobrindo:

- validacao;
- sanitizacao;
- uploads;
- SQL Injection;
- XSS;
- CSRF;
- headers;
- CORS;
- rate limit;
- logs;
- secrets;
- `.env`;
- autenticacao;
- autorizacao;
- dependencias.

Esta auditoria nao implementa correcoes. O objetivo e documentar riscos, evidencias e recomendacoes classificadas em Critico, Alto, Medio e Baixo.

## 2. Escopo Avaliado

Arquivos e areas revisadas:

- `backend/src/server.ts`;
- `backend/src/routes/FinanceRoutes.ts`;
- `backend/src/routes/ImportRoutes.ts`;
- `backend/src/routes/AiRoutes.ts`;
- `backend/src/middlewares/ErrorMiddleware.ts`;
- `backend/src/services/*`;
- `frontend/src`;
- `frontend/server.mjs`;
- `.gitignore`;
- `.env` e `.env.example`;
- `package.json` dos workspaces;
- `npm audit`.

## 3. Resumo Executivo

O sistema esta adequado para ambiente local de desenvolvimento, mas ainda nao esta pronto para exposicao em rede publica ou uso multiusuario.

Os riscos mais relevantes sao:

1. ausencia total de autenticacao e autorizacao;
2. uploads sem limite de tamanho e sem filtro backend de extensao/MIME;
3. dependencia `xlsx` com vulnerabilidade alta sem fix disponivel;
4. ausencia de rate limit;
5. ausencia de headers de seguranca;
6. tratamento de erros expondo mensagens tecnicas;
7. validacao parcial dos payloads;
8. configuracao de CORS simples, sem estrategia de producao.

Pontos positivos encontrados:

- Prisma reduz risco de SQL Injection nos fluxos atuais;
- nao foram encontrados usos de `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `new Function`;
- `.env` esta no `.gitignore`;
- apenas `.env.example` esta versionado;
- a chave de IA, quando informada, e armazenada mascarada;
- uploads sao gravados com nomes temporarios gerados pelo Multer, reduzindo risco direto de path traversal no arquivo inicial.

## 4. Achados Criticos

### C1. Ausencia de autenticacao

Classificacao: Critico

Evidencia:

- Nenhuma rota exige usuario autenticado;
- nao ha JWT, session, cookie seguro, API key, middleware de auth ou controle por usuario;
- endpoints sensiveis estao acessiveis diretamente:
  - `GET /api/financial-entries`;
  - `POST /api/financial-entries`;
  - `DELETE /api/financial-entries/:id`;
  - `POST /api/imports/*`;
  - `GET /api/ai/context`;
  - `GET /api/ai/history`;
  - `PATCH /api/ai/settings`;
  - `GET /api/accounts`;
  - `GET /api/cards`.

Impacto:

- qualquer cliente que alcance a API pode ler, criar, editar ou ignorar lancamentos;
- qualquer cliente pode importar arquivos;
- qualquer cliente pode consultar contexto financeiro e conversas da IA;
- qualquer cliente pode alterar configuracoes;
- se a API for exposta fora da maquina local, ha risco direto de vazamento e manipulacao de dados financeiros.

Recomendacao:

- antes de expor o sistema em rede, implementar autenticacao obrigatoria;
- iniciar com modo local protegido por senha ou token;
- depois evoluir para usuario/sessao/JWT;
- bloquear todos endpoints exceto `/api/health` sem autenticacao.

### C2. Ausencia de autorizacao

Classificacao: Critico

Evidencia:

- existem campos `user_id` preparados em algumas tabelas, mas nao ha enforcement;
- services nao filtram dados por usuario;
- rotas nao validam dono do recurso;
- `conversationId`, `financialEntryId`, `importBatchId` e outros IDs podem ser informados livremente.

Impacto:

- em um futuro multiusuario, um usuario poderia acessar dados de outro se conhecesse IDs;
- conversas de IA e lancamentos nao possuem isolamento logico;
- importacoes e historicos seriam globais.

Recomendacao:

- criar middleware `requireAuth`;
- propagar `userId` para services;
- filtrar todas as queries por `userId`;
- validar ownership em detalhes, updates, deletes, imports e IA;
- adicionar foreign keys para `users` quando multiusuario for implementado.

## 5. Achados Altos

### A1. Uploads sem limite de tamanho

Classificacao: Alto

Evidencia:

`ImportRoutes.ts`:

```ts
const upload = multer({ dest: "uploads/" });
```

Nao ha:

- `limits.fileSize`;
- limite por request;
- limite por quantidade total de bytes;
- validacao backend de extensao;
- validacao backend de MIME;
- rejeicao de arquivos desconhecidos antes de salvar.

Impacto:

- risco de DoS por upload de arquivos grandes;
- consumo de disco em `uploads`;
- consumo de memoria/CPU ao processar CSV/XLSX;
- risco maior pela vulnerabilidade do `xlsx`.

Recomendacao:

- definir limite de tamanho por arquivo;
- definir limite total por lote;
- usar `fileFilter`;
- aceitar apenas `.csv`, `.xlsx`, `.xls`;
- validar MIME e extensao;
- rejeitar arquivos vazios;
- limpar arquivos temporarios em todos os caminhos de erro.

### A2. Dependencia `xlsx` com vulnerabilidade alta

Classificacao: Alto

Evidencia:

`npm audit` retornou:

```text
xlsx
Severity: high
Prototype Pollution in sheetJS
SheetJS Regular Expression Denial of Service (ReDoS)
No fix available
```

Uso:

`FileParserService.ts`:

```ts
import * as XLSX from "xlsx";
XLSX.readFile(path);
XLSX.utils.sheet_to_json(...)
```

Impacto:

- arquivos Excel enviados por usuario passam pelo pacote vulneravel;
- risco de ReDoS por arquivo malicioso;
- risco de prototype pollution dependendo do payload e do uso dos objetos parseados;
- sem fix disponivel no pacote atual.

Recomendacao:

- considerar substituir `xlsx` por biblioteca com manutencao/patch ativo;
- enquanto nao substituir, limitar tamanho e quantidade de linhas;
- processar Excel em ambiente isolado se o sistema for exposto;
- preferir CSV para importacoes ate resolver dependencia;
- documentar risco no roadmap tecnico.

### A3. Ausencia de rate limit

Classificacao: Alto

Evidencia:

- nao ha `express-rate-limit` ou middleware equivalente;
- endpoints pesados podem ser chamados repetidamente:
  - dashboards;
  - analytics;
  - importacoes;
  - IA;
  - busca global.

Impacto:

- DoS por chamadas repetidas;
- sobrecarga em analytics que carrega muitas transacoes;
- importacoes podem consumir CPU/disco;
- chat/IA pode gerar muitas conversas/mensagens.

Recomendacao:

- aplicar rate limit global;
- limites mais restritos em:
  - `/api/imports/*`;
  - `/api/ai/chat`;
  - `/api/analytics-dashboard`;
  - `/api/search`;
- considerar limite por IP e, futuramente, por usuario.

### A4. Tratamento de erros expõe mensagens internas

Classificacao: Alto

Evidencia:

`ErrorMiddleware.ts`:

```ts
console.error(error);
res.status(500).json({ message: error instanceof Error ? error.message : "Erro inesperado" });
```

Impacto:

- mensagens de Prisma, parsing, filesystem e validacao podem ser retornadas ao cliente;
- stack trace fica no console;
- informacoes tecnicas ajudam um atacante a mapear estrutura interna;
- erros de validacao viram `500`, dificultando controle.

Recomendacao:

- criar `AppError`;
- mapear Zod para `400/422`;
- mapear Prisma `not found` para `404`;
- mapear unique constraint para `409`;
- retornar mensagens genericas em producao;
- logar detalhes somente no servidor.

### A5. Headers de seguranca ausentes

Classificacao: Alto

Evidencia:

`server.ts` nao usa `helmet` ou headers equivalentes.

Ausentes:

- `Content-Security-Policy`;
- `X-Frame-Options` ou `frame-ancestors`;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- `Cross-Origin-Resource-Policy`;
- `Strict-Transport-Security` em producao HTTPS.

Impacto:

- maior exposicao a XSS refletido/persistido caso algum vetor apareca;
- risco de clickjacking;
- politicas do browser ficam permissivas demais.

Recomendacao:

- adicionar `helmet`;
- definir CSP adequada para frontend;
- separar configuracao dev/prod.

### A6. CORS simples e dependente de env

Classificacao: Alto

Evidencia:

`server.ts`:

```ts
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
```

Impacto:

- bom para local, mas insuficiente para producao;
- se `FRONTEND_URL` for configurado de forma permissiva em deploy, API fica exposta a origens indevidas;
- nao ha lista de origens permitidas;
- nao ha estrategia para credenciais/cookies futura.

Recomendacao:

- usar allowlist;
- falhar fechado quando origem nao for reconhecida;
- separar config dev/prod;
- se usar cookies no futuro, configurar `credentials`, SameSite e HTTPS.

## 6. Achados Medios

### M1. Validacao parcial de payloads

Classificacao: Medio

Evidencia:

Rotas com Zod:

- `POST /financial-entries`;
- `PATCH /financial-entries/:id`;
- `PATCH /transactions/:source/:id`;
- `POST /categories`;
- `POST /api/ai/chat`.

Rotas com `req.body` livre:

- `POST /accounts`;
- `PATCH /accounts/:id`;
- `POST /cards`;
- `PATCH /cards/:id`;
- `POST /payment-methods`;
- `POST /tags`;
- `POST /saved-filters`;
- `POST /recurring-entries`;
- `POST /transfers`;
- `PATCH /ai/settings`;
- confirmacoes de importacao.

Impacto:

- campos inesperados sao convertidos silenciosamente;
- strings grandes podem ser salvas;
- valores de status/tipo podem ser arbitrarios;
- inconsistencias de dados e risco de abuso.

Recomendacao:

- criar validators por rota;
- limitar tamanho de strings;
- validar enums;
- validar UUID/Int em params;
- rejeitar payloads com campos desconhecidos quando possivel.

### M2. Sanitizacao de dados insuficiente

Classificacao: Medio

Evidencia:

- strings sao salvas como recebidas em varios cadastros;
- nao ha sanitizacao centralizada;
- frontend renderiza com React, o que escapa texto por padrao;
- nao foi encontrado `dangerouslySetInnerHTML`.

Impacto:

- XSS direto no frontend atual e menos provavel por causa do escaping do React;
- dados maliciosos podem ficar persistidos e virar risco se futuramente forem usados em HTML, exportacoes, PDFs ou emails;
- risco de formula injection se houver exportacao CSV/XLSX futura.

Recomendacao:

- normalizar e limitar entradas;
- criar sanitizacao de texto para campos livres;
- escapar conteudo em exportacoes;
- proteger contra CSV formula injection se exportar dados.

### M3. SQL Injection: risco baixo no fluxo atual, mas falta padrao formal

Classificacao: Medio

Evidencia:

- services usam Prisma Client com objetos `where`, reduzindo risco de SQL Injection;
- nao foram encontrados `queryRawUnsafe` ou `executeRawUnsafe` no codigo da aplicacao;
- a auditoria usou scripts locais com raw SQL, mas eles nao fazem parte do runtime.

Impacto:

- risco atual e baixo;
- futuro uso de raw SQL sem padrao pode reintroduzir risco.

Recomendacao:

- proibir `queryRawUnsafe` em runtime;
- se precisar raw SQL, usar parametros;
- adicionar regra de lint/code review.

### M4. CSRF nao tratado explicitamente

Classificacao: Medio

Evidencia:

- API nao usa cookies/sessao hoje;
- frontend usa axios sem credenciais;
- nao ha autenticação.

Impacto:

- com o modelo atual sem cookies, CSRF classico e menos aplicavel;
- se autenticação por cookie for adicionada, risco vira alto sem SameSite/CSRF token.

Recomendacao:

- se usar JWT em header, CSRF e menos relevante;
- se usar cookie de sessao, implementar SameSite, CSRF token e checagem de origem.

### M5. Logs podem conter dados sensiveis

Classificacao: Medio

Evidencia:

- `console.error(error)` no middleware;
- erros de importacao/parsing podem conter nomes de arquivos ou dados de processamento;
- perguntas da IA sao persistidas em `ai_messages` e algumas em `ai_memories`.

Impacto:

- logs podem armazenar detalhes financeiros ou operacionais;
- sem politica de retencao;
- risco em producao ou suporte remoto.

Recomendacao:

- usar logger estruturado;
- mascarar dados sensiveis;
- nao logar payloads completos;
- definir retencao;
- revisar mensagens de erro antes de logar.

### M6. Privacidade da IA

Classificacao: Medio

Evidencia:

- `buildFinancialContext` monta contexto financeiro agregado;
- `chatWithAI` persiste pergunta e resposta;
- `rememberFromQuestion` salva metas detectadas a partir da pergunta;
- provider atual e local, mas existem opcoes de provider externo na UI/config.

Impacto:

- perguntas podem conter dados sensiveis;
- memorias persistem trechos da pergunta;
- se provider externo real for implementado, contexto financeiro agregado pode sair da maquina.

Recomendacao:

- adicionar aviso de privacidade;
- permitir limpar conversas/memorias;
- mascarar dados sensiveis antes de provider externo;
- exigir confirmacao para envio externo;
- separar provider local de provider externo por configuracao segura.

### M7. Uploads temporarios podem ficar acumulados em alguns cenarios

Classificacao: Medio

Evidencia:

- preview individual remove arquivo via `fs.unlink`;
- confirmacao de lote remove `file.tempPath` apos sucesso;
- alguns erros atualizam status, mas nem sempre removem arquivo temporario.

Impacto:

- consumo de disco;
- arquivos financeiros podem permanecer em `uploads/batches`;
- risco de exposicao se diretório for servido por engano no futuro.

Recomendacao:

- rotina de limpeza de uploads antigos;
- garantir `finally` para remover arquivos quando nao forem mais necessarios;
- nunca servir `uploads` estaticamente;
- separar armazenamento temporario de armazenamento permanente.

## 7. Achados Baixos

### B1. `.env` local nao esta versionado, mas `.env.example` contem valores reais de dev

Classificacao: Baixo

Evidencia:

- `.gitignore` inclui `.env`, `.env.local`, `*.db`, `uploads`, `*.log`;
- `git ls-files` mostra apenas `backend/.env.example`;
- `.env.example` contem valores de desenvolvimento, sem segredo real.

Impacto:

- baixo no estado atual;
- bom que `.env` nao esta versionado.

Recomendacao:

- manter `.env` fora do Git;
- se houver chaves reais no futuro, nunca colocar em `.env.example`;
- usar placeholders.

### B2. Bancos SQLite e backups locais no workspace

Classificacao: Baixo

Evidencia:

Arquivos locais encontrados:

- `backend/prisma/dev.db`;
- backups `.db`.

Eles nao estao versionados por causa do `.gitignore`.

Impacto:

- baixo para desenvolvimento local;
- risco se pasta for compartilhada/zipada manualmente.

Recomendacao:

- manter backups fora do repo quando possivel;
- documentar que `.db` contem dados financeiros;
- limpar backups antigos.

### B3. Frontend dev server sem headers de seguranca

Classificacao: Baixo

Evidencia:

`frontend/server.mjs` serve `dist` com Express e apenas `Cache-Control: no-store`.

Impacto:

- aceitavel para dev local;
- nao deve ser usado como servidor de producao sem hardening.

Recomendacao:

- em producao, servir frontend por servidor com headers adequados;
- ou adicionar `helmet` tambem no frontend server se ele for usado fora do dev.

### B4. Botao de anexo no Assistente sem funcionalidade

Classificacao: Baixo

Evidencia:

UI mostra botao `Paperclip`, mas nao ha upload no assistente.

Impacto:

- sem risco direto agora;
- se implementado depois, deve seguir politica de upload segura.

Recomendacao:

- antes de ativar anexos, definir limites, tipos aceitos e armazenamento.

## 8. XSS

Status atual: risco baixo a medio.

Pontos positivos:

- React escapa strings por padrao;
- nao foram encontrados:
  - `dangerouslySetInnerHTML`;
  - `innerHTML`;
  - `eval`;
  - `new Function`.

Pontos de atencao:

- descricoes, categorias, notas, nomes de contas/cartoes e mensagens de IA sao dados persistidos;
- se futuramente forem usados em HTML bruto, exportacao ou template externo, podem virar vetor de XSS/injection.

Recomendacao:

- manter proibicao de `dangerouslySetInnerHTML`;
- sanitizar/limitar entradas;
- escapar conteudo em exports.

## 9. SQL Injection

Status atual: risco baixo.

Pontos positivos:

- Prisma Client e usado na aplicacao;
- buscas usam objetos `where`;
- nao ha raw SQL inseguro no runtime.

Pontos de atencao:

- busca global usa `contains`, mas via Prisma;
- se novos relatorios usarem raw SQL, exigir parametros.

Recomendacao:

- documentar regra: nao usar `queryRawUnsafe`;
- revisar qualquer SQL manual.

## 10. Uploads

Status atual: risco alto.

Problemas principais:

- sem limite de tamanho;
- sem `fileFilter`;
- sem limite total por lote em bytes;
- aceita Excel com biblioteca vulneravel;
- arquivos podem permanecer em disco em alguns erros;
- validacao frontend de extensao nao substitui validacao backend.

Recomendacao minima antes de expor:

```text
1. limits.fileSize
2. limits.files
3. fileFilter por extensao/MIME
4. limite de linhas
5. limpeza em finally
6. logs sem dados sensiveis
```

## 11. Headers, CORS e CSRF

Headers:

- ausentes no backend;
- usar `helmet`.

CORS:

- configurado para uma origem via env;
- precisa allowlist em producao.

CSRF:

- nao critico enquanto nao houver cookies;
- deve ser revisado junto com autenticacao.

## 12. Secrets e `.env`

Status atual:

- `.env` nao versionado;
- `.env.example` versionado sem segredo real;
- `DATABASE_URL` aponta para SQLite local;
- API key de IA e armazenada apenas mascarada.

Risco futuro:

- se provider externo real for implementado, sera necessario armazenar segredo de forma segura;
- mascarar chave nao permite uso real posterior, entao provavelmente exigira cofre/env var.

Recomendacao:

- usar variaveis de ambiente para chaves reais;
- nunca persistir API key em texto puro no banco;
- se precisar persistir, usar criptografia com chave fora do banco.

## 13. Matriz de Riscos

| Severidade | Item | Area |
| --- | --- | --- |
| Critico | Sem autenticacao | Backend/API |
| Critico | Sem autorizacao/ownership | Backend/API/Banco |
| Alto | Upload sem limite/filtro | Importacoes |
| Alto | `xlsx` vulneravel sem fix | Dependencias/Uploads |
| Alto | Sem rate limit | API |
| Alto | Erros expostos ao cliente | API |
| Alto | Sem headers de seguranca | API/Frontend |
| Alto | CORS sem allowlist robusta | API |
| Medio | Validacao parcial | API |
| Medio | Sanitizacao insuficiente | API/Frontend |
| Medio | Logs podem conter dados sensiveis | Observabilidade |
| Medio | Privacidade da IA | IA |
| Medio | CSRF futuro se usar cookies | Auth futura |
| Medio | Arquivos temporarios podem ficar em disco | Uploads |
| Baixo | `.env.example` com valores dev | Config |
| Baixo | DB/backups locais no workspace | Dados locais |
| Baixo | Frontend dev server sem hardening | Frontend |

## 14. Plano Recomendado

### Fase 1 - Bloqueios antes de expor fora do localhost

1. Implementar autenticacao.
2. Implementar autorizacao/ownership.
3. Adicionar rate limit.
4. Adicionar `helmet`.
5. Endurecer CORS com allowlist.
6. Corrigir tratamento de erros.
7. Limitar uploads e filtrar tipos.

### Fase 2 - Importacoes seguras

1. Substituir ou isolar `xlsx`.
2. Definir limite de tamanho e linhas.
3. Limpar arquivos temporarios com garantia.
4. Validar extensao/MIME no backend.
5. Registrar auditoria sem payload sensivel.

### Fase 3 - Validacao e sanitizacao

1. Criar schemas Zod para todas as rotas.
2. Validar params/query/body.
3. Limitar tamanho de strings.
4. Padronizar enums.
5. Criar sanitizacao para campos livres.

### Fase 4 - Privacidade e IA

1. Criar tela para apagar conversas/memorias.
2. Adicionar politica de retencao.
3. Adicionar aviso antes de provider externo.
4. Mascarar dados sensiveis em contexto.

## 15. Conclusao

O sistema esta seguro o suficiente para uso local controlado, mas nao para exposicao publica. A ausencia de autenticacao/autorizacao e o maior ponto critico. Em seguida, uploads e dependencia `xlsx` representam a maior superficie tecnica de ataque.

Antes de qualquer deploy fora do ambiente local, a prioridade deve ser proteger a API, limitar uploads e padronizar erros/headers/rate limit.
