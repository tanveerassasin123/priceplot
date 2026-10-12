import type { ProductOffer, ProductSearchQuery } from "@/lib/offers/types";

export interface ProductSearchProvider {
  name: string;
  searchProducts(query: ProductSearchQuery): Promise<ProductOffer[]>;
  getProductDetails?(url: string): Promise<ProductOffer | null>;
}
