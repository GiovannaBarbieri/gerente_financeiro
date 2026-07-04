import { useState } from "react";
import { Eye, UploadCloud } from "lucide-react";
import { api } from "@shared/services/api";

type Props = {
  type: "account" | "card";
  onDone: () => void;
};

type Preview = {
  parser: string;
  columns: string[];
  mappedColumns: Record<string, string | null>;
  requiredFound: string[];
  missingRequired: string[];
  optionalFound: string[];
  totalRows: number;
  rows: Record<string, unknown>[];
};

export function FileUpload({ type, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  function formData() {
    if (!file) return null;
    const data = new FormData();
    data.append("file", file);
    if (invoiceMonth) data.append("invoiceMonth", invoiceMonth);
    return data;
  }

  async function previewFile() {
    const data = formData();
    if (!data) return;
    setStatus("Separando colunas...");
    const response = await api.post(`/imports/${type}/preview`, data);
    setPreview(response.data);
    setStatus(response.data.missingRequired.length ? "Campos obrigatorios ausentes." : "Pre-visualizacao pronta.");
  }

  async function submit() {
    const data = formData();
    if (!data) return;
    setStatus("Importando...");
    const response = await api.post(`/imports/${type}`, data);
    setStatus(`${response.data.created} importadas, ${response.data.skipped} ignoradas`);
    setFile(null);
    setPreview(null);
    onDone();
  }

  const canImport = Boolean(file) && (!preview || preview.missingRequired.length === 0);
  const previewColumns = type === "account"
    ? ["data_movimentacao", "descricao", "valor", "tipo_movimentacao", "origem_dados"]
    : ["data_compra", "descricao", "valor", "cartao", "competencia"];

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <UploadCloud size={18} />
        {type === "account" ? "Importar conta corrente" : "Importar cartao"}
      </div>
      <div className="mt-4 grid gap-3">
        <input
          className="block w-full rounded-md border border-line px-3 py-2 text-sm"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setStatus("");
          }}
        />
        {type === "card" && (
          <input
            className="rounded-md border border-line px-3 py-2 text-sm"
            type="month"
            value={invoiceMonth}
            onChange={(event) => setInvoiceMonth(event.target.value)}
          />
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={!file}
            onClick={previewFile}
          >
            <Eye size={16} />
            Pre-visualizar
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            disabled={!canImport}
            onClick={submit}
          >
            Importar
          </button>
        </div>
        {status && <p className="text-xs text-muted">{status}</p>}
        {preview && (
          <div className="grid gap-3 rounded-md border border-line bg-slate-50 p-3">
            <div className="grid gap-1 text-xs text-slate-700">
              <span>Parser: {preview.parser}</span>
              <span>Total de linhas: {preview.totalRows}</span>
              <span>Colunas encontradas: {preview.columns.join(", ")}</span>
              {preview.missingRequired.length > 0 && <span className="font-semibold text-rose-700">Faltando: {preview.missingRequired.join(", ")}</span>}
            </div>
            <div className="overflow-auto rounded-md border border-line bg-white">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-100 text-muted">
                  <tr>
                    {previewColumns.map((column, index) => (
                      <th
                        key={column}
                        className={`px-2 py-2 ${index === 0 ? "sticky left-0 z-10 bg-slate-100 shadow-[1px_0_0_#e2e8f0]" : ""}`}
                      >
                        <div>{column}</div>
                        <div className="font-normal">{preview.mappedColumns[column] || "nao encontrado"}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.rows.slice(0, 8).map((row, index) => (
                    <tr key={index}>
                      {previewColumns.map((column, columnIndex) => (
                        <td
                          key={column}
                          className={`max-w-[180px] truncate px-2 py-2 ${columnIndex === 0 ? "sticky left-0 bg-white shadow-[1px_0_0_#e2e8f0]" : ""}`}
                        >
                          {String(row[column] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
