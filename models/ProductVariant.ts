import mongoose, { Schema } from "mongoose";

const ProductVariantSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    variant: { type: String, required: true },
    specs: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ProductVariantSchema.index({ productId: 1, variant: 1 }, { unique: true });

export const ProductVariantModel =
  mongoose.models.ProductVariant ||
  mongoose.model("ProductVariant", ProductVariantSchema);
