import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, FileSpreadsheet, UploadCloud, XCircle } from "lucide-react";
import { Badge, Card, EmptyState, Stat, TableShell } from "@shared/components/ui";
import { api, brl, formatDate } from "@shared/services/api";

type SmartFile = {
  importFileId: string;
  fileName: string;
  sourceType: string;
  detectedKind: string;
  institution: string;
  accountName: string;
  accountOrCard: string;
  parser: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
  duplicateStatus: string;
  issues: string[];
  columns: string[];
  mappedColumns: Record<string, string | null>;
  rows: Record<string, unknown>[];
};

type SmartPreview = {
  importBatchId: string;
  files: SmartFile[];
  smartSummary: {
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

type ImportResult = {
  finalReport: {
    files: number;
    created: number;
    duplicates: number;
    ignored: number;
    errors: number;
    totalAmount: number;
    revenues: number;
    expenses: number;
    processingTimeMs: number;
  };
};

type HistoryItem = {
  id: string;
  date: string;
  files: number;
  fileNames: string[];
  institutions: string;
  quantity: number;
  imported: number;
  duplicates: number;
  errors: number;
  user: string;
  status: string;
  details: Array<{
    id: string;
    fileName: string;
    institution: string;
    sourceType: string;
    parserName: string;
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    errorRows: number;
    status: string;
    errorMessage?: string;
  }>;
};

export function ImportCenter({ onDone, goToEntries }: { onDone: () => void; goToEntries: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<SmartPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reviewRows, setReviewRows] = useState<Array<Record<string, unknown> & { fileName: string; institution: string; sourceType: string; parser: string; duplicateRows: number; errorRows: number }>>([]);

  async function loadHistory() {
    const response = await api.get("/imports/smart/history");
    setHistory(response.data);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((file) => /\.(csv|xlsx|xls)$/i.test(file.name));
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}`));
      return [...current, ...incoming.filter((file) => !existing.has(`${file.name}-${file.size}`))];
    });
    setPreview(null);
    setResult(null);
    setStatus("");
  }

  async function previewFiles() {
    if (!files.length) return;
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    setStatus("Detectando origem, parser e registros...");
    const response = await api.post("/imports/smart/preview", data);
    setPreview(response.data);
    setSelectedIds(new Set(response.data.files.filter((file: SmartFile) => file.status !== "Error").map((file: SmartFile) => file.importFileId)));
    setReviewRows(flattenRows(response.data.files));
    setPage(1);
    setStatus("Revisão pronta.");
  }

  async function confirmImport() {
    if (!preview) {
      setStatus("Primeiro selecione os arquivos e clique em Analisar extratos.");
      return;
    }
    setStatus("Salvando lançamentos...");
    const response = await api.post("/imports/smart/confirm", {
      importBatchId: preview.importBatchId,
      selectedFileIds: Array.from(selectedIds)
    });
    setResult(response.data);
    setFiles([]);
    setPreview(null);
    setSelectedIds(new Set());
    setStatus("Importação concluída.");
    await loadHistory();
    onDone();
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-line bg-white px-5 py-4">
        <h2 className="text-xl font-semibold text-ink">Importar Extratos</h2>
        <p className="mt-1 text-sm text-muted">Arraste arquivos CSV ou Excel. O sistema detecta o tipo e prepara a revisão.</p>
      </section>

      <UploadZone files={files} addFiles={addFiles} removeFile={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />

      <div className="flex flex-wrap gap-2">
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold disabled:opacity-40" disabled={!files.length} onClick={previewFiles}>
          <FileSpreadsheet size={16} />
          Analisar extratos
        </button>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white disabled:opacity-40" disabled={!preview || !selectedCount} onClick={confirmImport}>
          <CheckCircle2 size={16} />
          Confirmar importação ({selectedCount})
        </button>
      </div>

      {status && <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{status}</p>}

      {preview && (
        <>
          <ImportSummary summary={preview.smartSummary} />
          <ImportTable files={preview.files} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
          <ReviewDrawer rows={reviewRows} setRows={setReviewRows} page={page} setPage={setPage} />
        </>
      )}

      {result && <FinalReport result={result} goToEntries={goToEntries} importAgain={() => setResult(null)} />}

      <ImportHistory history={history} />
    </div>
  );
}

export function UploadZone({ files, addFiles, removeFile }: { files: File[]; addFiles: (files: FileList | null) => void; removeFile: (index: number) => void }) {
  return (
    <section
      className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      }}
    >
      <UploadCloud className="mx-auto text-muted" size={28} />
      <p className="mt-3 text-sm font-semibold text-ink">Arraste arquivos aqui</p>
      <p className="mt-1 text-xs text-muted">CSV, XLS ou XLSX. Múltiplos arquivos são aceitos.</p>
      <input className="mx-auto mt-4 block max-w-xl rounded-md border border-line bg-white px-3 py-2 text-sm" type="file" accept=".csv,.xlsx,.xls" multiple onChange={(event) => addFiles(event.target.files)} />
      {!!files.length && (
        <div className="mx-auto mt-4 grid max-w-3xl gap-2 text-left">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
              <span className="truncate">{file.name}</span>
              <button className="text-rose-700" onClick={() => removeFile(index)}>Remover</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ImportSummary({ summary }: { summary: SmartPreview["smartSummary"] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Stat label="Arquivos" value={String(summary.importedFiles)} />
      <Stat label="Registros" value={String(summary.totalRecords)} />
      <Stat label="Válidos" value={String(summary.validRecords)} />
      <Stat label="Duplicados" value={String(summary.duplicates)} />
      <Stat label="Erros" value={String(summary.errors)} />
      <Stat label="Valor total" value={brl.format(summary.totalAmount)} />
      <Stat label="Receitas" value={brl.format(summary.revenues)} />
      <Stat label="Despesas" value={brl.format(summary.expenses)} />
      <Stat label="Transferências" value={String(summary.transfers)} />
      <Stat label="Processamento" value={`${summary.processingTimeMs} ms`} />
    </section>
  );
}

export function ImportTable({ files, selectedIds, setSelectedIds }: { files: SmartFile[]; selectedIds: Set<string>; setSelectedIds: (value: Set<string>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <div className="overflow-auto">
        <table className="app-table min-w-[1120px]">
          <thead>
            <tr>
              <th></th>
              <th>Arquivo</th>
              <th>Instituição</th>
              <th>Tipo detectado</th>
              <th>Conta/Cartão</th>
              <th>Registros</th>
              <th>Status</th>
              <th>Duplicidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <>
                <tr key={file.importFileId || file.fileName}>
                  <td><button onClick={() => setOpen(open === file.fileName ? null : file.fileName)}>{open === file.fileName ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td>
                  <td className="font-medium text-ink">{file.fileName}</td>
                  <td>{file.institution || "Origem desconhecida"}</td>
                  <td>{file.detectedKind}</td>
                  <td>{file.accountOrCard || "Não informado"}</td>
                  <td>{file.validRows}/{file.totalRows}</td>
                  <td><ValidationBadge status={file.status} errors={file.errorRows} /></td>
                  <td><DuplicateBadge duplicateRows={file.duplicateRows} /></td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(file.importFileId)) next.delete(file.importFileId);
                        else next.add(file.importFileId);
                        setSelectedIds(next);
                      }}
                    >
                      {selectedIds.has(file.importFileId) ? "Ignorar" : "Incluir"}
                    </button>
                  </td>
                </tr>
                {open === file.fileName && (
                  <tr>
                    <td colSpan={9}>
                      <ParserCard file={file} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ParserCard({ file }: { file: SmartFile }) {
  return (
    <div className="grid gap-3 bg-slate-50 p-4 text-sm md:grid-cols-3">
      <div>
        <p className="text-xs font-semibold text-muted">Parser utilizado</p>
        <strong>{file.parser}</strong>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted">Colunas encontradas</p>
        <p>{file.columns.join(", ") || "-"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted">Possíveis problemas</p>
        <p>{file.issues.length ? file.issues.join("; ") : "Nenhum problema crítico"}</p>
      </div>
    </div>
  );
}

export function ReviewDrawer({ rows, setRows, page, setPage }: {
  rows: Array<Record<string, unknown> & { fileName: string; institution: string; sourceType: string; parser: string; duplicateRows: number; errorRows: number }>;
  setRows: (rows: Array<Record<string, unknown> & { fileName: string; institution: string; sourceType: string; parser: string; duplicateRows: number; errorRows: number }>) => void;
  page: number;
  setPage: (page: number) => void;
}) {
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);

  function update(index: number, field: string, value: string) {
    const absolute = (page - 1) * pageSize + index;
    setRows(rows.map((row, rowIndex) => rowIndex === absolute ? { ...row, [field]: value } : row));
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Revisão dos lançamentos</h3>
          <p className="text-xs text-muted">Prévia paginada para suportar lotes grandes.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>{page}/{pages}</span>
          <button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <table className="app-table min-w-[1280px]">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Categoria</th>
              <th>Conta/Cartão</th>
              <th>Instituição</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Confiança</th>
              <th>Duplicado</th>
              <th>Erro</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={`${row.fileName}-${index}`}>
                <td><input className="field" value={String(row.data_movimentacao || row.data_compra || "")} onChange={(event) => update(index, row.data_movimentacao ? "data_movimentacao" : "data_compra", event.target.value)} /></td>
                <td><input className="field" value={String(row.descricao || "")} onChange={(event) => update(index, "descricao", event.target.value)} /></td>
                <td><input className="field" value={String(row.valor || "")} onChange={(event) => update(index, "valor", event.target.value)} /></td>
                <td><input className="field" value={String(row.categoria || "")} onChange={(event) => update(index, "categoria", event.target.value)} placeholder="Automática" /></td>
                <td><input className="field" value={String(row.cartao || row.origem_dados || "")} onChange={(event) => update(index, row.cartao ? "cartao" : "origem_dados", event.target.value)} /></td>
                <td>{row.institution}</td>
                <td>{row.sourceType}</td>
                <td><ValidationBadge status="Preview" errors={row.errorRows} /></td>
                <td>{row.categoria ? "95%" : "Revisão recomendada"}</td>
                <td><DuplicateBadge duplicateRows={row.duplicateRows} /></td>
                <td>{row.errorRows ? "Verificar arquivo" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ValidationBadge({ status, errors }: { status: string; errors: number }) {
  if (status === "Error" || errors > 0) return <Badge tone="red"><XCircle size={12} /> Erro</Badge>;
  if (status === "Imported") return <Badge tone="green"><CheckCircle2 size={12} /> Importado</Badge>;
  return <Badge tone="blue"><Clock size={12} /> Revisão</Badge>;
}

export function DuplicateBadge({ duplicateRows }: { duplicateRows: number }) {
  if (duplicateRows > 0) return <Badge tone="red">Duplicado possível</Badge>;
  return <Badge tone="green">Novo registro</Badge>;
}

export function ImportHistory({ history }: { history: HistoryItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <h3 className="mb-4 text-base font-semibold text-ink">Histórico de Importações</h3>
      <div className="overflow-auto">
        <table className="app-table min-w-[980px]">
          <thead>
            <tr>
              <th>Data</th>
              <th>Arquivos</th>
              <th>Instituição</th>
              <th>Quantidade</th>
              <th>Importados</th>
              <th>Duplicados</th>
              <th>Erros</th>
              <th>Usuário</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((batch) => (
              <>
                <tr key={batch.id} onClick={() => setOpen(open === batch.id ? null : batch.id)} className="cursor-pointer">
                  <td>{formatDate(batch.date)}</td>
                  <td>{batch.files}</td>
                  <td>{batch.institutions}</td>
                  <td>{batch.quantity}</td>
                  <td>{batch.imported}</td>
                  <td>{batch.duplicates}</td>
                  <td>{batch.errors}</td>
                  <td>{batch.user}</td>
                  <td>{batch.status}</td>
                </tr>
                {open === batch.id && (
                  <tr>
                    <td colSpan={9}><BatchDetails batch={batch} /></td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BatchDetails({ batch }: { batch: HistoryItem }) {
  return (
    <div className="grid gap-2 bg-slate-50 p-4">
      {batch.details.map((file) => (
        <div key={file.id} className="rounded-md border border-line bg-white p-3 text-sm">
          <strong>{file.fileName}</strong>
          <p className="mt-1 text-muted">{file.institution} · {file.sourceType} · {file.parserName}</p>
          <p className="mt-1">Linhas: {file.totalRows} · Importados: {file.validRows} · Duplicados: {file.duplicateRows} · Erros: {file.errorRows}</p>
          {file.errorMessage && <p className="mt-1 text-rose-700">{file.errorMessage}</p>}
        </div>
      ))}
    </div>
  );
}

function FinalReport({ result, goToEntries, importAgain }: { result: ImportResult; goToEntries: () => void; importAgain: () => void }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
      <div className="flex items-center gap-2 font-semibold">
        <CheckCircle2 size={18} />
        Importação concluída
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <span>Arquivos: {result.finalReport.files}</span>
        <span>Lançamentos criados: {result.finalReport.created}</span>
        <span>Duplicados: {result.finalReport.duplicates}</span>
        <span>Erros: {result.finalReport.errors}</span>
        <span>Valor movimentado: {brl.format(result.finalReport.totalAmount)}</span>
        <span>Receitas: {brl.format(result.finalReport.revenues)}</span>
        <span>Despesas: {brl.format(result.finalReport.expenses)}</span>
        <span>Tempo: {result.finalReport.processingTimeMs} ms</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-secondary" onClick={goToEntries}>Ir para Lançamentos</button>
        <button className="btn-secondary" onClick={importAgain}>Importar novamente</button>
      </div>
    </section>
  );
}

function flattenRows(files: SmartFile[]) {
  return files.flatMap((file) =>
    file.rows.map((row) => ({
      ...row,
      fileName: file.fileName,
      institution: file.institution,
      sourceType: file.sourceType,
      parser: file.parser,
      duplicateRows: file.duplicateRows,
      errorRows: file.errorRows
    }))
  );
}
