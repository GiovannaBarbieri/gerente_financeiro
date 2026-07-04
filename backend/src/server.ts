import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import { importsRouter } from "./routes/ImportRoutes.js";
import { financeRouter } from "./routes/FinanceRoutes.js";
import { aiRouter } from "./routes/AiRoutes.js";
import { errorMiddleware } from "./middlewares/ErrorMiddleware.js";

fs.mkdirSync("uploads", { recursive: true });

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/imports", importsRouter);
app.use("/api/ai", aiRouter);
app.use("/api", financeRouter);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`API em http://localhost:${port}`);
});
