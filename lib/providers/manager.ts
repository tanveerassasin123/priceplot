import { USER_ERRORS, type ProductSearchQuery, type ProviderSearchResult } from "@/lib/offers/types";
import { getProviders } from "@/lib/providers/registry";
import { logMetric } from "@/lib/observability/metrics";

export async function searchAllProviders(
  query: ProductSearchQuery,
): Promise<ProviderSearchResult[]> {
  const providers = getProviders();
  const results = await Promise.all(
    providers.map(async (provider) => {
      const started = Date.now();
      try {
        const offers = await provider.searchProducts(query);
        const latencyMs = Date.now() - started;
        logMetric("provider.response_time", { provider: provider.name, latencyMs });
        return {
          name: provider.name,
          status: "ok" as const,
          offers,
          latencyMs,
        };
      } catch (error) {
        const latencyMs = Date.now() - started;
        const message =
          error instanceof Error ? error.message : USER_ERRORS.PROVIDER_UNAVAILABLE;
        logMetric("provider.failure", { provider: provider.name, message });
        return {
          name: provider.name,
          status: "unavailable" as const,
          message: USER_ERRORS.PROVIDER_UNAVAILABLE,
          offers: [],
          latencyMs,
        };
      }
    }),
  );
  return results;
}
