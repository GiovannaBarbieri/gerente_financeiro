import { brl, formatDate } from "@shared/services/api";

export type TransactionRow = {
  id: string;
  rawId: number | string;
  date: string;
  month: string;
  type: string;
  source: "Conta" | "Cartao";
  institution?: string;
  accountName?: string;
  cardName?: string;
  description: string;
  normalizedDescription?: string;
  personName?: string;
  category: string;
  subcategory: string;
  financialNature?: string;
  origin: string;
  paymentMethod?: string;
  amount: number;
  status?: string;
  statusLabel?: string;
  isCreditCardPayment: boolean;
  isReconciled: boolean;
  notes?: string;
};

type Props = {
  rows: TransactionRow[];
  onEdit?: (row: TransactionRow) => void;
  onIgnore?: (row: TransactionRow) => void;
  onReview?: (row: TransactionRow) => void;
};

export function TransactionsTable({ rows, onEdit, onIgnore, onReview }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Data</th>
              <th className="px-3 py-3">Descricao</th>
              <th className="px-3 py-3">Categoria</th>
              <th className="px-3 py-3">Conta/Cartao</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3 text-right">Valor</th>
              <th className="px-3 py-3">Origem</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-3">
                  <div>{formatDate(row.date)}</div>
                  <div className="text-xs text-muted">{row.month}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink">{row.description}</div>
                  <div className="text-xs text-muted">{row.normalizedDescription || row.personName}</div>
                </td>
                <td className="px-3 py-3">
                  <div>{row.category}</div>
                  {row.subcategory && <div className="text-xs text-muted">{row.subcategory}</div>}
                </td>
                <td className="px-3 py-3">
                  <AccountCardDisplay row={row} />
                </td>
                <td className="px-3 py-3">
                  <span className="badge-gray">{row.financialNature || row.type}</span>
                  <div className="mt-1 text-xs text-muted">{row.paymentMethod}</div>
                </td>
                <td className={`px-3 py-3 text-right font-semibold ${row.amount < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {brl.format(row.amount)}
                </td>
                <td className="px-3 py-3">{row.origin}</td>
                <td className="px-3 py-3">
                  {row.statusLabel ? (
                    <span className={row.status === "ignored" ? "badge-red" : row.status === "reviewed" || row.status === "paid" || row.status === "cleared" ? "badge-green" : "badge-gray"}>
                      {row.statusLabel}
                    </span>
                  ) : row.isCreditCardPayment ? (
                    <span className={row.isReconciled ? "badge-green" : "badge-red"}>
                      {row.isReconciled ? "Fatura conciliada" : "Fatura pendente"}
                    </span>
                  ) : (
                    <span className="badge-gray">Normal</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="btn-secondary" onClick={() => onEdit?.(row)}>Editar</button>
                    <button className="btn-secondary" onClick={() => onReview?.(row)}>Revisar</button>
                    <button className="btn-secondary" onClick={() => onIgnore?.(row)}>Ignorar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-3 py-8 text-center text-muted" colSpan={8}>
                  Nenhuma movimentacao encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountCardDisplay({ row }: { row: TransactionRow }) {
  const account = row.source === "Conta" ? row.accountName : "";
  const card = row.cardName || (row.source === "Cartao" ? row.accountName : "");
  if (account && card) {
    return (
      <div>
        <span className="badge-gray">Conta</span>
        <div className="mt-1 text-xs text-muted">{account}</div>
        <span className="mt-2 badge-blue">Cartao</span>
        <div className="mt-1 text-xs text-muted">{card}</div>
      </div>
    );
  }
  if (card) {
    return (
      <div>
        <span className="badge-blue">Cartao</span>
        <div className="mt-1 text-xs text-muted">{card}</div>
      </div>
    );
  }
  if (account) {
    return (
      <div>
        <span className="badge-gray">Conta</span>
        <div className="mt-1 text-xs text-muted">{account}</div>
      </div>
    );
  }
  return <span className="text-xs text-muted">Nao informado</span>;
}
