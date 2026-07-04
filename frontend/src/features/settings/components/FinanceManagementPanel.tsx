import type React from "react";
import { useEffect, useState } from "react";
import { Banknote, CalendarClock, CreditCard, FileUp, Filter, Plus, Search, Tags } from "lucide-react";
import { Badge, Card, EmptyState, Stat } from "@shared/components/ui";
import { api, brl, formatDate } from "@shared/services/api";

type Account = {
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

type Card = {
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

type Category = {
  id: number;
  name: string;
  type: string;
  icon?: string;
  color?: string;
  status?: string;
  favorite?: boolean;
  hidden?: boolean;
  subcategories: Array<{ id: number; name: string }>;
};

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  icon?: string;
  color?: string;
  status: string;
};

type SavedFilterItem = {
  id: number;
  name: string;
  scope: string;
  favorite: boolean;
};

export function FinanceManagementPanel({ categories }: { categories: Category[] }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [status, setStatus] = useState("");

  async function load() {
    const [accountResponse, cardResponse, methodResponse, filterResponse, recurringResponse] = await Promise.all([
      api.get("/accounts"),
      api.get("/cards"),
      api.get("/payment-methods"),
      api.get("/saved-filters"),
      api.get("/recurring-entries")
    ]);
    setAccounts(accountResponse.data);
    setCards(cardResponse.data);
    setPaymentMethods(methodResponse.data);
    setSavedFilters(filterResponse.data);
    setRecurring(recurringResponse.data);
  }

  async function quickAccount() {
    await api.post("/accounts", { name: `Conta ${accounts.length + 1}`, bank: "Banco", type: "Conta Corrente", color: "#3454D1", initialBalance: 0 });
    setStatus("Conta criada.");
    await load();
  }

  async function quickCard() {
    await api.post("/cards", { name: `Cartão ${cards.length + 1}`, bank: "Banco", brand: "Visa", limitAmount: 0, color: "#3454D1" });
    setStatus("Cartão criado.");
    await load();
  }

  async function quickPaymentMethod() {
    await api.post("/payment-methods", { name: `Forma ${paymentMethods.length + 1}`, type: "Other", status: "Active" });
    setStatus("Forma de pagamento criada.");
    await load();
  }

  async function search() {
    if (!query.trim()) return;
    const response = await api.get("/search", { params: { q: query } });
    setSearchResult(response.data);
  }

  async function createSavedFilter() {
    await api.post("/saved-filters", { name: query || "Filtro salvo", filters: { q: query }, favorite: true });
    setStatus("Filtro salvo.");
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-5">
      {status && <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{status}</p>}
      <SearchBar query={query} setQuery={setQuery} onSearch={search} onSaveFilter={createSavedFilter} />
      {searchResult && <GlobalSearchResult result={searchResult} />}

      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Contas" action={<button className="btn-secondary" onClick={quickAccount}><Plus size={14} /> Nova</button>}>
          <div className="grid gap-3">
            {accounts.map((account) => <AccountCard key={account.id} account={account} />)}
            {!accounts.length && <EmptyState message="Nenhuma conta cadastrada." />}
          </div>
        </Card>
        <Card title="Cartões" action={<button className="btn-secondary" onClick={quickCard}><Plus size={14} /> Novo</button>}>
          <div className="grid gap-3">
            {cards.map((card) => <CardCard key={card.id} card={card} />)}
            {!cards.length && <EmptyState message="Nenhum cartão cadastrado." />}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <PaymentMethodManager paymentMethods={paymentMethods} onCreate={quickPaymentMethod} />
        <SavedFilter savedFilters={savedFilters} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <RecurringDialog recurring={recurring} reload={load} />
        <TransferDialog accounts={accounts} reload={load} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CategoryManager categories={categories} />
        <InvoiceCard cards={cards} />
      </section>
    </div>
  );
}

export function AccountCard({ account }: { account: Account }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ background: account.color || "#17202A" }}>
            <Banknote size={18} />
          </span>
          <div>
            <strong className="text-ink">{account.name}</strong>
            <p className="text-xs text-muted">{account.bank || "Banco não informado"} · {account.type}</p>
          </div>
        </div>
        <Badge>{account.status}</Badge>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Stat label="Saldo inicial" value={brl.format(Number(account.initialBalance || 0))} />
        <Stat label="Saldo atual" value={brl.format(Number(account.currentBalance || 0))} />
      </div>
    </div>
  );
}

export function CardCard({ card }: { card: Card }) {
  const limit = Number(card.limitAmount || 0);
  const used = Number(card.usedLimit || 0);
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ background: card.color || "#3454D1" }}>
            <CreditCard size={18} />
          </span>
          <div>
            <strong className="text-ink">{card.name}</strong>
            <p className="text-xs text-muted">{card.bank || "Banco não informado"} · {card.brand || "Bandeira não informada"}</p>
          </div>
        </div>
        <Badge tone="blue">{card.status}</Badge>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-cardblue" style={{ width: `${Math.min(100, Number(card.utilization || 0))}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Stat label="Limite" value={brl.format(limit)} />
        <Stat label="Usado" value={brl.format(used)} />
        <Stat label="Disponível" value={brl.format(Number(card.availableLimit || Math.max(0, limit - used)))} />
      </div>
      <p className="mt-2 text-xs text-muted">Fecha dia {card.closingDay || "-"} · Vence dia {card.dueDay || "-"}</p>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <Card title="Categorias">
      <div className="grid gap-2">
        {categories.slice(0, 10).map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <Tags size={15} />
              {category.name}
            </span>
            <span className="text-xs text-muted">{category.type} · {category.subcategories.length} sub</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PaymentMethodManager({ paymentMethods, onCreate }: { paymentMethods: PaymentMethod[]; onCreate: () => void }) {
  return (
    <Card title="Formas de pagamento" action={<button className="btn-secondary" onClick={onCreate}><Plus size={14} /> Nova</button>}>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method) => <Badge key={method.id}>{method.name}</Badge>)}
        {!paymentMethods.length && <EmptyState message="Nenhuma forma cadastrada." />}
      </div>
    </Card>
  );
}

export function TransferDialog({ accounts, reload }: { accounts: Account[]; reload: () => void }) {
  const [form, setForm] = useState({ fromAccount: "", toAccount: "", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
  async function submit() {
    await api.post("/transfers", form);
    setForm({ ...form, amount: "", notes: "" });
    await reload();
  }
  return (
    <Card title="Transferência entre contas">
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="field" value={form.fromAccount} onChange={(event) => setForm({ ...form, fromAccount: event.target.value })}>
          <option value="">Conta origem</option>
          {accounts.map((account) => <option key={account.id}>{account.name}</option>)}
        </select>
        <select className="field" value={form.toAccount} onChange={(event) => setForm({ ...form, toAccount: event.target.value })}>
          <option value="">Conta destino</option>
          {accounts.map((account) => <option key={account.id}>{account.name}</option>)}
        </select>
        <input className="field" placeholder="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <input className="field" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      </div>
      <button className="mt-3 btn-secondary" onClick={submit}>Criar transferência</button>
    </Card>
  );
}

export function RecurringDialog({ recurring, reload }: { recurring: any[]; reload: () => void }) {
  const [form, setForm] = useState({ name: "", amount: "", frequency: "Mensal", nextDate: new Date().toISOString().slice(0, 10) });
  async function submit() {
    await api.post("/recurring-entries", { ...form, description: form.name });
    setForm({ ...form, name: "", amount: "" });
    await reload();
  }
  return (
    <Card title="Recorrências" action={<button className="btn-secondary" onClick={submit}><Plus size={14} /> Criar</button>}>
      <div className="grid gap-2 sm:grid-cols-4">
        <input className="field" placeholder="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" placeholder="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <select className="field" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
          <option>Diária</option>
          <option>Semanal</option>
          <option>Mensal</option>
          <option>Anual</option>
        </select>
        <input className="field" type="date" value={form.nextDate} onChange={(event) => setForm({ ...form, nextDate: event.target.value })} />
      </div>
      <div className="mt-3 grid gap-2">
        {recurring.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span>{item.name}</span>
            <span className="text-muted">{item.frequency} · {formatDate(item.nextDate)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function InvoiceCard({ cards }: { cards: Card[] }) {
  return (
    <Card title="Faturas">
      <div className="grid gap-2">
        {cards.map((card) => (
          <div key={card.id} className="rounded-md border border-line px-3 py-2 text-sm">
            <strong>{card.name}</strong>
            <p className="text-muted">Atual: {brl.format(Number(card.usedLimit || 0))} · Vence dia {card.dueDay || "-"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AttachmentUploader() {
  return (
    <div className="rounded-md border border-dashed border-line p-3 text-sm text-muted">
      <FileUp size={16} /> Anexos preparados para PDF, imagem, nota fiscal e recibo.
    </div>
  );
}

export function SearchBar({ query, setQuery, onSearch, onSaveFilter }: { query: string; setQuery: (value: string) => void; onSearch: () => void; onSaveFilter: () => void }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-md border border-line px-3">
          <Search size={16} className="text-muted" />
          <input className="min-w-0 flex-1 outline-none" placeholder="Pesquisar descrição, categoria, conta, cartão, banco, valor..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSearch()} />
        </div>
        <button className="btn-secondary" onClick={onSearch}>Buscar</button>
        <button className="btn-secondary" onClick={onSaveFilter}><Filter size={14} /> Salvar filtro</button>
      </div>
    </section>
  );
}

export function SavedFilter({ savedFilters }: { savedFilters: SavedFilterItem[] }) {
  return (
    <Card title="Filtros salvos">
      <div className="flex flex-wrap gap-2">
        {savedFilters.map((filter) => <Badge key={filter.id} tone={filter.favorite ? "blue" : "gray"}>{filter.name}</Badge>)}
        {!savedFilters.length && <EmptyState message="Nenhum filtro salvo." />}
      </div>
    </Card>
  );
}

function GlobalSearchResult({ result }: { result: any }) {
  return (
    <Card title="Resultado da pesquisa">
      <div className="grid gap-2 md:grid-cols-4">
        <Stat label="Lançamentos" value={String(result.entries?.length || 0)} />
        <Stat label="Contas" value={String(result.accounts?.length || 0)} />
        <Stat label="Cartões" value={String(result.cards?.length || 0)} />
        <Stat label="Categorias" value={String(result.categories?.length || 0)} />
      </div>
    </Card>
  );
}
