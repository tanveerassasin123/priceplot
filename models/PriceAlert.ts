import mongoose, { Schema } from "mongoose";

const PriceAlertSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    targetPrice: { type: Number, required: true },
    status: { type: String, enum: ["active", "triggered", "paused"], default: "active" },
  },
  { timestamps: true },
);

export const PriceAlertModel =
  mongoose.models.PriceAlert || mongoose.model("PriceAlert", PriceAlertSchema);
