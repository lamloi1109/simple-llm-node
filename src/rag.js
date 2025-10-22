import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { cosineSimilarity } from "./util.js";

const STORAGE = path.resolve("storage/embeddings.json");

function listDocs(dir = "docs") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    // .filter(f => f.endsWith(".md"))
    .map(f => path.join(dir, f));
}

export async function ingestAll(embeddings) {
  const files = listDocs();
  if (files.length === 0) return { count: 0 };

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120
  });

  const items = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const chunks = await splitter.splitText(text);
    const vecs = await embeddings.embedDocuments(chunks);
    for (let i = 0; i < chunks.length; i++) {
      items.push({ id: `${path.basename(file)}::${i}`, text: chunks[i], v: vecs[i] });
    }
  }
  fs.mkdirSync(path.dirname(STORAGE), { recursive: true });
  fs.writeFileSync(STORAGE, JSON.stringify(items, null, 2), "utf8");
  return { count: items.length };
}

export function loadIndex() {
  if (!fs.existsSync(STORAGE)) return [];
  return JSON.parse(fs.readFileSync(STORAGE, "utf8"));
}

export async function retrieveTopK(query, embeddings, k = 4) {
  const index = loadIndex();
  if (index.length === 0) return [];
  const qv = await embeddings.embedQuery(query);
  const scored = index.map(it => ({ ...it, score: cosineSimilarity(qv, it.v) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function buildPrompt(question, contexts = []) {
  const ctx = contexts.map((c, i) => `[[DOC ${i + 1}]]\n${c.text}`).join("\n\n");
  return `Bạn là trợ lý giàu kinh nghiệm của Công Ty Quang Điện Kung Long. Hãy hỗ trợ khách hàng tốt nhất có thể.

${ctx ? `---- NGỮ CẢNH ----\n${ctx}\n\n---- CÂU HỎI ----\n` : ""}${question}.`;
}
