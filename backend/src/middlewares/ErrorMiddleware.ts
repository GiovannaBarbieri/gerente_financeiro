import type express from "express";

export function errorMiddleware(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error(error);
  res.status(500).json({ message: error instanceof Error ? error.message : "Erro inesperado" });
}
