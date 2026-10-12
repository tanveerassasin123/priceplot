import mongoose, { Schema } from "mongoose";

const OfferSchema = new Schema(
  {
    offerId: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    store: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    finalPrice: { type: Number, required: true, index: true },
  },
  { timestamps: true },
);

export const OfferModel =
  mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
