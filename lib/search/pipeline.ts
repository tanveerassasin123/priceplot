import type { ProductOffer, ProductSearchQuery, SearchPipelineResult } from "@/lib/offers/types";
import { USER_ERRORS } from "@/lib/offers/types";
import { cacheGet, cacheSet, searchCacheTtlMs } from "@/lib/cache/memory";
import { parseSearchQuery } from "@/lib/products/parser";
import { matchOfferToQuery } from "@/lib/products/matcher";
import { analyzeDealSafety } from "@/lib/sellers/analyzer";
import { rankDeals } from "@/lib/ranking/engine";
import { searchAllProviders } from "@/lib/providers/manager";
import { isDemoMode } from "@/lib/providers/registry";
import { findAlternatives } from "@/lib/products/alternatives";
import { logMetric } from "@/lib/observability/metrics";
import { persistSearchResult } from "@/lib/database/repos";

export async function runSearch(rawQuery: string): Promise<SearchPipelineResult> {
  const started = Date.now();
  const cacheKey = `search:${rawQuery.trim().toLowerCase()}`;
  const cached = cacheGet<SearchPipelineResult>(cacheKey);
  if (cached) {
    logMetric("search.cache_hit", { q: rawQuery });
    return cached;
  }

  const query = await parseSearchQuery(rawQuery);
  const providerResults = await searchAllProviders(query);
  const warnings: string[] = [];
  if (providerResults.some((p) => p.status !== "ok")) {
    warnings.push(USER_ERRORS.SOME_STORES);
  }

  const pooled = providerResults.flatMap((p) => p.offers);
  let matched = pooled.filter((offer) => matchOfferToQuery(offer, query).matched);

  if (query.budgetMax) {
    matched = matched.filter((o) => o.finalPrice <= query.budgetMax!);
  }

  if (matched.length === 0 && query.category) {
    matched = pooled.filter((o) => {
      if (query.budgetMax && o.finalPrice > query.budgetMax) return false;
      return true;
    });
    if (query.product) {
      warnings.push(USER_ERRORS.VARIANT_UNVERIFIED);
    }
  }

  const withSafety = matched.map((o) => analyzeDealSafety(o, matched));
  const ranked = rankDeals(withSafety);
  const alternatives = await findAlternatives(query, withSafety);

  const result: SearchPipelineResult = {
    query,
    demoMode: isDemoMode(),
    providers: providerResults.map((p) => ({
      ...p,
      offers: [],
    })),
    offers: withSafety,
    ranked,
    alternatives,
    warnings: withSafety.length === 0 ? [USER_ERRORS.NO_PRODUCTS, ...warnings] : warnings,
    metrics: {
      searchDurationMs: Date.now() - started,
      offersFound: withSafety.length,
      aiLatencyMs: 0,
    },
  };

  logMetric("search.completed", result.metrics);
  cacheSet(cacheKey, result, searchCacheTtlMs());
  await persistSearchResult(result);
  return result;
}

export function pickProductOffers(
  offers: ProductOffer[],
  productId: string,
): ProductOffer[] {
  return offers.filter((o) => o.productId === productId);
}

export function summarizeQuery(query: ProductSearchQuery): string {
  return [query.brand, query.product, query.variant].filter(Boolean).join(" ") || query.rawQuery;
}
