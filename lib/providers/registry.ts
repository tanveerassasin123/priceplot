import { MockProvider } from "@/lib/providers/mock";
import {
  AmazonProvider,
  CromaProvider,
  FlipkartProvider,
  OfficialStoreProvider,
  RelianceDigitalProvider,
} from "@/lib/providers/amazon";
import type { ProductSearchProvider } from "@/lib/providers/types";

const mock = new MockProvider();

export function getProviders(): ProductSearchProvider[] {
  return [
    mock,
    AmazonProvider,
    FlipkartProvider,
    CromaProvider,
    RelianceDigitalProvider,
    OfficialStoreProvider,
  ];
}

export function isDemoMode(): boolean {
  return !(
    process.env.GLADE_API_KEY ||
    process.env.AMAZON_PRODUCT_ADVERTISING_API_KEY ||
    process.env.AMAZON_API_KEY ||
    process.env.QUICKCOMMERCE_API_KEY ||
    process.env.FLIPKART_API_KEY ||
    process.env.CROMA_API_KEY ||
    process.env.RELIANCE_DIGITAL_API_KEY ||
    process.env.OFFICIAL_STORE_API_KEY
  );
}
