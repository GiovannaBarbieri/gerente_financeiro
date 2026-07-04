# 17 - Relatorio de Padronizacao de Componentes React

## 1. Objetivo

Esta etapa padronizou componentes React reutilizaveis sem alterar regras de negocio e sem adicionar funcionalidades.

O foco foi:

- reduzir duplicacao visual;
- criar uma base reutilizavel de componentes;
- padronizar props;
- padronizar estilos;
- padronizar nomenclatura;
- preparar o projeto para evoluir como biblioteca interna.

## 2. Componentes Existentes Antes

### Componentes compartilhados

- `MetricCard`

### Componentes duplicados ou semelhantes

- `Panel` em `App.tsx`
- `Panel` em `ExecutiveAnalyticsDashboard.tsx`
- `Panel` em `FinanceManagementPanel.tsx`
- `Panel` em `FinancialAssistant.tsx`
- `MiniStat` em `App.tsx`
- `Mini` em `ExecutiveAnalyticsDashboard.tsx`
- `Mini` em `FinanceManagementPanel.tsx`
- `Mini` em `FinancialAssistant.tsx`
- `FilterField` em `App.tsx`
- `Filter` em `ExecutiveAnalyticsDashboard.tsx`
- `SelectFilter` em `ExecutiveAnalyticsDashboard.tsx`
- badges via classes globais `badge-gray`, `badge-blue`, `badge-green`, `badge-red`
- tabelas com `app-table`
- textos avulsos de empty state
- botoes via `btn-secondary`

### Componentes de dominio mantidos

- `SummaryCard`
- `IndicatorCard`
- `TransactionsTable`
- `ImportCenter`
- `ImportTable`
- `ReviewDrawer`
- `FinancialAssistant`
- `PromptInput`
- `RecommendationCard`
- `AccountCard`
- `CardCard`

## 3. Componentes Novos

Arquivo criado:

```text
frontend/src/shared/components/ui.tsx
```

Componentes criados:

- `Button`
- `Badge`
- `Card`
- `Stat`
- `Field`
- `SelectField`
- `TableShell`
- `EmptyState`
- `LoadingState`
- `Modal`
- `Drawer`

## 4. Componentes Unificados

### Cards

Unificado em:

```text
Card
```

Substituiu:

- `Panel` do `App.tsx`
- `Panel` do Dashboard
- `Panel` de Gestao Financeira
- `Panel` do Assistente Financeiro

### Mini indicadores

Unificado em:

```text
Stat
```

Substituiu:

- `MiniStat`
- `Mini`
- cards simples de resumo da importacao

### Filtros

Unificado em:

```text
Field
SelectField
```

Substituiu:

- `FilterField`
- `Filter`
- `SelectFilter`

### Badges

Unificado em:

```text
Badge
```

Aplicado em:

- alertas;
- status de conta;
- status de cartao;
- formas de pagamento;
- filtros salvos;
- status de validacao de importacao;
- duplicidade de importacao.

### Tabelas

Base criada:

```text
TableShell
```

Aplicada em:

- ultimos lancamentos compactos;
- tabela de auditoria de importacao;
- historico de importacoes.

### Estados

Base criada:

```text
EmptyState
LoadingState
```

Aplicado em:

- alertas vazios;
- listas vazias de contas;
- listas vazias de cartoes;
- formas de pagamento vazias;
- filtros salvos vazios.

### Modal e Drawer

Base criada:

```text
Modal
Drawer
```

Ainda nao migrados para telas existentes nesta etapa para evitar mudanca visual ou comportamental em fluxos sensiveis.

## 5. Componentes Removidos

Foram removidas implementacoes locais duplicadas:

- `Panel` em `App.tsx`
- `FilterField` em `App.tsx`
- `MiniStat` em `App.tsx`
- `Panel` em `ExecutiveAnalyticsDashboard.tsx`
- `Mini` em `ExecutiveAnalyticsDashboard.tsx`
- `Filter` em `ExecutiveAnalyticsDashboard.tsx`
- `SelectFilter` em `ExecutiveAnalyticsDashboard.tsx`
- `Panel` em `FinanceManagementPanel.tsx`
- `Mini` em `FinanceManagementPanel.tsx`
- `Panel` em `FinancialAssistant.tsx`
- `Mini` em `FinancialAssistant.tsx`
- `SummaryCard` local da importacao, que fazia o mesmo papel de `Stat`

## 6. Props Padronizadas

### Button

```ts
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
};
```

### Badge

```ts
type BadgeProps = {
  tone?: "gray" | "blue" | "green" | "red";
  children: React.ReactNode;
};
```

### Card

```ts
type CardProps = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};
```

### Stat

```ts
type StatProps = {
  label: string;
  value: string;
  size?: "sm" | "md";
};
```

### Field

```ts
type FieldProps = {
  label: string;
  children: React.ReactNode;
};
```

### SelectField

```ts
type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel?: string;
};
```

### TableShell

```ts
type TableShellProps = {
  children: React.ReactNode;
  minWidth?: number;
};
```

## 7. Dependencias

Componentes compartilhados dependem de:

- React;
- Tailwind;
- Lucide React para `LoadingState`;
- classes globais existentes do Design System:
  - `badge-gray`;
  - `badge-blue`;
  - `badge-green`;
  - `badge-red`;
  - `field`;
  - `app-table`.

## 8. Arquivos Alterados

```text
frontend/src/shared/components/ui.tsx
frontend/src/app/App.tsx
frontend/src/features/dashboard/components/ExecutiveAnalyticsDashboard.tsx
frontend/src/features/settings/components/FinanceManagementPanel.tsx
frontend/src/features/imports/components/ImportCenter.tsx
frontend/src/features/assistant/components/FinancialAssistant.tsx
```

## 9. Componentes Ainda Candidatos a Evolucao

Ainda devem ser avaliados em uma proxima fase:

- `SummaryCard`: componente de dominio do Dashboard com sparkline.
- `IndicatorCard`: pode virar variacao de `MetricCard`.
- `TransactionsTable`: pode ser refeito sobre um `DataTable`.
- `ImportTable`: pode ser refeito sobre um `DataTable`.
- `ReviewDrawer`: pode usar o `Drawer` compartilhado.
- formulario de lancamento: pode usar `Modal`, `Field`, `SelectField` e inputs padronizados.
- `PromptInput`: pode usar `Button` e um futuro `Textarea`.

## 10. Validacao

Build completo executado com sucesso:

```text
npm.cmd run build
```

Resultado:

```text
backend: tsc concluido
frontend: tsc && node build.mjs concluido
```

## 11. Resumo

A base de componentes compartilhados foi criada e os componentes duplicados mais evidentes foram removidos.

O projeto agora possui uma biblioteca inicial reutilizavel em:

```text
frontend/src/shared/components/ui.tsx
```

Essa base deve ser usada em novas telas e refatoracoes futuras antes de criar componentes locais.
