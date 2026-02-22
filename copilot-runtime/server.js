import express from "express";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNodeExpressEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { config } from "dotenv";

// Load environment variables from .env
config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── OpenAI client ──────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── CopilotKit Runtime ─────────────────────────────────────────
const serviceAdapter = new OpenAIAdapter({ openai, model: "gpt-4o-mini" });
const runtime = new CopilotRuntime();

// ── Endpoint: /copilotkit  ─────────────────────────────────────
// Mount at root — the Yoga server inside handles /copilotkit routing
const copilotHandler = copilotRuntimeNodeExpressEndpoint({
  endpoint: "/copilotkit",
  runtime,
  serviceAdapter,
});

app.use(copilotHandler);

// ── Health-check ───────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "copilot-runtime" });
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Copilot Runtime listening on http://localhost:${PORT}`);
  console.log(`   Endpoint → http://localhost:${PORT}/copilotkit`);
});
