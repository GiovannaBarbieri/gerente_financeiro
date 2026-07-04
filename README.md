# Gerente Financeiro

MVP web para gerenciamento financeiro pessoal com conta corrente, cartao de credito, fazenda/agro, classificacao automatica, dashboard, relatorio Uber e conciliacao simples de fatura.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, Prisma
- Banco inicial: SQLite
- Importacao: CSV, XLS e XLSX

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente do backend:

```bash
copy backend\.env.example backend\.env
```

3. Crie o banco e rode o seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. Inicie frontend e backend:

```bash
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3333/api/health

## CSVs esperados

O importador aceita cabecalhos comuns em portugues ou ingles.

Conta corrente:

- `data`
- `descricao`
- `valor`

Cartao:

- `data`
- `descricao`
- `valor`
- opcional: `fatura` ou competencia no campo de upload

Valores negativos na conta sao tratados como saidas. Compras de cartao sao normalizadas como gastos positivos internamente e aparecem como saidas no consolidado.

## Regras do MVP

- O pagamento de fatura no extrato fica registrado como saida bancaria.
- O dashboard de consumo real ignora o pagamento da fatura e usa as compras detalhadas do cartao.
- O fluxo de caixa considera tudo que saiu da conta.
- A conciliacao compara o pagamento de fatura com as compras da fatura/mes informado e marca como conciliada quando a diferenca for ate R$ 1,00.
- Regras iniciais classificam Uber, Uber One, agro/fazenda, combustivel, veiculos, contas pessoais, saude, impostos, seguros, investimentos e pagamento de fatura.

## Modulos entregues

- Dashboard executivo com indicadores e graficos
- Importacao separada de conta corrente e cartao
- Classificacao automatica por palavra-chave
- Listagem consolidada com filtros por mes, fonte e busca
- Relatorio especifico de Uber/Mobilidade
- Visao inicial de fazenda x pessoal via API
- Conciliacao simples de faturas
- Banco modelado para evolucao futura e migracao para PostgreSQL

## Proximos passos naturais

- Tela completa de edicao manual de categoria/origem com criacao de regra pela interface
- Exportacao CSV/XLSX a partir da listagem
- Preview validavel antes de salvar importacao
- Identificacao mais robusta de layout Nubank por tipo de arquivo
- Autenticacao e multiusuario
- Motor de sugestoes com IA usando historico corrigido
