import mongoose from "mongoose";
import { logError } from "@/lib/observability/metrics";

let connecting: Promise<typeof mongoose> | null = null;

export async function connectMongo(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!connecting) {
    connecting = mongoose.connect(uri).catch((error) => {
      connecting = null;
      logError("database.connect", error);
      throw error;
    });
  }
  return connecting;
}

export function mongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
