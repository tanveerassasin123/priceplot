import type { ProductOffer, ProductSearchQuery } from "@/lib/offers/types";
import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";
import { matchOfferToQuery } from "@/lib/products/matcher";

export async function findAlternatives(
  query: ProductSearchQuery,
  current: ProductOffer[],
): Promise<ProductOffer[]> {
  const cheapestCurrent = Math.min(...current.map((o) => o.finalPrice), Infinity);
  const seen = new Set<string>();
  const alts: ProductOffer[] = [];

  for (const offer of MOCK_CATALOG) {
    if (current.some((c) => c.productId === offer.productId)) continue;
    if (query.budgetMax && offer.finalPrice > query.budgetMax) continue;
    if (offer.finalPrice >= cheapestCurrent) continue;
    const sameCategory =
      (query.category && categoryOf(offer) === query.category) ||
      (query.category && categoryOf(offer).includes(query.category.split(" ")[0] ?? ""));
    const similarBrand = query.brand && offer.brand === query.brand;
    if (!sameCategory && !similarBrand) continue;
    if (seen.has(offer.productId)) continue;
    if (matchOfferToQuery(offer, query).matched) continue;
    seen.add(offer.productId);
    alts.push(offer);
  }

  return alts.sort((a, b) => a.finalPrice - b.finalPrice).slice(0, 3);
}

function categoryOf(offer: ProductOffer): string {
  const hay = `${offer.title} ${offer.model}`.toLowerCase();
  if (/iphone|galaxy|phone/.test(hay)) return "smartphone";
  if (/laptop|tuf|loq|nitro/.test(hay)) return "gaming laptop";
  if (/wh-|headphone/.test(hay)) return "headphones";
  if (/nike|pegasus/.test(hay)) return "footwear";
  return "other";
}
