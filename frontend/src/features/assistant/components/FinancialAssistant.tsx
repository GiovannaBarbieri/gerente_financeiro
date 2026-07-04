import { useEffect, useMemo, useState } from "react";
import { Bot, History, Paperclip, Plus, Send, Settings, Sparkles, Star } from "lucide-react";
import { Card, Stat } from "@shared/components/ui";
import { api, brl, formatDate } from "@shared/services/api";

type Conversation = {
  id: string;
  title: string;
  favorite: boolean;
  updatedAt: string;
  messages?: Array<{ role: string; content: string }>;
};

type Message = {
  id?: string;
  role: string;
  content: string;
};

type Recommendation = {
  id: string;
  title: string;
  message: string;
  impact: number;
  priority: string;
};

export function FinancialAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [context, setContext] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [typing, setTyping] = useState(false);

  async function load() {
    const [history, recs, ctx, aiSettings] = await Promise.all([
      api.get("/ai/history"),
      api.get("/ai/recommendations"),
      api.get("/ai/context"),
      api.get("/ai/settings")
    ]);
    setConversations(history.data);
    setRecommendations(recs.data);
    setContext(ctx.data);
    setSettings(aiSettings.data);
  }

  async function openConversation(id: string) {
    const response = await api.get("/ai/history", { params: { conversationId: id } });
    setConversationId(id);
    setMessages(response.data.messages);
  }

  async function send(message = input) {
    if (!message.trim()) return;
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setTyping(true);
    const response = await api.post("/ai/chat", { conversationId, message });
    setConversationId(response.data.conversationId);
    setMessages((current) => [...current, { role: "assistant", content: response.data.answer }]);
    setTyping(false);
    await load();
  }

  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
    setInput("");
  }

  useEffect(() => {
    load();
  }, []);

  const contextSummary = useMemo(() => {
    const summary = context?.summary?.summary ?? [];
    return {
      saldo: summary.find((item: any) => item.key === "saldoAtual")?.value ?? 0,
      receitas: summary.find((item: any) => item.key === "receitas")?.value ?? 0,
      despesas: summary.find((item: any) => item.key === "despesas")?.value ?? 0,
      pendentes: summary.find((item: any) => item.key === "pendentes")?.value ?? 0
    };
  }, [context]);

  return (
    <ChatLayout
      sidebar={
        <>
          <ConversationList conversations={conversations} activeId={conversationId} onOpen={openConversation} />
          <FinancialContext summary={contextSummary} />
          <ConversationHistory conversations={conversations} />
          <AISettings settings={settings} setSettings={setSettings} />
        </>
      }
      main={
        <>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Assistente Financeiro</h2>
              <p className="text-xs text-muted">Contexto resumido, sem enviar lanÃ§amentos brutos.</p>
            </div>
            <button className="btn-secondary" onClick={newConversation}><Plus size={14} /> Nova conversa</button>
          </div>
          <div className="grid flex-1 content-between gap-4 overflow-hidden p-4">
            <div className="grid max-h-[580px] gap-3 overflow-auto pr-1">
              {!messages.length && (
                <div className="grid gap-3">
                  <div className="rounded-lg border border-line bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles size={16} /> SugestÃµes</div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {[
                        "Quanto gastei com Uber este ano?",
                        "Quais despesas posso reduzir?",
                        "Qual categoria mais aumentou?",
                        "Quanto sobra por mÃªs?",
                        "E se eu economizar R$ 500 por mÃªs?",
                        "Como montar uma reserva de emergÃªncia?"
                      ].map((text) => <SuggestionCard key={text} text={text} onClick={() => send(text)} />)}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {recommendations.slice(0, 4).map((item) => <RecommendationCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={message.id || index} className={`max-w-[82%] rounded-lg px-4 py-3 text-sm ${message.role === "user" ? "ml-auto bg-ink text-white" : "bg-white border border-line text-ink"}`}>
                  <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                </div>
              ))}
              {typing && <TypingIndicator />}
            </div>
            <PromptInput value={input} setValue={setInput} onSend={() => send()} />
          </div>
        </>
      }
    />
  );
}

export function ChatLayout({ sidebar, main }: { sidebar: React.ReactNode; main: React.ReactNode }) {
  return (
    <section className="grid min-h-[720px] overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[320px_1fr]">
      <aside className="grid gap-4 overflow-auto border-b border-line bg-slate-50 p-4 lg:border-b-0 lg:border-r">{sidebar}</aside>
      <main className="flex min-h-0 flex-col bg-white">{main}</main>
    </section>
  );
}

export function ConversationList({ conversations, activeId, onOpen }: { conversations: Conversation[]; activeId?: string; onOpen: (id: string) => void }) {
  return (
    <Card title="Conversas">
      <div className="grid gap-2">
        {conversations.slice(0, 12).map((conversation) => (
          <button key={conversation.id} className={`rounded-md px-3 py-2 text-left text-sm ${activeId === conversation.id ? "bg-ink text-white" : "bg-white border border-line text-ink"}`} onClick={() => onOpen(conversation.id)}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{conversation.title}</span>
              {conversation.favorite && <Star size={14} />}
            </div>
            <p className="mt-1 text-xs opacity-70">{formatDate(conversation.updatedAt)}</p>
          </button>
        ))}
        {!conversations.length && <p className="text-sm text-muted">Nenhuma conversa ainda.</p>}
      </div>
    </Card>
  );
}

export function PromptInput({ value, setValue, onSend }: { value: string; setValue: (value: string) => void; onSend: () => void }) {
  return (
    <div className="flex items-end gap-2 rounded-lg border border-line bg-slate-50 p-3">
      <button className="btn-secondary" title="Anexar"><Paperclip size={16} /></button>
      <textarea className="min-h-[48px] flex-1 resize-none rounded-md border border-line bg-white px-3 py-2 text-sm outline-none" placeholder="Pergunte sobre seus gastos, metas, cartÃµes, economia..." value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} />
      <button className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white" onClick={onSend}><Send size={16} /> Enviar</button>
    </div>
  );
}

export function SuggestionCard({ text, onClick }: { text: string; onClick: () => void }) {
  return <button className="rounded-md border border-line bg-white px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={onClick}>{text}</button>;
}

export function FinancialContext({ summary }: { summary: { saldo: number; receitas: number; despesas: number; pendentes: number } }) {
  return (
    <Card title="Resumo Financeiro">
      <div className="grid gap-2">
        <Stat label="Saldo" value={brl.format(summary.saldo)} />
        <Stat label="Receitas" value={brl.format(summary.receitas)} />
        <Stat label="Despesas" value={brl.format(summary.despesas)} />
        <Stat label="Pendentes" value={String(summary.pendentes)} />
      </div>
    </Card>
  );
}

export function RecommendationCard({ item }: { item: Recommendation }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-ink">{item.title}</strong>
        <span className={item.priority === "Alta" ? "badge-red" : "badge-blue"}>{item.priority}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{item.message}</p>
      {Number(item.impact) > 0 && <p className="mt-2 text-xs font-semibold text-ink">Impacto: {brl.format(Number(item.impact))}</p>}
    </div>
  );
}

export function SimulationCard({ title, value }: { title: string; value: string }) {
  return <Stat label={title} value={value} />;
}

export function ConversationHistory({ conversations }: { conversations: Conversation[] }) {
  const favorites = conversations.filter((item) => item.favorite);
  return (
    <Card title="Favoritos">
      <div className="grid gap-2">
        {favorites.map((item) => <span key={item.id} className="badge-blue">{item.title}</span>)}
        {!favorites.length && <p className="text-sm text-muted">Sem favoritos.</p>}
      </div>
    </Card>
  );
}

export function AISettings({ settings, setSettings }: { settings: any; setSettings: (settings: any) => void }) {
  async function update(field: string, value: string) {
    const next = { ...settings, [field]: value };
    setSettings(next);
    await api.patch("/ai/settings", next);
  }

  return (
    <Card title="Configurações IA">
      <div className="grid gap-2">
        <select className="field" value={settings?.provider || "local"} onChange={(event) => update("provider", event.target.value)}>
          <option value="local">Local</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="ollama">Ollama</option>
          <option value="lmstudio">LM Studio</option>
          <option value="azure-openai">Azure OpenAI</option>
        </select>
        <input className="field" value={settings?.model || ""} onChange={(event) => update("model", event.target.value)} placeholder="Modelo" />
        <input className="field" value={settings?.language || "pt-BR"} onChange={(event) => update("language", event.target.value)} placeholder="Idioma" />
      </div>
    </Card>
  );
}

export function TypingIndicator() {
  return <div className="w-fit rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">Analisando contexto financeiro...</div>;
}

