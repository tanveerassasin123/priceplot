import type { AICompletionRequest, AIProvider, ImageIdentifyResult } from "@/lib/ai/types";

const JSON_HINTS = [
  {
    test: /iphone\s*17.*128/i,
    value: {
      brand: "Apple",
      product: "iPhone 17",
      variant: "128GB",
      category: "smartphone",
      specs: { storage: "128GB", generation: "17" },
    },
  },
  {
    test: /iphone\s*17/i,
    value: {
      brand: "Apple",
      product: "iPhone 17",
      variant: "256GB",
      category: "smartphone",
      specs: { storage: "256GB", generation: "17" },
    },
  },
  {
    test: /galaxy\s*s26/i,
    value: {
      brand: "Samsung",
      product: "Galaxy S26 Ultra",
      variant: "256GB",
      category: "smartphone",
    },
  },
  {
    test: /wh-?1000xm6|sony/i,
    value: {
      brand: "Sony",
      product: "WH-1000XM6",
      category: "headphones",
    },
  },
  {
    test: /gaming laptop|laptop/i,
    value: {
      category: "gaming laptop",
      product: undefined,
    },
  },
  {
    test: /nike/i,
    value: {
      brand: "Nike",
      product: "shoes",
      category: "footwear",
    },
  },
];

export class MockAIProvider implements AIProvider {
  name = "mock-ai";

  async complete(request: AICompletionRequest): Promise<string> {
    const last = request.messages.at(-1)?.content ?? "";
    if (request.json || last.includes("extract") || last.includes("JSON")) {
      const hit = JSON_HINTS.find((h) => h.test.test(last));
      const budget = last.match(/under\s*₹?\s*([\d,]+)/i);
      return JSON.stringify({
        ...(hit?.value ?? { product: last.slice(0, 80) }),
        budgetMax: budget ? Number(budget[1].replace(/,/g, "")) : undefined,
      });
    }
    return [
      "Based only on the offers supplied in this request:",
      last.includes("safest")
        ? "Prefer the official or highest-rated verified seller. I will not invent store names beyond the JSON you provided."
        : "Compare guaranteed payable prices, not conditional bank offers. I cannot invent prices that are missing from the supplied data.",
      "If a field is missing from the JSON, I couldn't verify that information.",
    ].join(" ");
  }

  async identifyImage(): Promise<ImageIdentifyResult> {
    return {
      brand: "Sony",
      product: "WH-1000XM6",
      model: "WH-1000XM6",
      category: "headphones",
      variant: "Black",
      confidence: 0.62,
    };
  }
}

export class OpenRouterProvider implements AIProvider {
  name = "openrouter";

  async complete(request: AICompletionRequest): Promise<string> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not set");
    const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3-haiku";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "PricePilot",
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        response_format: request.json ? { type: "json_object" } : undefined,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${res.status}): ${errText}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async identifyImage(imageBase64: string, mimeType: string): Promise<ImageIdentifyResult> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not set");
    const model =
      process.env.OPENROUTER_VISION_MODEL ??
      process.env.OPENROUTER_MODEL ??
      "anthropic/claude-3-haiku";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "PricePilot",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify the product in this image. Return a JSON object with: { brand?: string, product?: string, model?: string, category?: string, variant?: string, confidence: number (0.0 to 1.0) } without markdown code fences.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenRouter image identification failed (${res.status}): ${errText}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        product: "Unknown Product",
        confidence: 0.3,
      };
    }
  }
}

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async complete(request: AICompletionRequest): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: request.messages,
        response_format: request.json ? { type: "json_object" } : undefined,
      }),
    });
    if (!res.ok) throw new Error("OpenAI request failed");
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async complete(request: AICompletionRequest): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: request.messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          systemInstruction: {
            parts: [
              {
                text: request.messages.find((m) => m.role === "system")?.content ?? "",
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) throw new Error("Gemini request failed");
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
}
