import "./env.ts";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aiEnabled, reviewAnswer, reviewCoding } from "./ai.ts";
import { HINT_LANGS } from "../src/lib/i18n.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 5173);
// Local only by default: the AI endpoints spend your API key. Set HOST=0.0.0.0 to open it up on purpose.
const host = process.env.HOST ?? "127.0.0.1";

const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/api/status", (_req, res) => {
  res.json({ ai: aiEnabled });
});

type Fields = Record<string, { type: "string" | "number"; max?: number; optional?: boolean; oneOf?: readonly string[] }>;
const hintLang = { type: "string", optional: true, oneOf: Object.keys(HINT_LANGS) } as const;

/** Checks the body shape and size, so a bad request gets a 400 and can't run up a big bill. */
function validate(body: unknown, fields: Fields): string | null {
  if (!body || typeof body !== "object") return "Expected a JSON object";
  const b = body as Record<string, unknown>;
  for (const [name, f] of Object.entries(fields)) {
    const v = b[name];
    if (v === undefined && f.optional) continue;
    if (typeof v !== f.type) return `“${name}” must be a ${f.type}`;
    if (typeof v === "string" && v.length > (f.max ?? 2000)) return `“${name}” is too long`;
    if (f.oneOf && !f.oneOf.includes(v as string)) return `“${name}” is not supported`;
  }
  return null;
}

// A simple per-IP limit: plenty for one person practicing, useless for abuse.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

function handle(fields: Fields, fn: (body: any) => Promise<unknown>): express.RequestHandler {
  return async (req, res) => {
    const invalid = validate(req.body, fields);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }
    if (!aiEnabled) {
      res.status(503).json({ error: "AI feedback is not configured. Set ANTHROPIC_API_KEY." });
      return;
    }
    if (rateLimited(req.ip ?? "")) {
      res.status(429).json({ error: "Too many requests. Wait a minute and try again." });
      return;
    }
    try {
      res.json(await fn(req.body));
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: "The AI review failed. Try again in a moment." });
    }
  };
}

app.post(
  "/api/review/answer",
  handle(
    {
      question: { type: "string" },
      category: { type: "string", max: 50 },
      answer: { type: "string", max: 8000 },
      durationSec: { type: "number", optional: true },
      hintLang,
    },
    reviewAnswer,
  ),
);
app.post(
  "/api/review/coding",
  handle(
    {
      title: { type: "string", max: 200 },
      statement: { type: "string" },
      code: { type: "string", max: 10000 },
      explanation: { type: "string", max: 8000 },
      testsPassed: { type: "number" },
      testsTotal: { type: "number" },
      hintLang,
    },
    reviewCoding,
  ),
);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});
// Malformed JSON and other errors: a short JSON message, no stack traces.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status ?? 500).json({ error: err.status && err.status < 500 ? "Bad request" : "Server error" });
});

if (isProd) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

app.listen(port, host, () => {
  console.log(`Interview English running at http://localhost:${port}`);
  console.log(aiEnabled ? "AI feedback: on" : "AI feedback: off (offline feedback only)");
});
