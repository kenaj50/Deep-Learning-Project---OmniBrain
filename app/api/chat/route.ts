import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { captureRawInbox, omniBrainTools } from "@/lib/ai/tools";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { buildFreeModelContext, FREE_MODEL_ACTIONS_INSTRUCTIONS } from "@/lib/ai/free-model";
import { fetchCompanyContexts } from "@/lib/supabase/queries";

export const maxDuration = 120;

type AiPreset = { provider: "anthropic" | "openrouter" | "ollama"; modelId: string; supportsTools: boolean };

const PRESETS: Record<string, AiPreset> = {
  // Modele komercyjne (natywny tool calling)
  "claude-sonnet":    { provider: "anthropic",  modelId: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6", supportsTools: true },
  "claude-haiku":     { provider: "anthropic",  modelId: "claude-haiku-4-5-20251001",                        supportsTools: true },
  // Darmowe OpenRouter — Gemma 4 ma natywny function calling
  "gemini-flash":     { provider: "openrouter", modelId: "google/gemma-4-31b-it:free",                       supportsTools: true  },
  "llama-70b":        { provider: "openrouter", modelId: "meta-llama/llama-3.3-70b-instruct:free",           supportsTools: false },
  "deepseek-r1":      { provider: "openrouter", modelId: "qwen/qwen3-coder:free",                            supportsTools: false },
  "nemotron-120b":    { provider: "openrouter", modelId: "nvidia/nemotron-3-super-120b-a12b:free",           supportsTools: false },
  "nemotron-550b":    { provider: "openrouter", modelId: "nvidia/nemotron-3-ultra-550b-a55b:free",           supportsTools: false },
  "ollama":           { provider: "ollama",     modelId: process.env.OLLAMA_MODEL ?? "llama3.2",             supportsTools: false },
};


export async function POST(req: Request) {
  const { messages, aiMode = "claude-sonnet" }: { messages: UIMessage[]; aiMode?: string } = await req.json();

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastText =
    lastUser?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") ?? "";
  if (lastText.trim()) await captureRawInbox(lastText);

  const presetKey = aiMode === "claude" ? "claude-sonnet" : aiMode;
  const preset = PRESETS[presetKey] ?? PRESETS["claude-sonnet"];

  let model;

  if (preset.provider === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
    try {
      const ping = await fetch(`${baseUrl.replace("/v1", "")}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (!ping.ok) throw new Error("not reachable");
    } catch {
      return NextResponse.json(
        { error: "Ollama nie jest uruchomiona lokalnie. Uruchom: `ollama serve` i spróbuj ponownie." },
        { status: 503 },
      );
    }
    const ollama = createOpenAI({ baseURL: baseUrl, apiKey: "ollama" });
    model = ollama(preset.modelId);

  } else if (preset.provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Brak OPENROUTER_API_KEY. Dodaj go w Vercel → Settings → Environment Variables. Klucz pobierz na openrouter.ai (darmowe, bez karty)." },
        { status: 503 },
      );
    }
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      headers: { "HTTP-Referer": "https://omnibrain.app", "X-Title": "OmniBrain" },
    });
    model = openrouter(preset.modelId);

  } else {
    model = anthropic(preset.modelId);
  }

  // Always fetch company contexts to enrich AI knowledge
  const companyContexts = await fetchCompanyContexts().catch(() => ({}));

  let systemPrompt: string;
  if (preset.supportsTools) {
    systemPrompt = getSystemPrompt(companyContexts);
  } else {
    const [context] = await Promise.allSettled([buildFreeModelContext()]);
    const ctxText = context.status === "fulfilled" ? context.value : "(błąd pobierania kontekstu)";
    systemPrompt = `${getSystemPrompt(companyContexts)}\n\n${ctxText}\n\n${FREE_MODEL_ACTIONS_INSTRUCTIONS}`;
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    ...(preset.supportsTools
      ? { tools: omniBrainTools, stopWhen: stepCountIs(15) }
      : {}),
  });

  return result.toUIMessageStreamResponse();
}
