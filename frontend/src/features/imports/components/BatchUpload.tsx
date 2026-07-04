import { useMemo, useState } from "react";
import { Files, Trash2, UploadCloud } from "lucide-react";
import { api, brl } from "@shared/services/api";

type BatchFile = {
  importFileId: string;
  fileName: string;
  sourceType: string;
  institution: string;
  accountName: string;
  parser: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
  errorMessage?: string;
};

type BatchPreview = {
  importBatchId: string;
  files: BatchFile[];
  summary: {
    totalFiles: number;
    validFiles: number;
    errorFiles: number;
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    errorRows: number;
  };
};

type BatchResult = {
  summary: {
    totalFilesProcessed: number;
    totalImportedRecords: number;
    totalDuplicates: number;
    totalErrors: number;
    totalEntradas: number;
    totalSaidas: number;
    totalComprasCartao: number;
    pendingReview: number;
  };
};

export function BatchUpload({ onDone }: { onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BatchResult | null>(null);
  const [status, setStatus] = useState("");

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((file) => /\.(csv|xlsx|xls)$/i.test(file.name));
    setFiles((current) => {
      const key = new Set(current.map((file) => `${file.name}-${file.size}`));
      return [...current, ...incoming.filter((file) => !key.has(`${file.name}-${file.size}`))];
    });
    setPreview(null);
    setResult(null);
    setStatus("");
  }

  async function previewBatch() {
    if (!files.length) return;
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    setStatus("Analisando lote...");
    const response = await api.post("/imports/batch/preview", data);
    setPreview(response.data);
    setSelectedIds(new Set(response.data.files.filter((file: BatchFile) => file.status !== "Error").map((file: BatchFile) => file.importFileId)));
    setStatus("Previa consolidada pronta.");
  }

  async function confirmBatch() {
    if (!preview) {
      setStatus("Primeiro clique em Pre-visualizar lote. Depois revise a tabela de auditoria e confirme a importacao.");
      return;
    }
    if (!selectedIds.size) {
      setStatus("Nenhum arquivo valido selecionado para importar.");
      return;
    }
    setStatus("Importando lote...");
    const response = await api.post("/imports/batch/confirm", {
      importBatchId: preview.importBatchId,
      selectedFileIds: Array.from(selectedIds)
    });
    setResult(response.data);
    setStatus("Importacao em lote concluida.");
    setFiles([]);
    setPreview(null);
    onDone();
  }

  function removeLocalFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreview(null);
  }

  function removePreviewFile(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  const selectedCount = selectedIds.size;
  const totals = useMemo(() => preview?.summary, [preview]);

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Files size={18} />
        Importacao em lote
      </div>

      <div
        className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-muted"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto mb-2" size={22} />
        <p>Arraste arquivos CSV/XLSX aqui ou selecione varios arquivos.</p>
        <input className="mt-3 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm" type="file" accept=".csv,.xlsx,.xls" multiple onChange={(event) => addFiles(event.target.files)} />
      </div>

      {files.length > 0 && !preview && (
        <div className="mt-4 grid gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
              <span className="truncate">{file.name}</span>
              <button className="rounded-md p-1 text-rose-700 hover:bg-rose-50" onClick={() => removeLocalFile(index)} title="Remover">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={!files.length} onClick={previewBatch}>
          Pre-visualizar lote
        </button>
        <button className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!files.length && !preview} onClick={confirmBatch}>
          {preview ? `Importar selecionados (${selectedCount})` : "Importar selecionados"}
        </button>
      </div>

      {status && <p className="mt-3 text-xs text-muted">{status}</p>}
      {!preview && files.length > 0 && (
        <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Passo 1: clique em Pre-visualizar lote para auditar os arquivos. Passo 2: confirme em Importar selecionados.
        </p>
      )}

      {preview && totals && (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 rounded-md border border-line bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-4">
            <span>Arquivos: {totals.totalFiles}</span>
            <span>Registros validos: {totals.validRows}</span>
            <span>Duplicados: {totals.duplicateRows}</span>
            <span>Erros: {totals.errorRows}</span>
          </div>
          <div className="overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-3">Arquivo</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Instituicao</th>
                  <th className="px-3 py-3">Parser</th>
                  <th className="px-3 py-3">Linhas</th>
                  <th className="px-3 py-3">Validos</th>
                  <th className="px-3 py-3">Duplicados</th>
                  <th className="px-3 py-3">Erros</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.files.map((file) => (
                  <tr key={file.importFileId || file.fileName}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{file.fileName}</div>
                      {file.errorMessage && <div className="text-xs text-rose-700">{file.errorMessage}</div>}
                    </td>
                    <td className="px-3 py-3">{file.sourceType}</td>
                    <td className="px-3 py-3">{file.institution}</td>
                    <td className="px-3 py-3">{file.parser}</td>
                    <td className="px-3 py-3">{file.totalRows}</td>
                    <td className="px-3 py-3">{file.validRows}</td>
                    <td className="px-3 py-3">{file.duplicateRows}</td>
                    <td className="px-3 py-3">{file.errorRows}</td>
                    <td className="px-3 py-3">{selectedIds.has(file.importFileId) ? file.status : "Removido"}</td>
                    <td className="px-3 py-3 text-right">
                      {selectedIds.has(file.importFileId) && (
                        <button className="rounded-md p-1 text-rose-700 hover:bg-rose-50" onClick={() => removePreviewFile(file.importFileId)} title="Remover do lote">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 sm:grid-cols-4">
          <span>Arquivos processados: {result.summary.totalFilesProcessed}</span>
          <span>Importados: {result.summary.totalImportedRecords}</span>
          <span>Duplicados: {result.summary.totalDuplicates}</span>
          <span>Erros: {result.summary.totalErrors}</span>
          <span>Entradas: {brl.format(result.summary.totalEntradas)}</span>
          <span>Saidas: {brl.format(result.summary.totalSaidas)}</span>
          <span>Cartao: {brl.format(result.summary.totalComprasCartao)}</span>
          <span>Revisao: {result.summary.pendingReview}</span>
        </div>
      )}
    </section>
  );
}
