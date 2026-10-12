import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    brand: { type: String, index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, index: true },
    identifiers: {
      sku: { type: String, index: true },
      gtin: { type: String, index: true },
      ean: String,
      upc: String,
      modelNumber: { type: String, index: true },
    },
  },
  { timestamps: true },
);

export const ProductModel =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
