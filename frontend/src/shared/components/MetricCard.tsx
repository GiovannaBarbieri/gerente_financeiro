import { LucideIcon } from "lucide-react";
import { brl } from "@shared/services/api";

type Props = {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "green" | "red" | "blue" | "agro" | "neutral";
};

const tones = {
  green: "text-emerald-700 bg-emerald-50",
  red: "text-rose-700 bg-rose-50",
  blue: "text-cardblue bg-blue-50",
  agro: "text-agro bg-lime-50",
  neutral: "text-slate-700 bg-slate-100"
};

export function MetricCard({ title, value, icon: Icon, tone = "neutral" }: Props) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{title}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="mt-3 block text-xl font-semibold text-ink">{brl.format(value || 0)}</strong>
    </section>
  );
}
