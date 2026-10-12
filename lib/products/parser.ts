import { z } from "zod";
import { getAIProvider } from "@/lib/ai/factory";
import { SHOPPING_SYSTEM_PROMPT } from "@/lib/ai/types";
import type { ProductSearchQuery } from "@/lib/offers/types";
import { extractGeneration, extractStorage } from "@/lib/products/matcher";
import { logMetric } from "@/lib/observability/metrics";

const parsedSchema = z.object({
  brand: z.string().optional(),
  product: z.string().optional(),
  variant: z.string().optional(),
  category: z.string().optional(),
  modelNumber: z.string().optional(),
  budgetMax: z.number().optional(),
  specs: z
    .object({
      ram: z.string().optional(),
      storage: z.string().optional(),
      cpu: z.string().optional(),
      gpu: z.string().optional(),
      display: z.string().optional(),
      color: z.string().optional(),
      generation: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
});

export async function parseSearchQuery(rawQuery: string): Promise<ProductSearchQuery> {
  const heuristic = heuristicParse(rawQuery);
  const started = Date.now();
  try {
    const ai = getAIProvider();
    const content = await ai.complete({
      json: true,
      messages: [
        { role: "system", content: SHOPPING_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract a normalized product search JSON from: ${rawQuery}`,
        },
      ],
    });
    logMetric("ai.latency", { latencyMs: Date.now() - started });
    const parsed = parsedSchema.safeParse(JSON.parse(stripFence(content)));
    if (!parsed.success) return heuristic;
    return {
      rawQuery,
      brand: parsed.data.brand ?? heuristic.brand,
      product: parsed.data.product ?? heuristic.product,
      variant: parsed.data.variant ?? heuristic.variant,
      category: parsed.data.category ?? heuristic.category,
      modelNumber: parsed.data.modelNumber,
      budgetMax: parsed.data.budgetMax ?? heuristic.budgetMax,
      currency: "INR",
      specs: {
        ...heuristic.specs,
        ...parsed.data.specs,
        storage:
          parsed.data.specs?.storage ??
          parsed.data.variant ??
          heuristic.specs?.storage,
      },
    };
  } catch {
    logMetric("ai.latency", { latencyMs: Date.now() - started, failed: true });
    return heuristic;
  }
}

export function heuristicParse(rawQuery: string): ProductSearchQuery {
  const budget = rawQuery.match(/under\s*₹?\s*([\d,]+)/i);
  const storage = extractStorage(rawQuery);
  const generation = extractGeneration(rawQuery);
  let brand: string | undefined;
  let product: string | undefined;
  let category: string | undefined;

  if (/iphone/i.test(rawQuery)) {
    brand = "Apple";
    product = `iPhone ${generation ?? ""}`.trim();
    category = "smartphone";
  } else if (/samsung|galaxy/i.test(rawQuery)) {
    brand = "Samsung";
    product = "Galaxy S26 Ultra";
    category = "smartphone";
  } else if (/sony|xm6/i.test(rawQuery)) {
    brand = "Sony";
    product = "WH-1000XM6";
    category = "headphones";
  } else if (/laptop|gaming/i.test(rawQuery)) {
    category = "gaming laptop";
  } else if (/nike|shoe/i.test(rawQuery)) {
    brand = "Nike";
    category = "footwear";
  }

  return {
    rawQuery,
    brand,
    product,
    variant: storage,
    category,
    budgetMax: budget ? Number(budget[1].replace(/,/g, "")) : undefined,
    currency: "INR",
    specs: {
      storage,
      generation,
      condition: "new",
    },
  };
}

function stripFence(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}
