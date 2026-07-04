# 14 - Component Library

## 1. Proposito do Documento

Este documento define a biblioteca oficial de componentes reutilizaveis do sistema.

Ele serve como referencia para:

- padronizar a criacao de telas;
- evitar duplicacao de componentes;
- orientar a evolucao do frontend;
- separar componentes genericos de componentes de dominio;
- garantir consistencia visual com o Design System;
- facilitar manutencao e refatoracoes futuras.

Este documento nao altera codigo. Ele documenta o estado atual e define a organizacao recomendada para a biblioteca.

## 2. Estado Atual da Biblioteca

O frontend ainda nao possui uma biblioteca de componentes totalmente separada em `shared/ui`.

Hoje existem componentes reutilizaveis em:

```text
frontend/src/components/
frontend/src/components/dashboard/
frontend/src/components/imports/
frontend/src/components/finance/
frontend/src/components/ai/
```

Existem dois tipos principais de componentes:

1. Componentes reutilizaveis gerais.
2. Componentes de dominio, ligados a modulos especificos.

### Componentes reutilizaveis atuais

- `MetricCard`
- `TransactionsTable`
- `FileUpload`
- `BatchUpload`

### Componentes de dominio atuais

- `ExecutiveAnalyticsDashboard`
- `DashboardFilters`
- `SummaryCard`
- `FinancialChart`
- `CategoryChart`
- `AccountWidget`
- `CreditCardWidget`
- `UpcomingBills`
- `TopExpenses`
- `IndicatorCard`
- `ImportCenter`
- `UploadZone`
- `ImportSummary`
- `ImportTable`
- `ParserCard`
- `ReviewDrawer`
- `ValidationBadge`
- `DuplicateBadge`
- `ImportHistory`
- `BatchDetails`
- `FinanceManagementPanel`
- `AccountCard`
- `CardCard`
- `CategoryManager`
- `PaymentMethodManager`
- `TransferDialog`
- `RecurringDialog`
- `InvoiceCard`
- `AttachmentUploader`
- `SearchBar`
- `SavedFilter`
- `FinancialAssistant`
- `ChatLayout`
- `ConversationList`
- `PromptInput`
- `SuggestionCard`
- `FinancialContext`
- `RecommendationCard`
- `SimulationCard`
- `ConversationHistory`
- `AISettings`
- `TypingIndicator`

## 3. Organizacao Oficial da Biblioteca

A biblioteca oficial deve evoluir para a seguinte estrutura:

```text
src/
  shared/
    ui/
      button/
      input/
      select/
      textarea/
      card/
      table/
      badge/
      modal/
      drawer/
      tooltip/
      empty-state/
      loading/
      error-state/
      tabs/
      filters/
      upload/
      charts/
    layout/
      app-shell/
      header/
      sidebar/
      page-header/
      section/
    hooks/
    utils/
    types/
  features/
    dashboard/
      components/
    transactions/
      components/
    imports/
      components/
    accounts/
      components/
    cards/
      components/
    categories/
      components/
    analytics/
      components/
    ai/
      components/
```

### Regras de organizacao

- Componentes genericos devem ficar em `shared/ui`.
- Componentes de layout estrutural devem ficar em `shared/layout`.
- Componentes especificos de negocio devem ficar dentro da respectiva feature.
- Uma feature pode usar componentes de `shared`.
- `shared` nao deve depender de uma feature.
- Componentes devem possuir props tipadas.
- Eventos devem ser explicitos.
- Componentes visuais nao devem chamar API diretamente.
- Componentes de tela podem orquestrar dados e passar props para componentes menores.

## 4. Componentes Base Recomendados

Os componentes abaixo formam a base oficial da biblioteca.

## 5. Button

### Objetivo

Padronizar todos os botoes do sistema.

### Props

```ts
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
};
```

### Eventos

- `onClick`
- `onFocus`
- `onBlur`

### Exemplo de uso

```tsx
<Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
  Novo lancamento
</Button>
```

### Boas praticas

- Usar `primary` apenas para acao principal da tela.
- Usar `secondary` para acoes neutras.
- Usar `danger` para exclusao, remocao ou cancelamento critico.
- Sempre usar icone quando a acao for operacional.
- Nao criar estilos locais de botao fora do componente.

### Dependencias

- React
- Tailwind
- Lucide React

## 6. Input

### Objetivo

Padronizar campos de texto, numeros, datas e valores.

### Props

```ts
type InputProps = {
  label?: string;
  value: string | number;
  placeholder?: string;
  type?: "text" | "number" | "date" | "month" | "email" | "password";
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
};
```

### Eventos

- `onChange`
- `onFocus`
- `onBlur`
- `onKeyDown`

### Exemplo de uso

```tsx
<Input
  label="Descricao"
  value={description}
  placeholder="Ex: Supermercado"
  onChange={(event) => setDescription(event.target.value)}
/>
```

### Boas praticas

- Sempre usar label em formularios.
- Usar texto de erro abaixo do campo.
- Nao usar placeholder como substituto de label.
- Valores monetarios devem ser formatados de forma consistente.

### Dependencias

- React
- Tailwind

## 7. Select

### Objetivo

Padronizar listas de escolha simples.

### Props

```ts
type SelectProps = {
  label?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};
```

### Eventos

- `onChange`
- `onFocus`
- `onBlur`

### Exemplo de uso

```tsx
<Select
  label="Categoria"
  value={category}
  options={categoryOptions}
  onChange={(event) => setCategory(event.target.value)}
/>
```

### Boas praticas

- Usar nomes de exibicao claros.
- Evitar opcoes tecnicas para o usuario final.
- Usar `Todos` em filtros globais quando aplicavel.

### Dependencias

- React
- Tailwind

## 8. Textarea

### Objetivo

Padronizar campos de texto longo, como observacoes e prompts.

### Props

```ts
type TextareaProps = {
  label?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  error?: string;
  disabled?: boolean;
};
```

### Eventos

- `onChange`
- `onKeyDown`
- `onFocus`
- `onBlur`

### Exemplo de uso

```tsx
<Textarea
  label="Observacoes"
  value={notes}
  onChange={(event) => setNotes(event.target.value)}
/>
```

### Boas praticas

- Usar em observacoes, mensagens e descricoes longas.
- Evitar textarea para dados estruturados.
- Em chat, permitir envio com `Enter` e quebra com `Shift + Enter`.

### Dependencias

- React
- Tailwind

## 9. Card

### Objetivo

Padronizar blocos de conteudo, indicadores e secoes.

### Props

```ts
type CardProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "metric" | "section";
};
```

### Eventos

- Normalmente nao possui eventos.
- Pode receber elementos interativos em `action`.

### Exemplo de uso

```tsx
<Card title="Contas" action={<Button variant="secondary">Nova</Button>}>
  <AccountList accounts={accounts} />
</Card>
```

### Boas praticas

- Nao aninhar cards dentro de cards sem necessidade.
- Usar card para agrupamentos claros.
- Manter padding e bordas padronizados.
- Usar header apenas quando houver titulo real.

### Dependencias

- React
- Tailwind

## 10. MetricCard

### Objetivo

Exibir indicadores financeiros resumidos.

### Props atuais

```ts
type MetricCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "green" | "red" | "blue" | "agro" | "neutral";
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<MetricCard
  title="Receitas do mes"
  value={totalRevenue}
  icon={ArrowUpRight}
  tone="green"
/>
```

### Boas praticas

- Usar para valores consolidados.
- Evitar usar para listas ou dados detalhados.
- `tone` deve representar significado financeiro, nao decoracao.
- Valores devem usar formatacao monetaria centralizada.

### Dependencias

- React
- Lucide React
- `brl` de `src/lib/api`
- Tailwind

## 11. SummaryCard

### Objetivo

Exibir cards analiticos com valor, variacao percentual e mini grafico.

### Props atuais

```ts
type SummaryCardProps = {
  item: {
    key: string;
    title: string;
    value: number;
    variation: number;
    sparkline: number[];
    tone: string;
    format?: string;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<SummaryCard item={summaryItem} />
```

### Boas praticas

- Usar no Dashboard Executivo.
- Exibir variacao sempre que houver base comparativa.
- Mini grafico deve ser complementar, nao substituto do valor.

### Dependencias

- React
- Recharts
- Tailwind
- Formatadores financeiros

## 12. IndicatorCard

### Objetivo

Exibir indicadores simples de analytics.

### Props atuais

```ts
type IndicatorCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<IndicatorCard
  title="Ticket medio"
  value={brl.format(averageTicket)}
  icon={WalletCards}
/>
```

### Boas praticas

- Usar para indicadores calculados.
- Nao misturar com formularios.
- Manter titulo curto.

### Dependencias

- React
- Lucide React
- Tailwind

## 13. Table

### Objetivo

Padronizar tabelas de dados tabulares.

### Props recomendadas

```ts
type TableProps<T> = {
  columns: Array<{
    key: keyof T | string;
    label: string;
    align?: "left" | "center" | "right";
    render?: (row: T) => React.ReactNode;
  }>;
  rows: T[];
  emptyMessage?: string;
  loading?: boolean;
};
```

### Eventos

- Eventos devem ficar em renderizadores de coluna.
- Exemplo: `onEdit`, `onDelete`, `onReview`.

### Exemplo de uso

```tsx
<Table
  columns={columns}
  rows={transactions}
  emptyMessage="Nenhum lancamento encontrado."
/>
```

### Boas praticas

- Usar cabecalho fixo em tabelas longas.
- Alinhar valores monetarios a direita.
- Usar badges para status.
- Fornecer empty state quando nao houver linhas.
- Evitar tabela para conteudo editorial.

### Dependencias

- React
- Tailwind

## 14. TransactionsTable

### Objetivo

Exibir o historico unico de lancamentos financeiros.

### Props atuais

```ts
type TransactionsTableProps = {
  rows: TransactionRow[];
  onEdit?: (row: TransactionRow) => void;
  onIgnore?: (row: TransactionRow) => void;
  onReview?: (row: TransactionRow) => void;
};
```

### Eventos

- `onEdit`
- `onIgnore`
- `onReview`

### Exemplo de uso

```tsx
<TransactionsTable
  rows={rows}
  onEdit={openEdit}
  onReview={markAsReviewed}
  onIgnore={ignoreEntry}
/>
```

### Boas praticas

- Usar apenas para lancamentos financeiros.
- Manter colunas principais: data, descricao, categoria, conta/cartao, tipo, valor, origem, status e acoes.
- Nao inserir regras financeiras dentro da tabela.
- A tabela deve receber dados ja preparados para exibicao.

### Dependencias

- React
- Tailwind
- `brl` e `formatDate` de `src/lib/api`

## 15. Badge

### Objetivo

Padronizar etiquetas visuais de status, tipo e prioridade.

### Props recomendadas

```ts
type BadgeProps = {
  tone?: "gray" | "green" | "red" | "blue" | "yellow";
  children: React.ReactNode;
};
```

### Eventos

- Nao deve ter eventos por padrao.

### Exemplo de uso

```tsx
<Badge tone="green">Conciliado</Badge>
```

### Boas praticas

- Usar para estados curtos.
- Nao usar frases longas.
- Cor deve ter significado consistente.
- Nao usar badge como botao.

### Dependencias

- React
- Tailwind

## 16. ValidationBadge

### Objetivo

Exibir status de validacao de arquivos importados.

### Props atuais

```ts
type ValidationBadgeProps = {
  status: string;
  errors: number;
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<ValidationBadge status={file.status} errors={file.errorRows} />
```

### Boas praticas

- Usar apenas no fluxo de importacao.
- Exibir erro com destaque visual.
- Manter texto objetivo.

### Dependencias

- React
- Tailwind
- Lucide React

## 17. DuplicateBadge

### Objetivo

Exibir indicacao de duplicidade em importacoes.

### Props atuais

```ts
type DuplicateBadgeProps = {
  duplicateRows: number;
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<DuplicateBadge duplicateRows={file.duplicateRows} />
```

### Boas praticas

- Usar apenas em auditoria de importacao.
- Duplicidade zero deve ser visualmente neutra ou positiva.
- Duplicidade maior que zero deve chamar atencao sem bloquear todo o fluxo.

### Dependencias

- React
- Tailwind

## 18. Modal

### Objetivo

Padronizar janelas de decisao ou formularios focados.

### Props recomendadas

```ts
type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
};
```

### Eventos

- `onClose`
- eventos internos dos botoes do rodape

### Exemplo de uso

```tsx
<Modal open={open} title="Novo lancamento" onClose={close}>
  <TransactionForm />
</Modal>
```

### Boas praticas

- Usar para formularios curtos.
- Usar drawer para detalhes longos.
- Fechar com `Esc`.
- Manter foco preso dentro do modal.

### Dependencias

- React
- Tailwind
- Futuramente biblioteca acessivel como Radix UI

## 19. Drawer

### Objetivo

Exibir detalhes laterais sem tirar totalmente o contexto da tela.

### Props recomendadas

```ts
type DrawerProps = {
  open: boolean;
  title: string;
  side?: "right" | "left";
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
};
```

### Eventos

- `onClose`
- eventos internos do conteudo

### Exemplo de uso

```tsx
<Drawer open={reviewOpen} title="Revisao da importacao" onClose={close}>
  <ReviewRows rows={rows} />
</Drawer>
```

### Boas praticas

- Usar para revisao, detalhes e auditoria.
- Nao usar drawer para confirmacoes simples.
- Preservar contexto da tabela principal.

### Dependencias

- React
- Tailwind

## 20. ReviewDrawer

### Objetivo

Exibir linhas processadas na importacao para revisao antes de confirmar.

### Props atuais

```ts
type ReviewDrawerProps = {
  rows: Array<Record<string, unknown>>;
  setRows: (rows: Array<Record<string, unknown>>) => void;
  page: number;
  setPage: (page: number) => void;
};
```

### Eventos

- mudanca de pagina;
- atualizacao de linhas revisadas.

### Exemplo de uso

```tsx
<ReviewDrawer
  rows={reviewRows}
  setRows={setReviewRows}
  page={page}
  setPage={setPage}
/>
```

### Boas praticas

- Usar dentro da central de importacoes.
- Mostrar apenas dados relevantes para auditoria.
- Nao salvar dados diretamente no drawer.

### Dependencias

- React
- Tailwind
- Formatadores

## 21. UploadZone

### Objetivo

Permitir selecao ou arraste de arquivos.

### Props atuais

```ts
type UploadZoneProps = {
  files: File[];
  addFiles: (files: FileList | null) => void;
  removeFile: (index: number) => void;
};
```

### Eventos

- `addFiles`
- `removeFile`
- `onDrop`
- `onDragOver`

### Exemplo de uso

```tsx
<UploadZone
  files={files}
  addFiles={addFiles}
  removeFile={removeFile}
/>
```

### Boas praticas

- Indicar formatos aceitos.
- Permitir multiplos arquivos quando o fluxo suportar lote.
- Exibir lista dos arquivos selecionados.
- Validar extensao antes de enviar para API.

### Dependencias

- React
- Lucide React
- Tailwind

## 22. FileUpload

### Objetivo

Importar um arquivo individual de conta ou cartao.

### Props atuais

```ts
type FileUploadProps = {
  type: "account" | "card";
  onDone: () => void;
};
```

### Eventos

- selecao de arquivo;
- pre-visualizacao;
- importacao;
- `onDone` apos importacao.

### Exemplo de uso

```tsx
<FileUpload type="account" onDone={reloadData} />
```

### Boas praticas

- Manter como fluxo legado/individual.
- Preferir `ImportCenter` como fluxo principal.
- Sempre exigir pre-visualizacao quando houver validacao.
- Nao salvar linha inteira como texto unico.

### Dependencias

- React
- Axios via `api`
- Lucide React
- Tailwind

## 23. BatchUpload

### Objetivo

Permitir importacao em lote de arquivos financeiros.

### Props atuais

```ts
type BatchUploadProps = {
  onDone: () => void;
};
```

### Eventos

- selecao multipla de arquivos;
- arraste de arquivos;
- pre-visualizacao do lote;
- remocao de arquivo;
- confirmacao de importacao;
- `onDone` ao finalizar.

### Exemplo de uso

```tsx
<BatchUpload onDone={reloadData} />
```

### Boas praticas

- Usar tabela de auditoria antes de confirmar.
- Permitir remover arquivos especificos.
- Arquivo com erro nao deve bloquear todo o lote.
- Exibir resumo final.

### Dependencias

- React
- Axios via `api`
- Lucide React
- Tailwind

## 24. ImportCenter

### Objetivo

Centralizar o fluxo inteligente de importacoes.

### Props atuais

```ts
type ImportCenterProps = {
  onDone: () => void;
  goToEntries: () => void;
};
```

### Eventos

- selecao de arquivos;
- analise;
- confirmacao;
- navegacao para lancamentos;
- recarregamento de historico.

### Exemplo de uso

```tsx
<ImportCenter onDone={reloadData} goToEntries={openTransactions} />
```

### Boas praticas

- Deve ser o fluxo principal de importacao.
- Separar visualmente upload, auditoria, revisao e historico.
- Nao embutir regras de parser no componente visual.
- Consumir respostas ja normalizadas da API.

### Dependencias

- React
- Axios via `api`
- Lucide React
- Tailwind

## 25. ImportSummary

### Objetivo

Exibir resumo consolidado da importacao inteligente.

### Props atuais

```ts
type ImportSummaryProps = {
  summary: {
    importedFiles: number;
    totalRecords: number;
    validRecords: number;
    duplicates: number;
    errors: number;
    totalAmount: number;
    revenues: number;
    expenses: number;
    transfers: number;
    processingTimeMs: number;
  };
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<ImportSummary summary={preview.smartSummary} />
```

### Boas praticas

- Usar antes da confirmacao.
- Mostrar totais de validos, duplicados e erros.
- Valores financeiros devem usar `brl`.

### Dependencias

- React
- Tailwind
- Formatadores financeiros

## 26. ImportTable

### Objetivo

Exibir auditoria por arquivo antes de confirmar importacao.

### Props atuais

```ts
type ImportTableProps = {
  files: SmartFile[];
  selectedIds: Set<string>;
  setSelectedIds: (value: Set<string>) => void;
};
```

### Eventos

- selecionar arquivo;
- remover arquivo da importacao;
- alterar conjunto de arquivos selecionados.

### Exemplo de uso

```tsx
<ImportTable
  files={preview.files}
  selectedIds={selectedIds}
  setSelectedIds={setSelectedIds}
/>
```

### Boas praticas

- Mostrar instituicao, tipo, parser, validos, duplicados, erros e status.
- Nao ocultar arquivos com erro.
- Permitir importar apenas arquivos validos.

### Dependencias

- React
- Tailwind
- Badges de validacao

## 27. ParserCard

### Objetivo

Exibir detalhes de deteccao de parser por arquivo.

### Props atuais

```ts
type ParserCardProps = {
  file: SmartFile;
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<ParserCard file={file} />
```

### Boas praticas

- Usar em telas de auditoria.
- Mostrar parser, instituicao e colunas mapeadas.
- Evitar expor excesso tecnico para usuario iniciante.

### Dependencias

- React
- Tailwind

## 28. ImportHistory

### Objetivo

Exibir historico de lotes importados.

### Props atuais

```ts
type ImportHistoryProps = {
  history: HistoryItem[];
};
```

### Eventos

- abertura de detalhes do lote, quando aplicavel.

### Exemplo de uso

```tsx
<ImportHistory history={history} />
```

### Boas praticas

- Mostrar data, arquivos, instituicoes, quantidade e status.
- Permitir rastreabilidade.
- Manter acesso aos detalhes do lote.

### Dependencias

- React
- Tailwind

## 29. BatchDetails

### Objetivo

Exibir detalhes de um lote de importacao.

### Props atuais

```ts
type BatchDetailsProps = {
  batch: HistoryItem;
};
```

### Eventos

- Nao possui eventos obrigatorios.

### Exemplo de uso

```tsx
<BatchDetails batch={batch} />
```

### Boas praticas

- Mostrar dados por arquivo.
- Preservar rastreabilidade.
- Separar resumo do detalhe.

### Dependencias

- React
- Tailwind

## 30. DashboardFilters

### Objetivo

Aplicar filtros globais ao Dashboard Executivo.

### Props atuais

```ts
type DashboardFiltersProps = {
  filters: Record<string, string>;
  setFilters: (filters: any) => void;
  options: Record<string, string[]>;
};
```

### Eventos

- alteracao de periodo;
- alteracao de janela;
- alteracao de conta, cartao, categoria, tipo, instituicao ou tag.

### Exemplo de uso

```tsx
<DashboardFilters
  filters={filters}
  setFilters={setFilters}
  options={data.filters}
/>
```

### Boas praticas

- Todos os graficos devem responder aos filtros.
- Filtros devem ficar no topo da tela.
- Evitar chamadas repetidas desnecessarias.

### Dependencias

- React
- Tailwind

## 31. FinancialChart

### Objetivo

Exibir grafico de receitas x despesas.

### Props atuais

```ts
type FinancialChartProps = {
  data: Array<{
    period: string;
    receitas: number;
    despesas: number;
    resultado: number;
  }>;
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<FinancialChart data={flow} />
```

### Boas praticas

- Usar cores consistentes para receitas e despesas.
- Exibir tooltip monetario.
- Manter altura estavel para evitar salto de layout.

### Dependencias

- React
- Recharts
- Tailwind
- Formatadores financeiros

## 32. CategoryChart

### Objetivo

Exibir analise visual de categorias.

### Props atuais

```ts
type CategoryChartProps = {
  categories: {
    ranking: Array<{ name: string; amount: number; previousAmount: number; variation: number }>;
    biggest: { name: string; amount: number } | null;
    growth: { name: string; amount: number; variation: number } | null;
    reduction: { name: string; amount: number; variation: number } | null;
    pie: Array<{ name: string; amount: number }>;
    bars: Array<{ name: string; amount: number; variation: number }>;
  };
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<CategoryChart categories={categories} />
```

### Boas praticas

- Usar pizza para distribuicao.
- Usar barras para comparacao.
- Mostrar crescimento e reducao com clareza.

### Dependencias

- React
- Recharts
- Tailwind

## 33. AccountWidget

### Objetivo

Exibir resumo financeiro de uma conta no Dashboard.

### Props atuais

```ts
type AccountWidgetProps = {
  account: {
    id: number;
    name: string;
    bank?: string;
    type: string;
    color?: string;
    saldo: number;
    movimentacao: number;
    entradas: number;
    saidas: number;
    saldoPrevisto: number;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<AccountWidget account={account} />
```

### Boas praticas

- Usar em analises resumidas.
- Para gestao cadastral, usar `AccountCard`.
- Manter saldos com formato monetario.

### Dependencias

- React
- Tailwind
- Formatadores financeiros

## 34. CreditCardWidget

### Objetivo

Exibir resumo de uso de cartao no Dashboard.

### Props atuais

```ts
type CreditCardWidgetProps = {
  card: {
    id: number;
    name: string;
    bank?: string;
    brand?: string;
    color?: string;
    limit: number;
    used: number;
    available: number;
    currentInvoice: number;
    nextInvoice: number;
    monthPurchases: number;
    dueDay?: number;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<CreditCardWidget card={card} />
```

### Boas praticas

- Usar para visualizacao analitica.
- Mostrar limite, utilizado e disponivel.
- Usar progresso visual para utilizacao.

### Dependencias

- React
- Tailwind
- Formatadores financeiros

## 35. UpcomingBills

### Objetivo

Exibir proximos vencimentos e contas vencidas.

### Props atuais

```ts
type UpcomingBillsProps = {
  upcoming: Array<{ type: string; date: string; title: string; amount: number; status: string }>;
  overdue: Array<{ type: string; date: string; title: string; amount: number; status: string }>;
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<UpcomingBills upcoming={calendar.upcoming} overdue={calendar.overdue} />
```

### Boas praticas

- Separar vencidos de proximos vencimentos.
- Ordenar por data.
- Destacar urgencia sem exagero visual.

### Dependencias

- React
- Tailwind
- Formatadores financeiros e data

## 36. TopExpenses

### Objetivo

Exibir rankings financeiros.

### Props atuais

```ts
type TopExpensesProps = {
  top: {
    expenses: Array<any>;
    revenues: Array<any>;
    establishments: Array<{ name: string; amount: number }>;
    categories: Array<{ name: string; amount: number }>;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<TopExpenses top={data.top} />
```

### Boas praticas

- Limitar rankings para leitura rapida.
- Usar formato monetario.
- Permitir evolucao futura para drill-down.

### Dependencias

- React
- Tailwind

## 37. AccountCard

### Objetivo

Exibir uma conta cadastrada em telas de gestao.

### Props atuais

```ts
type AccountCardProps = {
  account: {
    id: number;
    name: string;
    bank?: string;
    type: string;
    initialBalance: number;
    currentBalance: number;
    color?: string;
    icon?: string;
    status: string;
    defaultAccount: boolean;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<AccountCard account={account} />
```

### Boas praticas

- Usar em Contas e Cartoes.
- Mostrar banco, tipo, saldo inicial e saldo atual.
- Acoes de editar/excluir devem ser adicionadas de forma padronizada.

### Dependencias

- React
- Lucide React
- Tailwind
- Formatadores financeiros

## 38. CardCard

### Objetivo

Exibir um cartao cadastrado em telas de gestao.

### Props atuais

```ts
type CardCardProps = {
  card: {
    id: number;
    name: string;
    bank?: string;
    brand?: string;
    color?: string;
    limitAmount?: number;
    availableLimit?: number;
    usedLimit?: number;
    utilization?: number;
    closingDay?: number;
    dueDay?: number;
    status: string;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<CardCard card={card} />
```

### Boas praticas

- Usar para gestao cadastral.
- Mostrar limite, usado, disponivel, fechamento e vencimento.
- Usar barra de utilizacao.

### Dependencias

- React
- Lucide React
- Tailwind
- Formatadores financeiros

## 39. SearchBar

### Objetivo

Executar busca global e salvar filtros.

### Props atuais

```ts
type SearchBarProps = {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  onSaveFilter: () => void;
};
```

### Eventos

- `setQuery`
- `onSearch`
- `onSaveFilter`

### Exemplo de uso

```tsx
<SearchBar
  query={query}
  setQuery={setQuery}
  onSearch={search}
  onSaveFilter={saveFilter}
/>
```

### Boas praticas

- Usar placeholder claro.
- Permitir busca por texto livre.
- A acao de salvar filtro deve ser secundaria.

### Dependencias

- React
- Lucide React
- Tailwind

## 40. ChatLayout

### Objetivo

Padronizar a estrutura do Assistente Financeiro.

### Props atuais

```ts
type ChatLayoutProps = {
  sidebar: React.ReactNode;
  main: React.ReactNode;
};
```

### Eventos

- Nao possui eventos diretos.

### Exemplo de uso

```tsx
<ChatLayout sidebar={<Sidebar />} main={<Conversation />} />
```

### Boas praticas

- Usar apenas no modulo de IA.
- Manter historico e contexto na lateral.
- Manter conversa no painel principal.

### Dependencias

- React
- Tailwind

## 41. ConversationList

### Objetivo

Exibir conversas do Assistente Financeiro.

### Props atuais

```ts
type ConversationListProps = {
  conversations: Conversation[];
  activeId?: string;
  onOpen: (id: string) => void;
};
```

### Eventos

- `onOpen`

### Exemplo de uso

```tsx
<ConversationList
  conversations={conversations}
  activeId={conversationId}
  onOpen={openConversation}
/>
```

### Boas praticas

- Destacar conversa ativa.
- Exibir data de atualizacao.
- Limitar altura com scroll.

### Dependencias

- React
- Lucide React
- Tailwind

## 42. PromptInput

### Objetivo

Enviar mensagens ao Assistente Financeiro.

### Props atuais

```ts
type PromptInputProps = {
  value: string;
  setValue: (value: string) => void;
  onSend: () => void;
};
```

### Eventos

- `setValue`
- `onSend`
- envio por teclado.

### Exemplo de uso

```tsx
<PromptInput value={input} setValue={setInput} onSend={send} />
```

### Boas praticas

- `Enter` deve enviar.
- `Shift + Enter` deve quebrar linha.
- Botao de envio deve ficar visivel.
- Nao permitir envio de mensagem vazia.

### Dependencias

- React
- Lucide React
- Tailwind

## 43. SuggestionCard

### Objetivo

Exibir sugestoes de perguntas para o Assistente Financeiro.

### Props atuais

```ts
type SuggestionCardProps = {
  text: string;
  onClick: () => void;
};
```

### Eventos

- `onClick`

### Exemplo de uso

```tsx
<SuggestionCard text="Quais despesas posso reduzir?" onClick={askSuggestion} />
```

### Boas praticas

- Usar textos curtos.
- Sugestoes devem parecer perguntas reais do usuario.
- Nao usar como botao generico fora do Assistente.

### Dependencias

- React
- Tailwind

## 44. RecommendationCard

### Objetivo

Exibir recomendacoes geradas pelo Assistente Financeiro.

### Props atuais

```ts
type RecommendationCardProps = {
  item: {
    id: string;
    title: string;
    message: string;
    impact: number;
    priority: string;
  };
};
```

### Eventos

- Nao possui eventos atualmente.

### Exemplo de uso

```tsx
<RecommendationCard item={recommendation} />
```

### Boas praticas

- Mostrar prioridade em badge.
- Mostrar impacto financeiro quando existir.
- Manter recomendacao objetiva.

### Dependencias

- React
- Tailwind
- Formatadores financeiros

## 45. TypingIndicator

### Objetivo

Indicar que o Assistente Financeiro esta processando resposta.

### Props atuais

```ts
type TypingIndicatorProps = {};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
{typing && <TypingIndicator />}
```

### Boas praticas

- Usar apenas durante processamento.
- Evitar loading infinito sem fallback.
- Exibir em local proximo da conversa.

### Dependencias

- React
- Tailwind

## 46. EmptyState

### Objetivo

Padronizar telas e areas sem dados.

### Props recomendadas

```ts
type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};
```

### Eventos

- Eventos devem estar no `action`.

### Exemplo de uso

```tsx
<EmptyState
  title="Nenhum lancamento encontrado"
  description="Altere os filtros ou importe um extrato."
  action={<Button>Importar extrato</Button>}
/>
```

### Boas praticas

- Explicar o estado sem excesso de texto.
- Oferecer proxima acao quando fizer sentido.
- Nao usar empty state para erro tecnico.

### Dependencias

- React
- Tailwind
- Lucide React

## 47. Loading

### Objetivo

Padronizar carregamentos.

### Props recomendadas

```ts
type LoadingProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};
```

### Eventos

- Nao possui eventos.

### Exemplo de uso

```tsx
<Loading label="Carregando lancamentos..." />
```

### Boas praticas

- Usar skeleton em listas e cards.
- Usar texto quando o carregamento puder demorar.
- Evitar bloquear a tela inteira sem necessidade.

### Dependencias

- React
- Tailwind

## 48. ErrorState

### Objetivo

Padronizar exibicao de erros recuperaveis.

### Props recomendadas

```ts
type ErrorStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};
```

### Eventos

- Eventos devem estar no `action`.

### Exemplo de uso

```tsx
<ErrorState
  title="Nao foi possivel carregar os dados"
  action={<Button onClick={reload}>Tentar novamente</Button>}
/>
```

### Boas praticas

- Explicar o problema em linguagem simples.
- Oferecer acao de recuperacao.
- Registrar erro tecnico no console/log, nao na tela final.

### Dependencias

- React
- Tailwind

## 49. Componentes de Tela

Componentes abaixo sao considerados telas ou containers de feature, nao componentes base.

### ExecutiveAnalyticsDashboard

Responsavel por orquestrar o Dashboard Executivo.

Depende de:

- API `/analytics-dashboard`;
- filtros globais;
- componentes de grafico;
- cards analiticos.

Boas praticas:

- manter agregacoes no backend ou camada de analytics;
- nao duplicar calculos financeiros no componente;
- decompor subcomponentes reutilizaveis.

### ImportCenter

Responsavel por orquestrar a Central Inteligente de Importacoes.

Depende de:

- API `/imports/smart/preview`;
- API `/imports/smart/confirm`;
- API `/imports/smart/history`;
- componentes de upload, auditoria e revisao.

Boas praticas:

- manter parser, normalizacao e duplicidade fora do frontend;
- exibir auditoria clara antes de confirmar.

### FinanceManagementPanel

Responsavel por agrupar contas, cartoes, categorias, formas de pagamento, recorrencias, transferencias e filtros salvos.

Depende de:

- API `/accounts`;
- API `/cards`;
- API `/payment-methods`;
- API `/saved-filters`;
- API `/recurring-entries`;
- API `/search`.

Boas praticas:

- separar cada bloco em componente de feature;
- evitar que o painel centralize responsabilidades demais.

### FinancialAssistant

Responsavel por orquestrar o Assistente Financeiro.

Depende de:

- API `/ai/history`;
- API `/ai/recommendations`;
- API `/ai/context`;
- API `/ai/settings`;
- API `/ai/chat`.

Boas praticas:

- manter prompt builder e contexto no backend;
- frontend deve apenas exibir conversa, contexto e recomendacoes.

## 50. Padrao de Props

Props devem seguir estas regras:

- nomes em ingles tecnico quando forem propriedades de codigo;
- labels exibidas ao usuario em portugues;
- callbacks iniciando com `on`;
- estados booleanos iniciando com `is`, `has` ou `can`;
- arrays no plural;
- dados de dominio com tipos explicitos.

Exemplos:

```ts
onCreate
onEdit
onDelete
isLoading
hasError
canImport
transactions
categories
accounts
```

## 51. Padrao de Eventos

Eventos devem ser previsiveis:

- `onClick` para acao local simples;
- `onChange` para alteracao de campo;
- `onSubmit` para envio de formulario;
- `onClose` para fechar modal/drawer;
- `onConfirm` para confirmar acao;
- `onCancel` para cancelar acao;
- `onDone` para indicar conclusao de fluxo;
- `onOpen` para abrir detalhe;
- `onRemove` para remocao.

Callbacks devem receber o menor dado necessario para executar a acao.

## 52. Dependencias Oficiais

### React

Base da construcao de componentes.

### TypeScript

Tipagem de props, eventos e dados de dominio.

### Tailwind

Estilizacao utilitaria e padronizacao visual.

### Lucide React

Biblioteca oficial de icones.

### Recharts

Graficos financeiros e analytics.

### Axios

Comunicacao com API por meio do cliente `api`.

## 53. Boas Praticas Gerais

1. Criar componentes pequenos e focados.
2. Evitar chamada de API em componentes puramente visuais.
3. Preferir composicao a props excessivas.
4. Evitar duplicacao de classes Tailwind complexas.
5. Usar componentes compartilhados antes de criar novos.
6. Manter nomes consistentes com o Glossario Oficial.
7. Manter acessibilidade minima em botoes, inputs, modais e tabelas.
8. Garantir responsividade.
9. Usar `children` para composicao de conteudo.
10. Usar `action` para botoes no header de cards ou paineis.
11. Usar badges para status.
12. Usar empty state em listas vazias.
13. Usar loading state em chamadas assincronas.
14. Usar error state em falhas recuperaveis.

## 54. Regras de Nao Utilizacao

Nao deve ser feito:

- criar botoes com estilos isolados sem necessidade;
- repetir cards semelhantes em varias telas;
- inserir regras financeiras em componentes visuais;
- chamar API dentro de componentes base;
- misturar componente de tela com componente generico;
- usar icones SVG manuais quando houver equivalente no Lucide;
- criar tabelas com estilos diferentes para cada modulo;
- usar modal para conteudo longo que deveria ser drawer;
- usar badge como botao;
- usar cores fora dos tokens do Design System.

## 55. Plano de Evolucao da Biblioteca

### Etapa 1

Criar componentes base:

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Card`
- `Badge`
- `Table`
- `Modal`
- `Drawer`
- `EmptyState`
- `Loading`
- `ErrorState`

### Etapa 2

Migrar componentes atuais para a nova organizacao:

- `MetricCard` para `shared/ui/card` ou `shared/ui/metric-card`;
- `TransactionsTable` para `features/transactions/components`;
- `UploadZone` para `shared/ui/upload`;
- `ImportTable` para `features/imports/components`;
- `DashboardFilters` para `features/dashboard/components`;
- `PromptInput` para `features/ai/components`.

### Etapa 3

Padronizar todos os containers de tela:

- Dashboard;
- Lancamentos;
- Importacoes;
- Contas e Cartoes;
- Categorias;
- Relatorios;
- Assistente Financeiro;
- Configuracoes.

### Etapa 4

Criar documentacao visual ou Storybook futuramente.

## 56. Resumo

A Component Library oficial organiza a construcao visual do sistema em componentes reutilizaveis, previsiveis e desacoplados.

O estado atual ja possui bons blocos reutilizaveis, mas eles ainda estao misturados com componentes de tela e componentes de dominio.

A evolucao recomendada e criar uma camada `shared/ui` para componentes base e manter componentes especificos dentro de `features`.

Essa biblioteca deve ser usada como referencia obrigatoria para novas telas, refatoracoes de UX/UI e futuras fases do sistema.
