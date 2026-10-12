import type { ProductOffer } from "@/lib/offers/types";

const SUSPICIOUS_DOMAINS = [
  "cheap-deals.example",
  "superlowprice.invalid",
  "bit.ly",
];

export function analyzeDealSafety(
  offer: ProductOffer,
  peers: ProductOffer[],
): ProductOffer {
  const flags: string[] = [];
  const verifiedPeers = peers.filter(
    (p) => p.verificationStatus !== "suspicious" && p.id !== offer.id,
  );
  const median = medianPrice(verifiedPeers.map((p) => p.finalPrice));

  if (median && offer.finalPrice < median * 0.7) {
    flags.push("Abnormally low price compared with other verified offers");
  }

  if (!offer.seller || offer.sellerKnown === false) {
    flags.push("Unknown seller");
  }

  if (!offer.warranty) {
    flags.push("Missing warranty information");
  }

  if (offer.specs?.condition === "used" || offer.specs?.condition === "refurbished") {
    flags.push("Used or refurbished listing");
  }

  if (offer.specs?.region && offer.specs.region.toUpperCase() !== "IN") {
    flags.push("Different regional variant");
  }

  try {
    const host = new URL(offer.url).hostname;
    if (SUSPICIOUS_DOMAINS.some((d) => host.includes(d))) {
      flags.push("Suspicious domain");
    }
  } catch {
    flags.push("Invalid product URL");
  }

  if ((offer.sellerRating ?? 5) < 3.5) {
    flags.push("Poor seller reputation");
  }

  if (offer.specs?.includedAccessories?.includes("missing")) {
    flags.push("Missing accessories");
  }

  const suspicious = flags.length >= 2 || flags.some((f) => f.includes("Abnormally"));
  return {
    ...offer,
    verificationStatus: suspicious
      ? "suspicious"
      : offer.verificationStatus === "unverified"
        ? "unverified"
        : "verified",
    safetyFlags: flags,
    safetySummary: suspicious
      ? "This listing is significantly cheaper or less trustworthy than other verified offers. Check seller, warranty and return policy before purchasing."
      : undefined,
  };
}

export function medianPrice(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
