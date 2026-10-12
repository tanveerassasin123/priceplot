type MetricPayload = Record<string, string | number | boolean | undefined>;

export function logMetric(event: string, payload: MetricPayload = {}): void {
  const line = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  if (process.env.NODE_ENV !== "test") {
    console.info("[pricepilot]", JSON.stringify(line));
  }
}

export function logError(event: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[pricepilot]", JSON.stringify({ event, message }));
}
