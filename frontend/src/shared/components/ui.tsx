import type React from "react";
import { Loader2 } from "lucide-react";

type Tone = "gray" | "blue" | "green" | "red";

const badgeTone: Record<Tone, string> = {
  gray: "badge-gray",
  blue: "badge-blue",
  green: "badge-green",
  red: "badge-red"
};

const buttonVariant = {
  primary: "bg-ink text-white hover:opacity-90",
  secondary: "border border-line bg-white text-ink hover:bg-slate-50",
  ghost: "bg-transparent text-ink hover:bg-slate-100",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariant;
  icon?: React.ReactNode;
};

export function Button({ variant = "secondary", icon, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold disabled:opacity-40 ${buttonVariant[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={badgeTone[tone]}>{children}</span>;
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white p-4 shadow-soft ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, size = "sm" }: { label: string; value: string; size?: "sm" | "md" }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-muted">{label}</p>
      <strong className={`mt-1 block text-ink ${size === "md" ? "text-base" : "text-sm"}`}>{value}</strong>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}

export function SelectField({ label, value, onChange, options, allLabel = "Todos" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel?: string }) {
  return (
    <Field label={label}>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}

export function TableShell({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-auto">
      <table className="app-table" style={{ minWidth }}>{children}</table>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted">{message}</p>;
}

export function LoadingState({ message = "Carregando dados..." }: { message?: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 className="animate-spin" size={16} />
      {message}
    </p>
  );
}

export function Modal({ open, title, children, footer, onClose }: { open: boolean; title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
      <section className="w-full max-w-2xl rounded-lg border border-line bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </header>
        <div className="p-4">{children}</div>
        {footer && <footer className="border-t border-line px-4 py-3">{footer}</footer>}
      </section>
    </div>
  );
}

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <section className="h-full w-full max-w-xl overflow-auto border-l border-line bg-white shadow-soft">
        <header className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}
