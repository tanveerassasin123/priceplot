import { checkAlertsAgainstOffers } from "@/lib/database/repos";
import { logMetric } from "@/lib/observability/metrics";
import type { Job } from "@/lib/alerts/types";

export const priceCheckJob: Job = {
  name: "price-alerts",
  async run() {
    const triggered = await checkAlertsAgainstOffers();
    logMetric("alerts.checked", { triggered });
  },
};
