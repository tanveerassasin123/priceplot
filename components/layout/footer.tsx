import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 py-8 text-sm text-zinc-500 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>PricePilot — compare verified payable prices, not just list prices.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}
