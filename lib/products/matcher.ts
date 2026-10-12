import type {
  MatchResult,
  ProductOffer,
  ProductSearchQuery,
  ProductSpecs,
} from "@/lib/offers/types";

function norm(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value?: string): Set<string> {
  return new Set(norm(value).split(" ").filter(Boolean));
}

function identifierMatch(
  a?: string,
  b?: string,
): "exact" | "mismatch" | "none" {
  if (!a || !b) return "none";
  return norm(a) === norm(b) ? "exact" : "mismatch";
}

function specEqual(
  a?: string,
  b?: string,
): "equal" | "mismatch" | "none" {
  if (!a || !b) return "none";
  return norm(a) === norm(b) ? "equal" : "mismatch";
}

export function matchOfferToQuery(
  offer: ProductOffer,
  query: ProductSearchQuery,
): MatchResult {
  const reasons: string[] = [];
  let confidence = 0.4;

  const ids = [
    identifierMatch(offer.identifiers?.gtin, query.identifiers?.gtin),
    identifierMatch(offer.identifiers?.ean, query.identifiers?.ean),
    identifierMatch(offer.identifiers?.upc, query.identifiers?.upc),
    identifierMatch(offer.identifiers?.sku, query.identifiers?.sku),
    identifierMatch(offer.identifiers?.modelNumber, query.identifiers?.modelNumber),
  ];

  if (ids.includes("mismatch")) {
    return {
      matched: false,
      confidence: 0,
      reasons: ["Identifier mismatch"],
    };
  }
  if (ids.includes("exact")) {
    confidence = 0.98;
    reasons.push("Exact product identifier");
  }

  if (query.brand && offer.brand && norm(query.brand) !== norm(offer.brand)) {
    return { matched: false, confidence: 0, reasons: ["Brand mismatch"] };
  }
  if (query.brand && offer.brand) {
    confidence = Math.max(confidence, 0.7);
    reasons.push("Brand match");
  }

  const queryName = [query.product, query.variant].filter(Boolean).join(" ");
  const offerName = [offer.title, offer.model, offer.variant]
    .filter(Boolean)
    .join(" ");

  if (query.product && !norm(offerName).includes(norm(query.product))) {
    const overlap = jaccard(tokens(query.product), tokens(offer.title));
    if (overlap < 0.35) {
      return {
        matched: false,
        confidence: overlap,
        reasons: ["Product name mismatch"],
      };
    }
  }

  const specChecks: Array<[keyof ProductSpecs, string]> = [
    ["storage", "Storage"],
    ["ram", "RAM"],
    ["cpu", "CPU"],
    ["gpu", "GPU"],
    ["display", "Display"],
    ["color", "Color"],
    ["generation", "Generation"],
    ["region", "Region"],
  ];

  for (const [key, label] of specChecks) {
    const result = specEqual(query.specs?.[key]?.toString(), offer.specs?.[key]?.toString());
    if (result === "mismatch") {
      return {
        matched: false,
        confidence: 0.1,
        reasons: [`${label} mismatch`],
      };
    }
    if (result === "equal") {
      confidence += 0.05;
      reasons.push(`${label} match`);
    }
  }

  if (
    query.specs?.condition &&
    offer.specs?.condition &&
    query.specs.condition !== "unknown" &&
    offer.specs.condition !== query.specs.condition
  ) {
    return {
      matched: false,
      confidence: 0.15,
      reasons: ["Condition mismatch"],
    };
  }

  if (query.variant && offer.variant && norm(query.variant) !== norm(offer.variant)) {
    const qStorage = extractStorage(query.variant);
    const oStorage = extractStorage(offer.variant);
    if (qStorage && oStorage && qStorage !== oStorage) {
      return {
        matched: false,
        confidence: 0.2,
        reasons: ["Variant storage mismatch"],
      };
    }
    if (norm(query.variant) !== norm(offer.variant)) {
      return {
        matched: false,
        confidence: 0.25,
        reasons: ["Variant mismatch"],
      };
    }
  }

  if (query.variant && !offer.variant) {
    const fromTitle = extractStorage(offer.title);
    const fromQuery = extractStorage(query.variant);
    if (fromTitle && fromQuery && fromTitle !== fromQuery) {
      return {
        matched: false,
        confidence: 0.2,
        reasons: ["Storage in title does not match requested variant"],
      };
    }
  }

  confidence = Math.min(0.99, confidence);
  const matched = confidence >= 0.55;
  if (matched && reasons.length === 0) reasons.push("Heuristic name match");
  return { matched, confidence, reasons };
}

export function extractStorage(text?: string): string | undefined {
  if (!text) return undefined;
  const match = text.toUpperCase().match(/(\d+)\s*(GB|TB)/);
  if (!match) return undefined;
  return `${match[1]}${match[2]}`;
}

export function extractGeneration(text?: string): string | undefined {
  if (!text) return undefined;
  const iphone = text.match(/iphone\s*(\d+)/i);
  if (iphone) return iphone[1];
  const gen = text.match(/(\d+)(st|nd|rd|th)\s*gen/i);
  if (gen) return gen[1];
  return undefined;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / new Set([...a, ...b]).size;
}
