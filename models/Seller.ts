import mongoose, { Schema } from "mongoose";

const SellerSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    store: { type: String, index: true },
    rating: Number,
    known: Boolean,
  },
  { timestamps: true },
);

export const SellerModel =
  mongoose.models.Seller || mongoose.model("Seller", SellerSchema);
