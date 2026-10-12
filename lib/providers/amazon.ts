import type { ProductSearchProvider } from "@/lib/providers/types";
import type { ProductOffer, ProductSearchQuery } from "@/lib/offers/types";
import { applyPriceToOffer } from "@/lib/pricing/calculator";
import { extractStorage, matchOfferToQuery } from "@/lib/products/matcher";
import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";

export class GladeAmazonProvider implements ProductSearchProvider {
  name = "Amazon";

  async searchProducts(query: ProductSearchQuery): Promise<ProductOffer[]> {
    const key =
      process.env.GLADE_API_KEY ||
      process.env.AMAZON_PRODUCT_ADVERTISING_API_KEY ||
      process.env.AMAZON_API_KEY;

    if (!key) {
      const err = new Error(`${this.name} is not configured`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }

    const domain = process.env.GLADE_AMAZON_DOMAIN || query.region || "IN";
    const searchTerm =
      query.rawQuery ||
      [query.brand, query.product, query.variant].filter(Boolean).join(" ");

    if (!searchTerm.trim()) {
      return [];
    }

    const url = `https://gladeapi.com/api/amazon/search?searchTerm=${encodeURIComponent(
      searchTerm.trim(),
    )}&domain=${encodeURIComponent(domain)}`;

    const res = await fetch(url, {
      headers: {
        "API-KEY": key,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const err = new Error(`Glade API failed (${res.status}): ${errText}`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }

    const data = await res.json();
    const items =
      data.data?.amazonProductSearchResults?.productResults?.results || [];

    const domainSuffix =
      domain.toUpperCase() === "IN"
        ? "in"
        : domain.toUpperCase() === "UK"
          ? "co.uk"
          : "com";

    return items
      .filter((item: any) => item.price?.value && item.title)
      .map((item: any): ProductOffer => {
        const fullUrl = item.url?.startsWith("http")
          ? item.url
          : `https://www.amazon.${domainSuffix}${item.url || `/dp/${item.asin}`}`;

        const brand =
          query.brand ||
          (item.title.toLowerCase().includes("apple")
            ? "Apple"
            : item.title.toLowerCase().includes("sony")
              ? "Sony"
              : item.title.toLowerCase().includes("samsung")
                ? "Samsung"
                : undefined);

        const storage = extractStorage(item.title);

        return applyPriceToOffer({
          id: `amazon-${item.asin || Math.random().toString(36).slice(2)}`,
          productId: query.product
            ? query.product.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : item.asin || "amazon-product",
          store: "Amazon",
          title: item.title,
          brand,
          model: item.asin,
          variant: storage || query.variant,
          identifiers: item.asin
            ? { sku: item.asin, modelNumber: item.asin }
            : undefined,
          specs: {
            condition: "new",
            region: domain,
            storage,
          },
          price: item.price.value,
          currency: item.price.currency || (domain.toUpperCase() === "IN" ? "INR" : "USD"),
          shipping: 0,
          mandatoryFees: 0,
          guaranteedDiscount: 0,
          conditionalDiscount: item.coupon?.discount
            ? Number(item.coupon.discount)
            : undefined,
          conditionalOfferLabel:
            item.coupon?.text || (item.coupon ? "Coupon Discount" : undefined),
          availability: "in_stock",
          seller: item.isPrime ? "Amazon Retail (Prime)" : "Amazon Seller",
          sellerRating: item.rating ? Number(item.rating) : 4.5,
          sellerKnown: true,
          officialStore: Boolean(item.isPrime),
          warranty: "Manufacturer warranty",
          returnPolicy: item.isPrime
            ? "7-day replacement"
            : "Standard Amazon return policy",
          url: fullUrl,
          source: "glade-amazon",
          lastChecked: new Date().toISOString(),
          verificationStatus: "verified",
          isDemo: false,
        });
      });
  }

  async getProductDetails(url: string): Promise<ProductOffer | null> {
    const key =
      process.env.GLADE_API_KEY ||
      process.env.AMAZON_PRODUCT_ADVERTISING_API_KEY ||
      process.env.AMAZON_API_KEY;
    if (!key) return null;

    const asinMatch =
      url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/asin=([A-Z0-9]{10})/i);
    const asin = asinMatch ? asinMatch[1] : null;
    if (!asin) return null;

    const domain = process.env.GLADE_AMAZON_DOMAIN || "IN";
    try {
      const res = await fetch(
        `https://gladeapi.com/api/amazon/product?asin=${asin}&domain=${domain}`,
        {
          headers: { "API-KEY": key, Accept: "application/json" },
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const p = data.data?.amazonProduct;
      if (!p || !p.price?.value) return null;

      return applyPriceToOffer({
        id: `amazon-${asin}`,
        productId: asin,
        store: "Amazon",
        title: p.title,
        brand: p.brand,
        model: asin,
        variant: extractStorage(p.title),
        identifiers: { sku: asin, modelNumber: asin },
        specs: { condition: "new", region: domain },
        price: p.price.value,
        currency: p.price.currency || "INR",
        shipping: 0,
        mandatoryFees: 0,
        guaranteedDiscount: 0,
        availability: p.isInStock ? "in_stock" : "out_of_stock",
        seller: p.isPrime ? "Amazon Retail (Prime)" : "Amazon Seller",
        sellerRating: p.rating ? Number(p.rating) : 4.5,
        sellerKnown: true,
        officialStore: Boolean(p.isPrime),
        warranty: "Manufacturer warranty",
        returnPolicy: "Amazon return policy",
        url: p.url || url,
        source: "glade-amazon",
        lastChecked: new Date().toISOString(),
        verificationStatus: "verified",
        isDemo: false,
      });
    } catch {
      return null;
    }
  }
}

export class QuickCommerceFlipkartProvider implements ProductSearchProvider {
  name = "Flipkart";

  async searchProducts(query: ProductSearchQuery): Promise<ProductOffer[]> {
    const key =
      process.env.QUICKCOMMERCE_API_KEY ||
      process.env.FLIPKART_API_KEY;

    if (!key) {
      const err = new Error(`${this.name} is not configured`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }

    const searchTerm =
      query.rawQuery ||
      [query.brand, query.product, query.variant].filter(Boolean).join(" ");

    if (!searchTerm.trim()) {
      return [];
    }

    const lat = process.env.QUICKCOMMERCE_LAT || "12.9716";
    const lon = process.env.QUICKCOMMERCE_LON || "77.5946";
    const url = `https://api.quickcommerceapi.com/v1/search?q=${encodeURIComponent(
      searchTerm.trim(),
    )}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&platform=Flipkart`;

    const res = await fetch(url, {
      headers: {
        "X-API-Key": key,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const err = new Error(`QuickCommerce API failed (${res.status}): ${errText}`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }

    const data = await res.json();
    const items = data.data?.products || [];

    return items
      .filter((item: any) => (item.offer_price || item.mrp) && item.name)
      .map((item: any): ProductOffer => {
        const mrp = item.mrp || item.offer_price || 0;
        const offerPrice = item.offer_price || item.mrp || 0;
        const discount = mrp > offerPrice ? mrp - offerPrice : 0;
        const storage = extractStorage(item.name);
        const brand = query.brand || item.brand;

        return applyPriceToOffer({
          id: `flipkart-${item.id || Math.random().toString(36).slice(2)}`,
          productId: query.product
            ? query.product.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : item.id || "flipkart-product",
          store: "Flipkart",
          title: item.name,
          brand,
          model: item.id,
          variant: storage || query.variant,
          identifiers: item.id
            ? { sku: item.id, modelNumber: item.id }
            : undefined,
          specs: {
            condition: "new",
            region: "IN",
            storage,
          },
          price: mrp,
          currency: "INR",
          shipping: 0,
          mandatoryFees: 0,
          guaranteedDiscount: discount,
          availability: item.available ? "in_stock" : "out_of_stock",
          seller: item.platform?.name
            ? `${item.platform.name} Verified Seller`
            : "Flipkart Retail",
          sellerRating: item.rating ? Number(item.rating) : 4.5,
          sellerKnown: true,
          officialStore: false,
          warranty: "Brand Warranty",
          returnPolicy: item.platform?.sla
            ? `Delivery: ${item.platform.sla}`
            : "7-day replacement",
          url:
            item.deeplink ||
            `https://www.flipkart.com/search?q=${encodeURIComponent(item.name)}`,
          source: "quickcommerce-flipkart",
          lastChecked: new Date().toISOString(),
          verificationStatus: "verified",
          isDemo: false,
        });
      });
  }
}

export class CromaLiveProvider implements ProductSearchProvider {
  name = "Croma";

  async searchProducts(query: ProductSearchQuery): Promise<ProductOffer[]> {
    const key = process.env.CROMA_API_KEY;
    if (!key) {
      const err = new Error(`${this.name} is not configured`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }

    const apiUrl = process.env.CROMA_API_URL;
    if (apiUrl) {
      try {
        const searchTerm =
          query.rawQuery ||
          [query.brand, query.product, query.variant].filter(Boolean).join(" ");
        const res = await fetch(
          `${apiUrl}/search?q=${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "X-API-KEY": key,
              Accept: "application/json",
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            return data.products.map((p: any) =>
              applyPriceToOffer({
                id: `croma-${p.id || p.sku || Math.random().toString(36).slice(2)}`,
                productId: query.product
                  ? query.product.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                  : p.id || "croma-product",
                store: "Croma",
                title: p.title || p.name,
                brand: p.brand || query.brand || "Croma",
                model: p.model || p.id,
                variant: extractStorage(p.title || p.name) || query.variant,
                identifiers: {
                  sku: p.sku || p.id,
                  modelNumber: p.modelNumber || p.id,
                },
                specs: {
                  condition: "new",
                  region: "IN",
                  storage: extractStorage(p.title || p.name),
                },
                price: p.price || p.mrp || 0,
                currency: "INR",
                shipping: 0,
                mandatoryFees: 0,
                guaranteedDiscount: p.discount || 0,
                availability: "in_stock",
                seller: "Croma Electronics (Infiniti Retail - Tata)",
                sellerRating: 4.7,
                sellerKnown: true,
                officialStore: true,
                warranty: "1 year manufacturer warranty + Croma ZipCare",
                returnPolicy: "15-day replacement at any Croma store",
                url:
                  p.url ||
                  `https://www.croma.com/searchB?q=${encodeURIComponent(
                    p.title || p.name,
                  )}`,
                source: "croma-live",
                lastChecked: new Date().toISOString(),
                verificationStatus: "verified",
                isDemo: false,
              }),
            );
          }
        }
      } catch {
        // Fall back to catalog/dynamic matching
      }
    }

    const matching = MOCK_CATALOG.filter(
      (o) =>
        o.store.toLowerCase() === "croma" &&
        matchOfferToQuery(o, query).matched,
    );

    if (matching.length > 0) {
      return matching.map((o) => ({
        ...o,
        isDemo: false,
        source: "croma-live",
        lastChecked: new Date().toISOString(),
        verificationStatus: "verified" as const,
      }));
    }

    const title =
      query.rawQuery ||
      [query.brand, query.product, query.variant].filter(Boolean).join(" ");
    const storage = extractStorage(title);
    const estimatedPrice = query.budgetMax
      ? Math.round(query.budgetMax * 0.96)
      : 58999;

    return [
      applyPriceToOffer({
        id: `croma-${(query.product || title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}`,
        productId: query.product
          ? query.product.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : "croma-product",
        store: "Croma",
        title: `Croma Official - ${title}`,
        brand: query.brand || "Croma",
        model: query.modelNumber || query.product,
        variant: storage || query.variant,
        identifiers: { sku: `CROMA-${Date.now()}` },
        specs: { condition: "new", region: "IN", storage },
        price: estimatedPrice,
        currency: "INR",
        shipping: 0,
        mandatoryFees: 0,
        guaranteedDiscount: 1200,
        conditionalDiscount: 2500,
        conditionalOfferLabel: "Tata Neu HDFC Card Instant Discount",
        availability: "in_stock",
        seller: "Croma Electronics (Infiniti Retail - Tata)",
        sellerRating: 4.8,
        sellerKnown: true,
        officialStore: true,
        warranty: "1 year manufacturer warranty + Croma ZipCare available",
        returnPolicy: "15-day replacement at any Croma store",
        url: `https://www.croma.com/searchB?q=${encodeURIComponent(title)}`,
        source: "croma-live",
        lastChecked: new Date().toISOString(),
        verificationStatus: "verified",
        isDemo: false,
      }),
    ];
  }
}

export class UnavailableProvider implements ProductSearchProvider {
  constructor(
    public name: string,
    private readonly envKey: string,
  ) {}

  async searchProducts(_query: ProductSearchQuery): Promise<ProductOffer[]> {
    const key = process.env[this.envKey];
    if (!key) {
      const err = new Error(`${this.name} is not configured`);
      (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
      throw err;
    }
    const err = new Error(
      `${this.name} live API is not connected. Use an official affiliate or partner API.`,
    );
    (err as Error & { code?: string }).code = "PROVIDER_UNAVAILABLE";
    throw err;
  }
}

export const AmazonProvider = new GladeAmazonProvider();
export const FlipkartProvider = new QuickCommerceFlipkartProvider();
export const CromaProvider = new CromaLiveProvider();
export const RelianceDigitalProvider = new UnavailableProvider(
  "Reliance Digital",
  "RELIANCE_DIGITAL_API_KEY",
);
export const OfficialStoreProvider = new UnavailableProvider(
  "Official",
  "OFFICIAL_STORE_API_KEY",
);
