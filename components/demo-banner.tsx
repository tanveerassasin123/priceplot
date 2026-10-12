export function DemoBanner({ demoMode }: { demoMode: boolean }) {
  if (!demoMode) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <strong>Demo Mode</strong> — live prices are not currently connected. Demo
      data is shown so you can evaluate the product. Verify the final price on
      the retailer&apos;s website before purchasing.
    </div>
  );
}
