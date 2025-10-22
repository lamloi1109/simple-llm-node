import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockEmbeddings } from "@langchain/aws";

const region = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1";
const modelId =
  process.env.BEDROCK_CHAT_MODEL ||
  process.env.BEDROCK_MODEL ||
  "anthropic.claude-3-haiku-20240307-v1:0";
const embedModelId =
  process.env.BEDROCK_EMBED_MODEL ||
  process.env.BEDROCK_EMBEDDING_MODEL ||
  "amazon.titan-embed-text-v1";

const maxTokens = Number(process.env.BEDROCK_MAX_TOKENS || 512);
const hasValidMaxTokens = Number.isFinite(maxTokens) && maxTokens > 0;

const temperatureEnv = process.env.BEDROCK_TEMPERATURE;
const parsedTemperature = temperatureEnv !== undefined ? Number(temperatureEnv) : undefined;
const hasTemperature = parsedTemperature !== undefined && !Number.isNaN(parsedTemperature);

const systemPrompt = process.env.BEDROCK_SYSTEM_PROMPT;

const profile = process.env.BEDROCK_PROFILE || process.env.AWS_PROFILE;
if (profile && !process.env.AWS_SDK_LOAD_CONFIG) {
  process.env.AWS_SDK_LOAD_CONFIG = "1";
}

const baseClientConfig = { region };

const brt = new BedrockRuntimeClient(baseClientConfig);

function buildRequestBody(prompt) {
  if (modelId.startsWith("anthropic.")) {
    const body = {
      anthropic_version: "bedrock-2023-05-31",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
    };

    if (hasValidMaxTokens) body.max_tokens = maxTokens;
    if (systemPrompt) body.system = systemPrompt;
    if (hasTemperature) body.temperature = parsedTemperature;

    return body;
  }

  const generationConfig = {};
  if (hasValidMaxTokens) generationConfig.maxTokenCount = maxTokens;
  if (hasTemperature) generationConfig.temperature = parsedTemperature;

  const body = { inputText: prompt };
  if (Object.keys(generationConfig).length > 0) {
    body.textGenerationConfig = generationConfig;
  }

  return body;
}

function parseResponse(json) {
  if (modelId.startsWith("anthropic.")) {
    return json?.content?.[0]?.text ?? "";
  }

  const result =
    json?.outputText ??
    json?.completion ??
    json?.generation ??
    json?.results?.[0]?.outputText ??
    json?.results?.[0]?.text ??
    json?.results?.[0]?.completion ??
    json?.results?.[0]?.generated_text ??
    json?.outputs?.[0]?.text ??
    "";

  return typeof result === "string" ? result : "";
}

export async function bedrockChat(prompt) {
  try {
    const body = buildRequestBody(prompt);

    const cmd = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(body),
      contentType: "application/json",
      accept: "application/json"
    });

    const raw = await brt.send(cmd);
    const json = JSON.parse(Buffer.from(raw.body).toString("utf8"));
    const text = parseResponse(json);
    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Bedrock chat invocation failed: ${message}`);
  }
}

export const bedrockEmb = new BedrockEmbeddings({
  region,
  model: embedModelId,
  clientOptions: baseClientConfig
});
