import { Router } from "express";
import multer from "multer";
import { importAccountFile, importCardFile, previewAccountFile, previewCardFile } from "../services/ImportService.js";
import { fromMonthInput } from "../shared/utils/format.js";
import { confirmBatchImport, previewBatchImport } from "../services/BatchImportService.js";
import { confirmSmartImport, listImportHistory, previewSmartImport } from "../services/ImportManagerService.js";

const upload = multer({ dest: "uploads/" });
export const importsRouter = Router();

importsRouter.post("/smart/preview", upload.array("files", 50), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) return res.status(400).json({ message: "Nenhum arquivo enviado." });
    res.json(await previewSmartImport(files));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/smart/confirm", async (req, res, next) => {
  try {
    const importBatchId = String(req.body?.importBatchId || "");
    const selectedFileIds = Array.isArray(req.body?.selectedFileIds) ? req.body.selectedFileIds.map(String) : undefined;
    if (!importBatchId) return res.status(400).json({ message: "Lote nao informado." });
    res.json(await confirmSmartImport(importBatchId, selectedFileIds));
  } catch (error) {
    next(error);
  }
});

importsRouter.get("/smart/history", async (_req, res, next) => {
  try {
    res.json(await listImportHistory());
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/batch/preview", upload.array("files", 30), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) return res.status(400).json({ message: "Nenhum arquivo enviado." });
    res.json(await previewBatchImport(files));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/batch/confirm", async (req, res, next) => {
  try {
    const importBatchId = String(req.body?.importBatchId || "");
    const selectedFileIds = Array.isArray(req.body?.selectedFileIds) ? req.body.selectedFileIds.map(String) : undefined;
    if (!importBatchId) return res.status(400).json({ message: "Lote nao informado." });
    res.json(await confirmBatchImport(importBatchId, selectedFileIds));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/account/preview", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo nao enviado." });
    res.json(await previewAccountFile(req.file, req.body.institution, req.body.accountName));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/account", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo nao enviado." });
    res.json(await importAccountFile(req.file, req.body.institution, req.body.accountName));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/card/preview", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo nao enviado." });
    res.json(await previewCardFile(req.file, fromMonthInput(req.body.invoiceMonth), req.body.institution, req.body.accountName));
  } catch (error) {
    next(error);
  }
});

importsRouter.post("/card", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Arquivo nao enviado." });
    res.json(await importCardFile(req.file, fromMonthInput(req.body.invoiceMonth), req.body.institution, req.body.accountName));
  } catch (error) {
    next(error);
  }
});
