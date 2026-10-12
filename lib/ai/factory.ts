import {
  GeminiProvider,
  MockAIProvider,
  OpenAIProvider,
  OpenRouterProvider,
} from "@/lib/ai/providers";
import type { AIProvider } from "@/lib/ai/types";

export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? "").toLowerCase();
  if (
    (name === "openrouter" || !name) &&
    (process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY)
  ) {
    return new OpenRouterProvider();
  }
  if (name === "openai" && process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (name === "gemini" && process.env.GEMINI_API_KEY) return new GeminiProvider();
  if (process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY) {
    return new OpenRouterProvider();
  }
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (process.env.GEMINI_API_KEY) return new GeminiProvider();
  return new MockAIProvider();
}
