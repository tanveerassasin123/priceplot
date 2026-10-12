import type { SearchPipelineResult, ProductOffer } from "@/lib/offers/types";
import { connectMongo, mongoEnabled } from "@/lib/database/connection";
import { logError } from "@/lib/observability/metrics";
import { MOCK_PRICE_HISTORY } from "@/lib/providers/mock-catalog";
import { OfferModel } from "@/models/Offer";
import { PriceAlertModel } from "@/models/PriceAlert";
import { PriceHistoryModel } from "@/models/PriceHistory";
import { SearchModel } from "@/models/Search";
import { UserModel } from "@/models/User";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface StoredAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  status: "active" | "triggered" | "paused";
  createdAt: string;
}

export interface StoredSearch {
  id: string;
  query: string;
  userId?: string;
  createdAt: string;
  bestPrice?: number;
}

const memory = {
  users: [] as StoredUser[],
  alerts: [] as StoredAlert[],
  searches: [] as StoredSearch[],
  offers: [] as ProductOffer[],
  history: Object.entries(MOCK_PRICE_HISTORY).flatMap(([productId, points]) =>
    points.map((p, i) => ({
      id: `${productId}-${i}`,
      offerId: `${productId}-latest`,
      productId,
      price: p.price,
      timestamp: p.timestamp,
    })),
  ),
};

function id(): string {
  return crypto.randomUUID();
}

export async function persistSearchResult(result: SearchPipelineResult): Promise<void> {
  const record: StoredSearch = {
    id: id(),
    query: result.query.rawQuery,
    createdAt: new Date().toISOString(),
    bestPrice: result.ranked.bestOverall?.finalPrice,
  };
  memory.searches.unshift(record);
  memory.offers = mergeOffers(memory.offers, result.offers);
  for (const offer of result.offers) {
    memory.history.push({
      id: id(),
      offerId: offer.id,
      productId: offer.productId,
      price: offer.finalPrice,
      timestamp: offer.lastChecked,
    });
  }

  if (!mongoEnabled()) return;
  try {
    await connectMongo();
    await SearchModel.create({
      query: result.query.rawQuery,
      resultSummary: {
        offersFound: result.metrics.offersFound,
        bestPrice: result.ranked.bestOverall?.finalPrice,
      },
    });
    for (const offer of result.offers) {
      await OfferModel.updateOne(
        { offerId: offer.id },
        { offerId: offer.id, productId: offer.productId, store: offer.store, payload: offer, finalPrice: offer.finalPrice },
        { upsert: true },
      );
      await PriceHistoryModel.create({
        offerId: offer.id,
        productId: offer.productId,
        price: offer.finalPrice,
        timestamp: new Date(offer.lastChecked),
      });
    }
  } catch (error) {
    logError("database.persist_search", error);
  }
}

function mergeOffers(existing: ProductOffer[], incoming: ProductOffer[]): ProductOffer[] {
  const map = new Map(existing.map((o) => [o.id, o]));
  for (const o of incoming) map.set(o.id, o);
  return [...map.values()];
}

export async function getSearchHistory(userId?: string): Promise<StoredSearch[]> {
  if (mongoEnabled()) {
    try {
      await connectMongo();
      const rows = await SearchModel.find(userId ? { userId } : {})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return rows.map((r) => ({
        id: String(r._id),
        query: r.query as string,
        userId: r.userId as string | undefined,
        createdAt: (r.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
        bestPrice: (r.resultSummary as { bestPrice?: number } | undefined)?.bestPrice,
      }));
    } catch (error) {
      logError("database.search_history", error);
    }
  }
  return memory.searches.filter((s) => !userId || s.userId === userId).slice(0, 50);
}

export async function getProductOffers(productId: string): Promise<ProductOffer[]> {
  const fromMemory = memory.offers.filter((o) => o.productId === productId);
  if (fromMemory.length) return fromMemory;
  if (!mongoEnabled()) return [];
  try {
    await connectMongo();
    const rows = await OfferModel.find({ productId }).lean();
    return rows.map((r) => r.payload as ProductOffer);
  } catch (error) {
    logError("database.offers", error);
    return [];
  }
}

export async function getPriceHistory(
  productId: string,
  rangeDays = 90,
): Promise<{ timestamp: string; price: number }[]> {
  const since = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  const local = memory.history
    .filter((h) => h.productId === productId && new Date(h.timestamp).getTime() >= since)
    .map((h) => ({ timestamp: h.timestamp, price: h.price }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (local.length) return local;
  if (!mongoEnabled()) return [];
  try {
    await connectMongo();
    const rows = await PriceHistoryModel.find({
      productId,
      timestamp: { $gte: new Date(since) },
    })
      .sort({ timestamp: 1 })
      .lean();
    return rows.map((r) => ({
      timestamp: new Date(r.timestamp as Date).toISOString(),
      price: r.price as number,
    }));
  } catch (error) {
    logError("database.history", error);
    return [];
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const lower = email.toLowerCase();
  const mem = memory.users.find((u) => u.email === lower);
  if (mem) return mem;
  if (!mongoEnabled()) return null;
  try {
    await connectMongo();
    const row = await UserModel.findOne({ email: lower }).lean();
    if (!row) return null;
    return {
      id: String(row._id),
      email: row.email as string,
      name: row.name as string,
      passwordHash: row.passwordHash as string,
    };
  } catch (error) {
    logError("database.user", error);
    return null;
  }
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const user: StoredUser = { id: id(), ...input, email: input.email.toLowerCase() };
  memory.users.push(user);
  if (mongoEnabled()) {
    try {
      await connectMongo();
      const row = await UserModel.create(user);
      user.id = String(row._id);
    } catch (error) {
      logError("database.create_user", error);
    }
  }
  return user;
}

export async function createAlert(
  userId: string,
  productId: string,
  targetPrice: number,
): Promise<StoredAlert> {
  const alert: StoredAlert = {
    id: id(),
    userId,
    productId,
    targetPrice,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  memory.alerts.push(alert);
  if (mongoEnabled()) {
    try {
      await connectMongo();
      const row = await PriceAlertModel.create({ userId, productId, targetPrice, status: "active" });
      alert.id = String(row._id);
    } catch (error) {
      logError("database.create_alert", error);
    }
  }
  return alert;
}

export async function listAlerts(userId: string): Promise<StoredAlert[]> {
  if (mongoEnabled()) {
    try {
      await connectMongo();
      const rows = await PriceAlertModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return rows.map((r) => ({
        id: String(r._id),
        userId: r.userId as string,
        productId: r.productId as string,
        targetPrice: r.targetPrice as number,
        status: r.status as StoredAlert["status"],
        createdAt: (r.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
      }));
    } catch (error) {
      logError("database.list_alerts", error);
    }
  }
  return memory.alerts.filter((a) => a.userId === userId);
}

export async function deleteAlert(userId: string, alertId: string): Promise<boolean> {
  const idx = memory.alerts.findIndex((a) => a.id === alertId && a.userId === userId);
  if (idx >= 0) memory.alerts.splice(idx, 1);
  if (mongoEnabled()) {
    try {
      await connectMongo();
      const res = await PriceAlertModel.deleteOne({ _id: alertId, userId });
      return res.deletedCount > 0 || idx >= 0;
    } catch (error) {
      logError("database.delete_alert", error);
    }
  }
  return idx >= 0;
}

export async function getAlertById(alertId: string): Promise<StoredAlert | null> {
  const mem = memory.alerts.find((a) => a.id === alertId);
  if (mem) return mem;
  return null;
}

export async function checkAlertsAgainstOffers(): Promise<number> {
  let triggered = 0;
  for (const alert of memory.alerts.filter((a) => a.status === "active")) {
    const offers = memory.offers.filter((o) => o.productId === alert.productId);
    const best = Math.min(...offers.map((o) => o.finalPrice), Infinity);
    if (best <= alert.targetPrice) {
      alert.status = "triggered";
      triggered += 1;
    }
  }
  return triggered;
}

export { memory as memoryStore };
