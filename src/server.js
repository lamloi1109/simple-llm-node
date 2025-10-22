import "dotenv/config";
import express from "express";
import { ingestAll, retrieveTopK, buildPrompt } from "./rag.js";
import { ollamaChat, ollamaEmb } from "./providers/ollama.js";
import { bedrockChat, bedrockEmb } from "./providers/bedrock.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8080);
const DEFAULT_PROVIDER = process.env.PROVIDER || "ollama";
const USE_RAG = String(process.env.USE_RAG || "true").toLowerCase() === "true";

function pickProvider(p) {
  const provider = (p || DEFAULT_PROVIDER).toLowerCase();
  if (provider === "bedrock") return { chat: bedrockChat, emb: bedrockEmb, name: "bedrock" };
  return { chat: ollamaChat, emb: ollamaEmb, name: "ollama" };
}

app.get("/health", (req, res) => res.json({ ok: true, provider: DEFAULT_PROVIDER }));

app.post("/ingest", async (req, res) => {
  try {
    const { provider } = pickProvider(req.query.provider);
    const { count } = await ingestAll(pickProvider(req.query.provider).emb);
    res.json({ ok: true, provider, chunks: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const { question, top_k, use_rag } = req.body || {};
    if (!question) return res.status(400).json({ ok: false, error: "Missing 'question'" });

    const { chat, emb, name } = pickProvider(req.query.provider);
    const doRag = use_rag ?? USE_RAG;

    let contexts = [];
    if (doRag) {
      contexts = await retrieveTopK(question, emb, Number(top_k || 4));
    }

    const prompt = buildPrompt(question, contexts);
    const answer = await chat(prompt);

    res.json({
      ok: true,
      provider: name,
      rag_used: Boolean(doRag),
      retrieved: contexts.map(c => ({ id: c.id, score: Number(c.score.toFixed(4)) })),
      answer
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const args = process.argv.slice(2);
if (args.includes("--ingest")) {
  (async () => {
    const { emb } = pickProvider(process.env.PROVIDER);
    const { count } = await ingestAll(emb);
    console.log(`Ingested chunks: ${count}`);
    process.exit(0);
  })();
} else {
  app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
}
