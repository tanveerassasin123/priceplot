export type Availability =
  | "in_stock"
  | "limited"
  | "out_of_stock"
  | "preorder";

export type VerificationStatus = "verified" | "unverified" | "suspicious";

export type ProductCondition = "new" | "refurbished" | "used" | "unknown";

export interface ProductSearchQuery {
  rawQuery: string;
  brand?: string;
  product?: string;
  variant?: string;
  category?: string;
  modelNumber?: string;
  identifiers?: ProductIdentifiers;
  specs?: ProductSpecs;
  budgetMax?: number;
  currency?: string;
  region?: string;
}

export interface ProductIdentifiers {
  sku?: string;
  gtin?: string;
  ean?: string;
  upc?: string;
  modelNumber?: string;
}

export interface ProductSpecs {
  ram?: string;
  storage?: string;
  cpu?: string;
  gpu?: string;
  display?: string;
  color?: string;
  quantity?: number;
  generation?: string;
  region?: string;
  condition?: ProductCondition;
  includedAccessories?: string[];
}

export interface ProductOffer {
  id: string;
  productId: string;
  store: string;
  title: string;
  brand?: string;
  model?: string;
  variant?: string;
  identifiers?: ProductIdentifiers;
  specs?: ProductSpecs;
  price: number;
  currency: string;
  shipping: number;
  mandatoryFees: number;
  guaranteedDiscount: number;
  conditionalDiscount?: number;
  conditionalOfferLabel?: string;
  finalPrice: number;
  potentialPrice?: number;
  availability: Availability;
  seller?: string;
  sellerRating?: number;
  sellerKnown?: boolean;
  officialStore?: boolean;
  warranty?: string;
  returnPolicy?: string;
  url: string;
  source: string;
  lastChecked: string;
  verificationStatus: VerificationStatus;
  isDemo: boolean;
  safetyFlags?: string[];
  safetySummary?: string;
}

export interface MatchResult {
  matched: boolean;
  confidence: number;
  reasons: string[];
}

export interface RankedDeals {
  bestOverall?: ProductOffer;
  cheapest?: ProductOffer;
  safest?: ProductOffer;
  official?: ProductOffer;
  ranked: ScoredOffer[];
}

export interface ScoredOffer {
  offer: ProductOffer;
  score: number;
  breakdown: Record<string, number>;
}

export interface ProviderSearchResult {
  name: string;
  status: "ok" | "unavailable" | "error";
  message?: string;
  offers: ProductOffer[];
  latencyMs: number;
}

export interface SearchPipelineResult {
  query: ProductSearchQuery;
  demoMode: boolean;
  providers: ProviderSearchResult[];
  offers: ProductOffer[];
  ranked: RankedDeals;
  alternatives: ProductOffer[];
  warnings: string[];
  metrics: {
    searchDurationMs: number;
    offersFound: number;
    aiLatencyMs: number;
  };
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const USER_ERRORS = {
  NO_PRODUCTS: "No products found.",
  SOME_STORES: "Some stores could not be checked.",
  VARIANT_UNVERIFIED: "Product variant could not be verified.",
  PRICE_UNAVAILABLE: "Price information is currently unavailable.",
  PROVIDER_UNAVAILABLE: "Provider temporarily unavailable.",
} as const;
