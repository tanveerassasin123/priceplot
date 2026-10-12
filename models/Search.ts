import mongoose, { Schema } from "mongoose";

const SearchSchema = new Schema(
  {
    query: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    resultSummary: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const SearchModel =
  mongoose.models.Search || mongoose.model("Search", SearchSchema);
