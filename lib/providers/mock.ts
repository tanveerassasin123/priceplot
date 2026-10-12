import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";
import type { ProductSearchProvider } from "@/lib/providers/types";
import { matchOfferToQuery } from "@/lib/products/matcher";
import type { ProductOffer, ProductSearchQuery } from "@/lib/offers/types";

export class MockProvider implements ProductSearchProvider {
  name = "MockProvider";

  async searchProducts(query: ProductSearchQuery): Promise<ProductOffer[]> {
    await delay(80);
    return MOCK_CATALOG.filter((offer) => {
      if (query.budgetMax && offer.finalPrice > query.budgetMax) return false;
      const match = matchOfferToQuery(offer, query);
      if (match.matched) return true;
      if (query.category && offerFitsCategory(offer, query.category)) {
        if (query.product || query.variant) return false;
        return true;
      }
      const hay = `${offer.title} ${offer.brand} ${offer.model} ${offer.variant}`.toLowerCase();
      return query.rawQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2 && !["under", "best", "the"].includes(t))
        .every((t) => hay.includes(t.replace("₹", "").replace(",", "")));
    }).map((o) => ({ ...o, lastChecked: new Date().toISOString() }));
  }

  async getProductDetails(url: string): Promise<ProductOffer | null> {
    return MOCK_CATALOG.find((o) => o.url === url) ?? null;
  }
}

function offerFitsCategory(offer: ProductOffer, category: string): boolean {
  const c = category.toLowerCase();
  const hay = `${offer.title} ${offer.model}`.toLowerCase();
  if (c.includes("laptop") || c.includes("gaming")) {
    return /laptop|tuf|loq|nitro|gaming/.test(hay);
  }
  if (c.includes("phone") || c.includes("smartphone")) {
    return /iphone|galaxy|pixel|phone/.test(hay);
  }
  if (c.includes("headphone") || c.includes("audio")) {
    return /sony|wh-|headphone|buds/.test(hay);
  }
  if (c.includes("shoe") || c.includes("footwear")) {
    return /nike|pegasus|shoe/.test(hay);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
