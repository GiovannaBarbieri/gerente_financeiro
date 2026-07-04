import { Router } from "express";
import { z } from "zod";
import { chatWithAI, getAIContext, getAISettings, getConversation, listConversations, updateAISettings } from "../services/ai/AiEngine.js";
import { listAIRecommendations } from "../services/ai/AiRecommendationService.js";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res, next) => {
  try {
    const schema = z.object({
      conversationId: z.string().optional(),
      message: z.string().min(1)
    });
    res.json(await chatWithAI(schema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

aiRouter.get("/history", async (req, res, next) => {
  try {
    const id = String(req.query.conversationId || "");
    res.json(id ? await getConversation(id) : await listConversations());
  } catch (error) {
    next(error);
  }
});

aiRouter.get("/context", async (_req, res, next) => {
  try {
    res.json(await getAIContext());
  } catch (error) {
    next(error);
  }
});

aiRouter.get("/recommendations", async (_req, res, next) => {
  try {
    res.json(await listAIRecommendations());
  } catch (error) {
    next(error);
  }
});

aiRouter.get("/settings", async (_req, res, next) => {
  try {
    res.json(await getAISettings());
  } catch (error) {
    next(error);
  }
});

aiRouter.patch("/settings", async (req, res, next) => {
  try {
    res.json(await updateAISettings(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});
