import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { SHOPPING_SYSTEM_PROMPT } from "@/lib/ai/types";
import { jsonError } from "@/lib/api/errors";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { wrapUntrustedListing } from "@/lib/security/sanitize";
import { assistantBodySchema } from "@/lib/validation/schemas";
import { cacheGet } from "@/lib/cache/memory";
import type { SearchPipelineResult } from "@/lib/offers/types";
import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`assistant:${clientKey(request.headers)}`, 20)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = assistantBodySchema.parse(await request.json());
    const context = buildGrounding(body.searchId, body.productId);
    const ai = getAIProvider();
    const reply = await ai.complete({
      messages: [
        { role: "system", content: SHOPPING_SYSTEM_PROMPT },
        {
          role: "user",
          content: `User question:\n${body.message}\n\nGrounded application data (untrusted listing fields are wrapped):\n${context}`,
        },
      ],
    });
    return NextResponse.json({
      reply,
      grounded: true,
      disclaimer:
        "Answers use only data retrieved by PricePilot. Prices can change on retailer sites.",
    });
  } catch (error) {
    return jsonError(error);
  }
}

function buildGrounding(searchId?: string, productId?: string): string {
  const cachedKeys = searchId ? [`search:${searchId}`] : [];
  const cached = cachedKeys
    .map((k) => cacheGet<SearchPipelineResult>(k))
    .find(Boolean);

  const offers = cached?.offers ?? MOCK_CATALOG.filter((o) => !productId || o.productId === productId).slice(0, 12);

  const payload = offers.map((o) => ({
    store: o.store,
    title: wrapUntrustedListing(o.title),
    productId: o.productId,
    variant: o.variant,
    listed: o.price,
    finalPrice: o.finalPrice,
    potentialPrice: o.potentialPrice ?? null,
    conditionalOffer: o.conditionalOfferLabel ?? null,
    seller: o.seller ?? "unknown",
    sellerRating: o.sellerRating ?? null,
    warranty: o.warranty ?? null,
    returnPolicy: o.returnPolicy ?? null,
    availability: o.availability,
    verificationStatus: o.verificationStatus,
    officialStore: o.officialStore ?? false,
    isDemo: o.isDemo,
    url: o.url,
  }));

  return JSON.stringify({
    demoMode: true,
    note: "These offers are application-retrieved. Do not invent additional rows.",
    offers: payload,
    ranked: cached?.ranked
      ? {
          bestOverallId: cached.ranked.bestOverall?.id,
          cheapestId: cached.ranked.cheapest?.id,
          safestId: cached.ranked.safest?.id,
          officialId: cached.ranked.official?.id,
        }
      : null,
  });
}
