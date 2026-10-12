import type { ProductOffer } from "@/lib/offers/types";

export interface PriceInputs {
  price: number;
  shipping?: number;
  mandatoryFees?: number;
  guaranteedDiscount?: number;
  conditionalDiscount?: number;
}

export interface NormalizedPrice {
  listedPrice: number;
  shipping: number;
  mandatoryFees: number;
  guaranteedDiscount: number;
  conditionalDiscount: number;
  finalPrice: number;
  potentialPrice?: number;
}

export function calculatePayablePrice(input: PriceInputs): NormalizedPrice {
  const listedPrice = roundMoney(input.price);
  const shipping = roundMoney(input.shipping ?? 0);
  const mandatoryFees = roundMoney(input.mandatoryFees ?? 0);
  const guaranteedDiscount = roundMoney(input.guaranteedDiscount ?? 0);
  const conditionalDiscount = roundMoney(input.conditionalDiscount ?? 0);

  const finalPrice = roundMoney(
    listedPrice + shipping + mandatoryFees - guaranteedDiscount,
  );

  const potentialPrice =
    conditionalDiscount > 0
      ? roundMoney(finalPrice - conditionalDiscount)
      : undefined;

  return {
    listedPrice,
    shipping,
    mandatoryFees,
    guaranteedDiscount,
    conditionalDiscount,
    finalPrice,
    potentialPrice,
  };
}

export function applyPriceToOffer(
  offer: Omit<ProductOffer, "finalPrice" | "potentialPrice"> &
    Partial<Pick<ProductOffer, "finalPrice" | "potentialPrice">>,
): ProductOffer {
  const calc = calculatePayablePrice(offer);
  return {
    ...offer,
    finalPrice: calc.finalPrice,
    potentialPrice: calc.potentialPrice,
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatInr(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
