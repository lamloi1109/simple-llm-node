import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockEmbeddings } from "@langchain/aws";

const region = process.env.AWS_REGION || "us-east-1";
const modelId = process.env.BEDROCK_MODEL || "anthropic.claude-3-haiku-20240307-v1:0";
const embedModelId = process.env.BEDROCK_EMBED_MODEL || "amazon.titan-embed-text-v1";

const brt = new BedrockRuntimeClient({ region });

export async function bedrockChat(prompt) {
  // Ví dụ format Anthropic Messages
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 512,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
  };

  const cmd = new InvokeModelCommand({
    modelId,
    body: JSON.stringify(body),
    contentType: "application/json",
    accept: "application/json"
  });

  const raw = await brt.send(cmd);
  const json = JSON.parse(Buffer.from(raw.body).toString("utf8"));
  const text = json?.content?.[0]?.text ?? "";
  return text;
}

export const bedrockEmb = new BedrockEmbeddings({
  region,
  model: embedModelId
});
