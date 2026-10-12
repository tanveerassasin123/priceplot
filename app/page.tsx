import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { DemoBanner } from "@/components/demo-banner";
import { isDemoMode } from "@/lib/providers/registry";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-black dark:to-slate-950">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 sm:py-32">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Logo/Branding */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white mb-2">
              PricePilot
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Find the Best Price. Automatically.
            </p>
          </div>

          {/* Main Headline */}
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Search thousands of listings and let AI find the best verified deal for you.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Compare prices across multiple stores in seconds. No hidden fees, no guesswork.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 w-full">
            <SearchBar />
          </div>

          {/* Example Chips */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            {[
              "iPhone 17 256GB",
              "Samsung Galaxy S26 Ultra",
              "Sony WH-1000XM6",
              "ASUS ROG laptop",
              "Nike Air Max"
            ].map((example) => (
              <Link
                key={example}
                href={`/search?q=${encodeURIComponent(example)}`}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                {example}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              🔎 Compare Prices
            </Link>
            <button
              className="px-8 py-3 rounded-full border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors inline-flex items-center justify-center gap-2"
            >
              📷 Search by Image
            </button>
          </div>

          {/* Demo Banner */}
          <div className="mt-16">
            <DemoBanner demoMode={isDemoMode()} />
          </div>
        </div>
      </main>

      {/* Feature Highlights (Optional) */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Why PricePilot?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Lightning Fast
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Get results in seconds, not minutes
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🛡️</div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Verified Sellers
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Only trusted retailers and official stores
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🤖</div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                AI-Powered
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Smart matching and deal recommendations
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
