import mongoose, { Schema } from "mongoose";

const StoreSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    domain: String,
    official: Boolean,
  },
  { timestamps: true },
);

export const StoreModel =
  mongoose.models.Store || mongoose.model("Store", StoreSchema);
