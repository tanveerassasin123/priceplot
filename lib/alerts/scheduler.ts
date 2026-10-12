import type { Job } from "@/lib/alerts/types";

export interface Scheduler {
  name: string;
  schedule(job: Job, intervalMs: number): void;
}

export class IntervalScheduler implements Scheduler {
  name = "interval";
  private timers = new Map<string, ReturnType<typeof setInterval>>();

  schedule(job: Job, intervalMs: number): void {
    this.clear(job.name);
    const timer = setInterval(() => {
      void job.run();
    }, intervalMs);
    this.timers.set(job.name, timer);
  }

  clear(name: string): void {
    const t = this.timers.get(name);
    if (t) clearInterval(t);
    this.timers.delete(name);
  }
}
