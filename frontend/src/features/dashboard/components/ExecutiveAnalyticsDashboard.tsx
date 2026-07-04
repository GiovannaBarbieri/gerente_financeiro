import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, CalendarClock, CreditCard, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, Field, SelectField, Stat } from "@shared/components/ui";
import { api, brl, currentMonth, formatDate } from "@shared/services/api";

type DashboardData = {
  filters: Record<string, string[]>;
  summary: Array<{ key: string; title: string; value: number; variation: number; sparkline: number[]; tone: string; format?: string }>;
  flow: Array<{ period: string; receitas: number; despesas: number; resultado: number }>;
  categories: {
    ranking: Array<{ name: string; amount: number; previousAmount: number; variation: number }>;
    biggest: { name: string; amount: number } | null;
    growth: { name: string; amount: number; variation: number } | null;
    reduction: { name: string; amount: number; variation: number } | null;
    pie: Array<{ name: string; amount: number }>;
    bars: Array<{ name: string; amount: number; variation: number }>;
  };
  accounts: Array<{ id: number; name: string; bank?: string; type: string; color?: string; saldo: number; movimentacao: number; entradas: number; saidas: number; saldoPrevisto: number }>;
  creditCards: Array<{ id: number; name: string; bank?: string; brand?: string; color?: string; limit: number; used: number; available: number; currentInvoice: number; nextInvoice: number; monthPurchases: number; dueDay?: number }>;
  calendar: {
    upcoming: Array<{ type: string; date: string; title: string; amount: number; status: string }>;
    overdue: Array<{ type: string; date: string; title: string; amount: number; status: string }>;
  };
  top: {
    expenses: Array<{ id: string; date: string; description: string; category: string; establishment: string; amount: number }>;
    revenues: Array<{ id: string; date: string; description: string; category: string; establishment: string; amount: number }>;
    establishments: Array<{ name: string; amount: number }>;
    categories: Array<{ name: string; amount: number }>;
  };
  indicators: {
    averageTicket: number;
    dailyAverageExpense: number;
    averageRevenue: number;
    monthlySavings: number;
    largestPurchase: { description: string; amount: number } | null;
    largestRevenue: { description: string; amount: number } | null;
    transactionCount: number;
  };
};

const COLORS = ["#3454D1", "#16A34A", "#DC2626", "#0891B2", "#7C3AED", "#D97706", "#0F766E", "#BE123C"];

export function ExecutiveAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: currentMonth(),
    range: "30d",
    account: "",
    card: "",
    category: "",
    type: "",
    institution: "",
    tag: ""
  });

  async function load() {
    setLoading(true);
    const response = await api.get("/analytics-dashboard", { params: filters });
    setData(response.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filters]);

  if (!data) {
    return <p className="text-sm text-muted">Carregando dashboard...</p>;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-line bg-white px-5 py-4">
        <h2 className="text-xl font-semibold text-ink">Dashboard Executivo</h2>
        <p className="mt-1 text-sm text-muted">Análise do comportamento financeiro com base nos lançamentos existentes.</p>
      </section>

      <DashboardFilters filters={filters} setFilters={setFilters} options={data.filters} />
      {loading && <p className="text-sm text-muted">Atualizando indicadores...</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item) => <SummaryCard key={item.key} item={item} />)}
      </section>

      <FinancialChart data={data.flow} />

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <CategoryChart categories={data.categories} />
        <section className="grid gap-5 lg:grid-cols-2">
          <Card title="Contas">
            <div className="grid gap-3">
              {data.accounts.map((account) => <AccountWidget key={account.id} account={account} />)}
              {!data.accounts.length && <p className="text-sm text-muted">Nenhuma conta encontrada.</p>}
            </div>
          </Card>
          <Card title="Cartões">
            <div className="grid gap-3">
              {data.creditCards.map((card) => <CreditCardWidget key={card.id} card={card} />)}
              {!data.creditCards.length && <p className="text-sm text-muted">Nenhum cartão encontrado.</p>}
            </div>
          </Card>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <UpcomingBills upcoming={data.calendar.upcoming} overdue={data.calendar.overdue} />
        <TopExpenses top={data.top} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IndicatorCard title="Ticket médio" value={brl.format(data.indicators.averageTicket)} icon={WalletCards} />
        <IndicatorCard title="Gasto médio diário" value={brl.format(data.indicators.dailyAverageExpense)} icon={TrendingDown} />
        <IndicatorCard title="Receita média" value={brl.format(data.indicators.averageRevenue)} icon={TrendingUp} />
        <IndicatorCard title="Economia do mês" value={brl.format(data.indicators.monthlySavings)} icon={Banknote} />
        <IndicatorCard title="Maior compra" value={data.indicators.largestPurchase ? brl.format(Math.abs(data.indicators.largestPurchase.amount)) : brl.format(0)} icon={ArrowDownRight} />
        <IndicatorCard title="Maior receita" value={data.indicators.largestRevenue ? brl.format(data.indicators.largestRevenue.amount) : brl.format(0)} icon={ArrowUpRight} />
        <IndicatorCard title="Quantidade de lançamentos" value={String(data.indicators.transactionCount)} icon={CalendarClock} />
      </section>
    </div>
  );
}

export function DashboardFilters({ filters, setFilters, options }: { filters: Record<string, string>; setFilters: (filters: any) => void; options: Record<string, string[]> }) {
  function update(field: string, value: string) {
    setFilters((current: Record<string, string>) => ({ ...current, [field]: value }));
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Field label="Período"><input className="field" type="month" value={filters.month} onChange={(event) => update("month", event.target.value)} /></Field>
        <Field label="Janela">
          <select className="field" value={filters.range} onChange={(event) => update("range", event.target.value)}>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="90d">90 dias</option>
            <option value="12m">12 meses</option>
          </select>
        </Field>
        <SelectField label="Conta" value={filters.account} onChange={(value) => update("account", value)} options={options.accounts || []} />
        <SelectField label="Cartão" value={filters.card} onChange={(value) => update("card", value)} options={options.cards || []} />
        <SelectField label="Categoria" value={filters.category} onChange={(value) => update("category", value)} options={options.categories || []} />
        <SelectField label="Tipo" value={filters.type} onChange={(value) => update("type", value)} options={options.types || []} />
        <SelectField label="Instituição" value={filters.institution} onChange={(value) => update("institution", value)} options={options.institutions || []} />
        <SelectField label="Tags" value={filters.tag} onChange={(value) => update("tag", value)} options={options.tags || []} />
      </div>
    </section>
  );
}

export function SummaryCard({ item }: { item: DashboardData["summary"][number] }) {
  const positive = item.variation >= 0;
  const value = item.format === "number" ? String(item.value) : brl.format(item.value);
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{item.title}</p>
          <strong className="mt-2 block text-xl text-ink">{value}</strong>
        </div>
        <span className={positive ? "badge-green" : "badge-red"}>{positive ? "+" : ""}{item.variation}%</span>
      </div>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={item.sparkline.map((value, index) => ({ index, value }))}>
            <Line type="monotone" dataKey="value" stroke={item.tone === "red" ? "#DC2626" : item.tone === "blue" ? "#3454D1" : "#16A34A"} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function FinancialChart({ data }: { data: DashboardData["flow"] }) {
  return (
    <Card title="Fluxo Financeiro">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip formatter={(value) => brl.format(Number(value))} />
          <Bar dataKey="receitas" fill="#16A34A" radius={[6, 6, 0, 0]} />
          <Bar dataKey="despesas" fill="#DC2626" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CategoryChart({ categories }: { categories: DashboardData["categories"] }) {
  return (
    <Card title="Categorias">
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Stat label="Maior categoria" value={categories.biggest?.name || "-"} />
        <Stat label="Maior crescimento" value={categories.growth ? `${categories.growth.name} (${categories.growth.variation}%)` : "-"} />
        <Stat label="Maior redução" value={categories.reduction ? `${categories.reduction.name} (${categories.reduction.variation}%)` : "-"} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={categories.pie} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={84}>
              {categories.pie.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => brl.format(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categories.bars}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip formatter={(value) => brl.format(Number(value))} />
            <Bar dataKey="amount" fill="#3454D1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AccountWidget({ account }: { account: DashboardData["accounts"][number] }) {
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <strong>{account.name}</strong>
        <span className="badge-gray">{account.type}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Stat label="Saldo" value={brl.format(account.saldo)} />
        <Stat label="Movimentação" value={brl.format(account.movimentacao)} />
        <Stat label="Entradas" value={brl.format(account.entradas)} />
        <Stat label="Saídas" value={brl.format(account.saidas)} />
        <Stat label="Saldo previsto" value={brl.format(account.saldoPrevisto)} />
      </div>
    </div>
  );
}

export function CreditCardWidget({ card }: { card: DashboardData["creditCards"][number] }) {
  const usage = card.limit ? Math.min(100, Math.round((card.used / card.limit) * 100)) : 0;
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <strong>{card.name}</strong>
        <CreditCard size={18} className="text-cardblue" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-cardblue" style={{ width: `${usage}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Stat label="Limite" value={brl.format(card.limit)} />
        <Stat label="Utilizado" value={brl.format(card.used)} />
        <Stat label="Disponível" value={brl.format(card.available)} />
        <Stat label="Fatura atual" value={brl.format(card.currentInvoice)} />
        <Stat label="Próxima fatura" value={brl.format(card.nextInvoice)} />
        <Stat label="Compras do mês" value={String(card.monthPurchases)} />
      </div>
    </div>
  );
}

export function UpcomingBills({ upcoming, overdue }: { upcoming: DashboardData["calendar"]["upcoming"]; overdue: DashboardData["calendar"]["overdue"] }) {
  return (
    <Card title="Calendário Financeiro">
      <div className="grid gap-2">
        {[...overdue, ...upcoming].slice(0, 12).map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
            <div>
              <strong>{item.title}</strong>
              <p className="text-xs text-muted">{item.type} · {item.date ? formatDate(item.date) : "-"}</p>
            </div>
            <span className={item.type === "Vencida" ? "badge-red" : "badge-gray"}>{brl.format(Math.abs(item.amount || 0))}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopExpenses({ top }: { top: DashboardData["top"] }) {
  return (
    <Card title="Top Gastos e Receitas">
      <div className="grid gap-4 lg:grid-cols-2">
        <Rank title="Top 10 despesas" rows={top.expenses.map((item) => ({ name: item.description, amount: Math.abs(item.amount) }))} />
        <Rank title="Top 10 receitas" rows={top.revenues.map((item) => ({ name: item.description, amount: item.amount }))} />
        <Rank title="Top estabelecimentos" rows={top.establishments} />
        <Rank title="Top categorias" rows={top.categories} />
      </div>
    </Card>
  );
}

export function IndicatorCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Banknote }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{title}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon size={18} /></span>
      </div>
      <strong className="mt-3 block text-lg text-ink">{value}</strong>
    </section>
  );
}

function Rank({ title, rows }: { title: string; rows: Array<{ name: string; amount: number }> }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-ink">{title}</h4>
      <div className="grid gap-2">
        {rows.slice(0, 10).map((row, index) => (
          <div key={`${row.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="truncate">{index + 1}. {row.name}</span>
            <strong>{brl.format(Math.abs(row.amount))}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
