import { useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  FileDown,
  Home,
  Plus,
  Search,
  Settings,
  Tags,
  UploadCloud,
  WalletCards
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FinancialAssistant } from "@features/assistant/components/FinancialAssistant";
import { ExecutiveAnalyticsDashboard } from "@features/dashboard/components/ExecutiveAnalyticsDashboard";
import { ImportCenter } from "@features/imports/components/ImportCenter";
import { FinanceManagementPanel } from "@features/settings/components/FinanceManagementPanel";
import { TransactionRow, TransactionsTable } from "@features/transactions/components/TransactionsTable";
import { MetricCard } from "@shared/components/MetricCard";
import { Badge, Card, EmptyState, Field, Stat, TableShell } from "@shared/components/ui";
import { api, brl, currentMonth, formatDate } from "@shared/services/api";

type UberReport = {
  total: number;
  quantity: number;
  averageTicket: number;
  maxRide: { description: string; amount: number; date: string } | null;
  minRide: { description: string; amount: number; date: string } | null;
  byMonth: Array<{ name: string; amount: number }>;
  rides: Array<{ id: string; date: string; description: string; amount: number }>;
  membership: Array<{ id: string; date: string; description: string; amount: number }>;
};

type Category = {
  id: number;
  name: string;
  type: string;
  subcategories: Array<{ id: number; name: string }>;
};

type LegacyDashboard = {
  cards: Record<string, number>;
  monthly: Array<{ month: string; entradas: number; saidas: number }>;
  expensesByCategory: Array<{ name: string; amount: number }>;
  cardByCategory: Array<{ name: string; amount: number }>;
};

type ExecutiveDashboard = {
  metrics: Record<string, number>;
  evolution: Array<{ month: string; receitas: number; despesas: number; saldo: number; fluxo: number }>;
  distribution: {
    categories: Array<{ name: string; amount: number }>;
    origin: Array<{ name: string; amount: number }>;
    cardAccount: Array<{ name: string; amount: number }>;
  };
  indicators: Record<string, number>;
  latestTransactions: Array<{ id: string; date: string; description: string; category: string; amount: number; origin: string }>;
  alerts: Array<{ priority: "Alta" | "Media" | "Baixa"; title: string; message: string }>;
};

type Tab = "dashboard" | "entries" | "imports" | "wallets" | "categories" | "reports" | "assistant" | "settings";

type EntryForm = {
  id?: string;
  type: string;
  date: string;
  competence: string;
  description: string;
  amount: string;
  accountName: string;
  cardName: string;
  category: string;
  subcategory: string;
  paymentMethod: string;
  status: string;
  origin: string;
  institution: string;
  notes: string;
};

const COLORS = ["#3454D1", "#16A34A", "#DC2626", "#0891B2", "#7C3AED", "#D97706", "#0F766E", "#BE123C"];

const menu: Array<[Tab, string, typeof Home]> = [
  ["dashboard", "Dashboard", Home],
  ["entries", "Lançamentos", Banknote],
  ["imports", "Importações", UploadCloud],
  ["wallets", "Contas e Cartões", Building2],
  ["categories", "Categorias", Tags],
  ["reports", "Relatórios", BarChart3],
  ["assistant", "Assistente", Bot],
  ["settings", "Configurações", Settings]
];

export function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [month, setMonth] = useState(currentMonth());
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [executive, setExecutive] = useState<ExecutiveDashboard | null>(null);
  const [legacy, setLegacy] = useState<LegacyDashboard | null>(null);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uber, setUber] = useState<UberReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryForm | null>(null);
  const [entryStatus, setEntryStatus] = useState("");

  async function load() {
    setLoading(true);
    const params = { month: month || undefined };
    const [execDash, dash, tx, categoryResponse, uberResponse] = await Promise.all([
      api.get("/executive-dashboard"),
      api.get("/dashboard", { params }),
      api.get("/financial-entries", { params: { ...params, source: source || undefined, q: query || undefined } }),
      api.get("/categories"),
      api.get("/reports/uber", { params })
    ]);
    setExecutive(execDash.data);
    setLegacy(dash.data);
    setRows(tx.data);
    setCategories(categoryResponse.data);
    setUber(uberResponse.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [month, source]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      return (
        (!categoryFilter || row.category === categoryFilter) &&
        (!accountFilter || row.accountName === accountFilter) &&
        (!typeFilter || row.financialNature === typeFilter || row.type === typeFilter) &&
        (!statusFilter || row.status === statusFilter) &&
        (!originFilter || row.origin === originFilter)
      );
    });
  }, [rows, categoryFilter, accountFilter, typeFilter, statusFilter, originFilter]);

  const accounts = useMemo(() => unique(rows.filter((row) => row.source === "Conta").map((row) => row.accountName || row.institution || "Conta")), [rows]);
  const cards = useMemo(() => unique(rows.filter((row) => row.source === "Cartao").map((row) => row.accountName || row.institution || "Cartão")), [rows]);
  const origins = useMemo(() => unique(rows.map((row) => row.origin).filter(Boolean)), [rows]);
  const types = useMemo(() => unique(rows.map((row) => row.financialNature || row.type).filter(Boolean)), [rows]);

  const metrics = executive?.metrics ?? {};
  const legacyMetrics = legacy?.cards ?? {};

  async function saveEntry(form: EntryForm) {
    setEntryStatus("Salvando lançamento...");
    const payload = {
      type: form.type,
      date: form.date,
      competence: form.competence,
      description: form.description,
      amount: form.amount,
      accountName: form.accountName,
      cardName: form.cardName,
      category: form.category,
      subcategory: form.subcategory,
      paymentMethod: form.paymentMethod,
      status: form.status,
      origin: form.origin,
      institution: form.institution,
      notes: form.notes
    };
    if (form.id) await api.patch(`/financial-entries/${form.id}`, payload);
    else await api.post("/financial-entries", payload);
    setEntryForm(null);
    setEntryStatus("Lançamento salvo.");
    await load();
  }

  function editEntry(row: TransactionRow) {
    setEntryStatus("");
    setEntryForm(rowToEntryForm(row));
  }

  async function ignoreEntry(row: TransactionRow) {
    setEntryStatus("Ignorando lançamento...");
    await api.delete(`/financial-entries/${row.id}`);
    setEntryStatus("Lançamento ignorado.");
    await load();
  }

  async function reviewEntry(row: TransactionRow) {
    setEntryStatus("Marcando como revisado...");
    await api.patch(`/financial-entries/${row.id}`, { status: "reviewed" });
    setEntryStatus("Lançamento revisado.");
    await load();
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5">
          <div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">Gerente Financeiro</h1>
              <p className="mt-1 text-sm text-muted">Controle financeiro simples, importações e análises mensais.</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {menu.map(([id, label, Icon]) => (
              <button
                key={id}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-slate-50"}`}
                onClick={() => setTab(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
        {tab === "dashboard" && (
          <ExecutiveAnalyticsDashboard />
        )}

        {tab === "entries" && (
          <EntriesPage
            rows={filteredRows}
            categories={categories}
            accounts={accounts}
            cards={cards}
            origins={origins}
            types={types}
            month={month}
            setMonth={setMonth}
            source={source}
            setSource={setSource}
            query={query}
            setQuery={setQuery}
            load={load}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            accountFilter={accountFilter}
            setAccountFilter={setAccountFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            originFilter={originFilter}
            setOriginFilter={setOriginFilter}
            entryForm={entryForm}
            setEntryForm={setEntryForm}
            entryStatus={entryStatus}
            saveEntry={saveEntry}
            editEntry={editEntry}
            ignoreEntry={ignoreEntry}
            reviewEntry={reviewEntry}
          />
        )}

        {tab === "imports" && (
          <ImportCenter onDone={load} goToEntries={() => setTab("entries")} />
        )}

        {tab === "wallets" && (
          <FinanceManagementPanel categories={categories} />
        )}

        {tab === "categories" && (
          <CategoriesPage categories={categories} expensesByCategory={legacy?.expensesByCategory ?? []} />
        )}

        {tab === "reports" && (
          <ReportsPage legacy={legacy} executive={executive} uber={uber} />
        )}

        {tab === "assistant" && (
          <FinancialAssistant />
        )}

        {tab === "settings" && (
          <SettingsPage />
        )}

        {loading && <p className="text-sm text-muted">Carregando dados...</p>}
      </div>
    </main>
  );
}

function emptyEntryForm(month: string): EntryForm {
  const today = new Date().toISOString().slice(0, 10);
  const [year, monthNumber] = month.split("-");
  return {
    type: "Despesa",
    date: today,
    competence: monthNumber && year ? `${monthNumber}/${year}` : "",
    description: "",
    amount: "",
    accountName: "",
    cardName: "",
    category: "",
    subcategory: "",
    paymentMethod: "",
    status: "pending",
    origin: "Manual",
    institution: "Manual",
    notes: ""
  };
}

function rowToEntryForm(row: TransactionRow): EntryForm {
  return {
    id: row.id,
    type: row.financialNature || row.type || "Despesa",
    date: String(row.date).slice(0, 10),
    competence: row.month || "",
    description: row.description || "",
    amount: String(Math.abs(row.amount || 0)).replace(".", ","),
    accountName: row.source === "Conta" ? row.accountName || "" : "",
    cardName: row.source === "Cartao" ? row.cardName || row.accountName || "" : "",
    category: row.category || "",
    subcategory: row.subcategory || "",
    paymentMethod: row.paymentMethod || "",
    status: row.status || "pending",
    origin: row.origin || "",
    institution: row.institution || "",
    notes: row.notes || ""
  };
}

function DashboardPage({ executive, legacy, setTab }: { executive: ExecutiveDashboard; legacy: LegacyDashboard | null; setTab: (tab: Tab) => void }) {
  const metrics = executive.metrics;
  const legacyMetrics = legacy?.cards ?? {};

  return (
    <div className="grid gap-5">
      <SectionHeader title="Dashboard" subtitle="Visão mensal consolidada" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Saldo Atual" value={metrics.saldoAtual} icon={Banknote} />
        <MetricCard title="Receitas do mês" value={legacyMetrics.entradasMes} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas do mês" value={legacyMetrics.totalGastosReais} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Cartão a pagar" value={metrics.cartaoEmAberto} icon={CreditCard} tone="blue" />
        <MetricCard title="Fluxo de Caixa" value={legacyMetrics.saldoMes} icon={WalletCards} />
      </section>

      <Card title="Receitas x Despesas">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={legacy?.monthly ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
            <Tooltip formatter={(value) => brl.format(Number(value))} />
            <Legend />
            <Bar dataKey="entradas" fill="#16A34A" radius={[6, 6, 0, 0]} />
            <Bar dataKey="saidas" fill="#DC2626" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card title="Últimos lançamentos" action={<button className="btn-secondary" onClick={() => setTab("entries")}>Ver todos</button>}>
          <CompactTransactions rows={executive.latestTransactions} />
        </Card>
        <Card title="Categorias que mais consumiram">
          <SimplePie data={executive.distribution.categories} />
        </Card>
      </section>

      <Card title="Alertas importantes">
        <Alerts alerts={executive.alerts} />
      </Card>
    </div>
  );
}

function EntriesPage(props: {
  rows: TransactionRow[];
  categories: Category[];
  accounts: string[];
  cards: string[];
  origins: string[];
  types: string[];
  month: string;
  setMonth: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  query: string;
  setQuery: (value: string) => void;
  load: () => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  accountFilter: string;
  setAccountFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  originFilter: string;
  setOriginFilter: (value: string) => void;
  entryForm: EntryForm | null;
  setEntryForm: (value: EntryForm | null) => void;
  entryStatus: string;
  saveEntry: (form: EntryForm) => Promise<void>;
  editEntry: (row: TransactionRow) => void;
  ignoreEntry: (row: TransactionRow) => Promise<void>;
  reviewEntry: (row: TransactionRow) => Promise<void>;
}) {
  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Lançamentos</h2>
          <p className="mt-1 text-sm text-muted">Histórico financeiro único</p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white" onClick={() => props.setEntryForm(emptyEntryForm(props.month))}>
          <Plus size={16} />
          Novo lançamento
        </button>
      </section>
      {props.entryStatus && <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{props.entryStatus}</p>}
      {props.entryForm && (
        <EntryFormPanel
          form={props.entryForm}
          setForm={props.setEntryForm}
          categories={props.categories}
          accounts={props.accounts}
          cards={props.cards}
          onCancel={() => props.setEntryForm(null)}
          onSave={() => props.saveEntry(props.entryForm!)}
        />
      )}
      <Card title="Filtros">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Período">
            <input className="field" type="month" value={props.month} onChange={(event) => props.setMonth(event.target.value)} />
          </Field>
          <Field label="Categoria">
            <select className="field" value={props.categoryFilter} onChange={(event) => props.setCategoryFilter(event.target.value)}>
              <option value="">Todas</option>
              {props.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Conta">
            <select className="field" value={props.source === "Conta" ? props.accountFilter : ""} onChange={(event) => { props.setSource(event.target.value ? "Conta" : ""); props.setAccountFilter(event.target.value); }}>
              <option value="">Todas</option>
              {props.accounts.map((account) => <option key={account} value={account}>{account}</option>)}
            </select>
          </Field>
          <Field label="Cartão">
            <select className="field" value={props.source === "Cartao" ? props.accountFilter : ""} onChange={(event) => { props.setSource(event.target.value ? "Cartao" : ""); props.setAccountFilter(event.target.value); }}>
              <option value="">Todos</option>
              {props.cards.map((card) => <option key={card} value={card}>{card}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="field" value={props.typeFilter} onChange={(event) => props.setTypeFilter(event.target.value)}>
              <option value="">Todos</option>
              {props.types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={props.statusFilter} onChange={(event) => props.setStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="cleared">Compensado</option>
              <option value="reviewed">Revisado</option>
              <option value="ignored">Ignorado</option>
            </select>
          </Field>
          <Field label="Origem">
            <select className="field" value={props.originFilter} onChange={(event) => props.setOriginFilter(event.target.value)}>
              <option value="">Todas</option>
              {props.origins.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
            </select>
          </Field>
          <Field label="Pesquisa">
            <div className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3">
              <Search size={16} className="text-muted" />
              <input className="min-w-0 flex-1 outline-none" value={props.query} onChange={(event) => props.setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && props.load()} />
            </div>
          </Field>
        </div>
      </Card>
      <TransactionsTable rows={props.rows} onEdit={props.editEntry} onIgnore={props.ignoreEntry} onReview={props.reviewEntry} />
    </div>
  );
}

function EntryFormPanel({ form, setForm, categories, accounts, cards, onCancel, onSave }: {
  form: EntryForm;
  setForm: (value: EntryForm) => void;
  categories: Category[];
  accounts: string[];
  cards: string[];
  onCancel: () => void;
  onSave: () => void;
}) {
  function update(field: keyof EntryForm, value: string) {
    setForm({ ...form, [field]: value });
  }

  const selectedCategory = categories.find((category) => category.name === form.category);

  return (
    <Card title={form.id ? "Editar lançamento" : "Novo lançamento"}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tipo">
          <select className="field" value={form.type} onChange={(event) => update("type", event.target.value)}>
            <option>Receita</option>
            <option>Despesa</option>
            <option>Transferência</option>
            <option>Ajuste</option>
          </select>
        </Field>
        <Field label="Data">
          <input className="field" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
        </Field>
        <Field label="Competência">
          <input className="field" placeholder="MM/AAAA" value={form.competence} onChange={(event) => update("competence", event.target.value)} />
        </Field>
        <Field label="Valor">
          <input className="field" placeholder="0,00" value={form.amount} onChange={(event) => update("amount", event.target.value)} />
        </Field>
        <Field label="Descrição">
          <input className="field" value={form.description} onChange={(event) => update("description", event.target.value)} />
        </Field>
        <Field label="Conta">
          <input className="field" list="entry-accounts" value={form.accountName} onChange={(event) => update("accountName", event.target.value)} />
        </Field>
        <Field label="Cartão">
          <input className="field" list="entry-cards" value={form.cardName} onChange={(event) => update("cardName", event.target.value)} />
        </Field>
        <Field label="Forma de pagamento">
          <input className="field" value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value)} />
        </Field>
        <Field label="Categoria">
          <select className="field" value={form.category} onChange={(event) => update("category", event.target.value)}>
            <option value="">Classificar automaticamente</option>
            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Subcategoria">
          <select className="field" value={form.subcategory} onChange={(event) => update("subcategory", event.target.value)}>
            <option value="">Geral</option>
            {selectedCategory?.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.name}>{subcategory.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="field" value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="cleared">Compensado</option>
            <option value="reviewed">Revisado</option>
            <option value="ignored">Ignorado</option>
          </select>
        </Field>
        <Field label="Origem">
          <input className="field" value={form.origin} onChange={(event) => update("origin", event.target.value)} />
        </Field>
        <Field label="Instituição">
          <input className="field" value={form.institution} onChange={(event) => update("institution", event.target.value)} />
        </Field>
        <label className="grid gap-1 text-xs font-semibold text-muted md:col-span-2 xl:col-span-3">
          Observações
          <input className="field" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
      </div>
      <datalist id="entry-accounts">
        {accounts.map((account) => <option key={account} value={account} />)}
      </datalist>
      <datalist id="entry-cards">
        {cards.map((card) => <option key={card} value={card} />)}
      </datalist>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white" onClick={onSave}>Salvar</button>
      </div>
    </Card>
  );
}

function WalletsPage({ accounts, cards, indicators }: { accounts: string[]; cards: string[]; indicators: Record<string, number> }) {
  return (
    <div className="grid gap-5">
      <SectionHeader title="Contas e Cartões" subtitle="Agrupamento financeiro" />
      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Contas">
          <EntityList items={accounts} empty="Nenhuma conta encontrada" fallbackCount={indicators.accounts} icon={Building2} />
        </Card>
        <Card title="Cartões">
          <EntityList items={cards} empty="Nenhum cartão encontrado" fallbackCount={indicators.cards} icon={CreditCard} />
        </Card>
      </section>
    </div>
  );
}

function CategoriesPage({ categories, expensesByCategory }: { categories: Category[]; expensesByCategory: Array<{ name: string; amount: number }> }) {
  return (
    <div className="grid gap-5">
      <SectionHeader title="Categorias" subtitle="Categorias e subcategorias atuais" />
      <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <Card title="Consumo por categoria">
          <SimplePie data={expensesByCategory} />
        </Card>
        <Card title="Lista de categorias">
          <div className="overflow-auto">
            <table className="app-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Subcategorias</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="font-medium text-ink">{category.name}</td>
                    <td>{category.type}</td>
                    <td>{category.subcategories.map((item) => item.name).join(", ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ReportsPage({ legacy, executive, uber }: { legacy: LegacyDashboard | null; executive: ExecutiveDashboard | null; uber: UberReport | null }) {
  return (
    <div className="grid gap-5">
      <SectionHeader title="Relatórios" subtitle="Análises existentes em uma única área" />
      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Fluxo financeiro">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={executive?.evolution ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => brl.format(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#16A34A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="despesas" stroke="#DC2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fluxo" stroke="#3454D1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Categorias">
          <SimplePie data={legacy?.expensesByCategory ?? []} />
        </Card>
        <Card title="Cartões">
          <SimplePie data={legacy?.cardByCategory ?? []} />
        </Card>
        <Card title="Uber">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Total" value={brl.format(uber?.total ?? 0)} />
            <Stat label="Corridas" value={String(uber?.quantity ?? 0)} />
            <Stat label="Ticket médio" value={brl.format(uber?.averageTicket ?? 0)} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={uber?.byMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => brl.format(Number(value))} />
              <Bar dataKey="amount" fill="#3454D1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="grid gap-5">
      <SectionHeader title="Configurações" subtitle="Parâmetros do sistema" />
      <Card title="Preferências">
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Moeda" value="BRL" />
          <Stat label="Calendário" value="Mensal" />
          <Stat label="Idioma" value="pt-BR" />
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-lg border border-line bg-white px-5 py-4">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </section>
  );
}

function CompactTransactions({ rows }: { rows: ExecutiveDashboard["latestTransactions"] }) {
  return (
    <TableShell minWidth={720}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Origem</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.date)}</td>
              <td className="font-medium text-ink">{item.description}</td>
              <td>{item.category}</td>
              <td>{item.origin}</td>
              <td className={`text-right font-semibold ${item.amount < 0 ? "text-rose-700" : "text-emerald-700"}`}>{brl.format(item.amount)}</td>
            </tr>
          ))}
        </tbody>
    </TableShell>
  );
}

function Alerts({ alerts }: { alerts: ExecutiveDashboard["alerts"] }) {
  if (!alerts.length) return <EmptyState message="Nenhum alerta importante no momento." />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {alerts.map((alert, index) => (
        <div key={`${alert.title}-${index}`} className="rounded-md border border-line bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-ink">{alert.title}</strong>
            <Badge tone={alert.priority === "Alta" ? "red" : alert.priority === "Media" ? "blue" : "gray"}>{alert.priority}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">{alert.message}</p>
        </div>
      ))}
    </div>
  );
}

function EntityList({ items, empty, fallbackCount, icon: Icon }: { items: string[]; empty: string; fallbackCount?: number; icon: typeof Home }) {
  if (!items.length && fallbackCount) {
    return <Stat label="Total cadastrado" value={String(fallbackCount)} />;
  }
  if (!items.length) return <EmptyState message={empty} />;
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-md border border-line px-3 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <Icon size={17} />
          </span>
          <strong className="text-sm text-ink">{item}</strong>
        </div>
      ))}
    </div>
  );
}

function SimplePie({ data }: { data: Array<{ name: string; amount: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data.slice(0, 8)} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={82}>
          {data.slice(0, 8).map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => brl.format(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}
