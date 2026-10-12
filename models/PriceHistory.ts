import mongoose, { Schema } from "mongoose";

const PriceHistorySchema = new Schema({
  offerId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true },
});

PriceHistorySchema.index({ productId: 1, timestamp: -1 });

export const PriceHistoryModel =
  mongoose.models.PriceHistory ||
  mongoose.model("PriceHistory", PriceHistorySchema);
