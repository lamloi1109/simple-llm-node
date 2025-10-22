import { Ollama } from "ollama";
import { OllamaEmbeddings } from "@langchain/ollama";

const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const model = process.env.OLLAMA_MODEL || "qwen3:4b";
const embedModel = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text-v1.5-multimodal";

const client = new Ollama({ host: baseUrl });

export async function ollamaChat(prompt) {
  const res = await client.chat({
    model,
    messages: [{ role: "user", content: prompt }]
  });
  return res?.message?.content ?? "";
}

export const ollamaEmb = new OllamaEmbeddings({
  baseUrl,
  model: embedModel
});
