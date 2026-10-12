import type {
  ProductOffer,
  RankedDeals,
  ScoredOffer,
} from "@/lib/offers/types";

const WEIGHTS = {
  price: 0.4,
  seller: 0.2,
  warranty: 0.15,
  returns: 0.1,
  availability: 0.05,
  shipping: 0.05,
  authenticity: 0.05,
};

export function rankDeals(offers: ProductOffer[]): RankedDeals {
  const eligible = offers.filter(
    (o) =>
      o.verificationStatus !== "suspicious" &&
      o.availability !== "out_of_stock",
  );
  const scored = offers.map((offer) => scoreOffer(offer, eligible)).sort(
    (a, b) => b.score - a.score,
  );

  const safe = scored.filter((s) => s.offer.verificationStatus !== "suspicious");

  const cheapest = [...safe]
    .filter((s) => s.offer.availability !== "out_of_stock")
    .sort((a, b) => a.offer.finalPrice - b.offer.finalPrice)[0]?.offer;

  const safest = [...safe].sort((a, b) => {
    const trustA = (a.breakdown.seller ?? 0) + (a.breakdown.authenticity ?? 0);
    const trustB = (b.breakdown.seller ?? 0) + (b.breakdown.authenticity ?? 0);
    return trustB - trustA;
  })[0]?.offer;

  const official = safe.find((s) => s.offer.officialStore)?.offer;

  return {
    bestOverall: safe[0]?.offer,
    cheapest,
    safest,
    official,
    ranked: scored,
  };
}

export function scoreOffer(
  offer: ProductOffer,
  cohort: ProductOffer[],
): ScoredOffer {
  const prices = cohort.map((o) => o.finalPrice);
  const min = Math.min(...prices, offer.finalPrice);
  const max = Math.max(...prices, offer.finalPrice);
  const priceScore =
    max === min ? 1 : 1 - (offer.finalPrice - min) / (max - min);

  const sellerScore = offer.officialStore
    ? 1
    : Math.min(1, (offer.sellerRating ?? (offer.sellerKnown ? 3.5 : 2)) / 5);

  const warrantyScore = offer.warranty ? 1 : 0.2;
  const returnScore = offer.returnPolicy ? 1 : 0.3;
  const availabilityScore =
    offer.availability === "in_stock"
      ? 1
      : offer.availability === "limited"
        ? 0.7
        : offer.availability === "preorder"
          ? 0.5
          : 0;
  const shippingScore = offer.shipping === 0 ? 1 : 0.5;
  const authenticityScore =
    offer.verificationStatus === "verified"
      ? 1
      : offer.verificationStatus === "unverified"
        ? 0.4
        : 0.05;

  const breakdown = {
    price: priceScore * WEIGHTS.price,
    seller: sellerScore * WEIGHTS.seller,
    warranty: warrantyScore * WEIGHTS.warranty,
    returns: returnScore * WEIGHTS.returns,
    availability: availabilityScore * WEIGHTS.availability,
    shipping: shippingScore * WEIGHTS.shipping,
    authenticity: authenticityScore * WEIGHTS.authenticity,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { offer, score, breakdown };
}
