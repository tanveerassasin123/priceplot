"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PipelineStep {
  id: string;
  label: string;
  emoji: string;
  completed: boolean;
  timestamp?: number;
}

interface RankedOffer {
  id: string;
  productName: string;
  brand?: string;
  store: string;
  price: number;
  finalPrice: number;
  shipping: number;
  originalPrice?: number;
  availability: string;
  seller?: string;
  sellerRating?: number;
  warrantyMonths?: number;
  returnWindowDays?: number;
  url: string;
  verdict?: "best_overall" | "cheapest" | "safest" | "official";
  suspicious?: boolean;
  suspiciousReason?: string;
  isOfficialStore?: boolean;
  isMock?: boolean;
}

interface SearchResult {
  query: string;
  offers: RankedOffer[];
  completedAt?: number;
  error?: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "search", label: "Searching stores…", emoji: "🔎", completed: false },
  { id: "match", label: "Matching products…", emoji: "📦", completed: false },
  { id: "price", label: "Comparing prices…", emoji: "💰", completed: false },
  { id: "calc", label: "Calculating final prices…", emoji: "🧮", completed: false },
  { id: "safety", label: "Checking sellers…", emoji: "🛡️", completed: false },
  { id: "rank", label: "Finding the best deal…", emoji: "🏆", completed: false },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);
      setPipelineSteps(PIPELINE_STEPS);

      try {
        // Simulate pipeline steps with delays (in real app, these would be SSE or polling)
        const steps = [...PIPELINE_STEPS];
        for (let i = 0; i < steps.length; i++) {
          steps[i].completed = true;
          steps[i].timestamp = Date.now();
          setPipelineSteps([...steps]);
          // Stagger the completion of each step
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Fetch actual search results
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            No search query
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Enter a product name to compare prices
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Results for "{query}"
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Finding the best deals for you
          </p>
        </div>

        {/* Pipeline Progress */}
        {loading && (
          <Card className="p-8 mb-8">
            <div className="space-y-4">
              {pipelineSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 transition-opacity ${
                    step.completed ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <span className="text-2xl">{step.emoji}</span>
                  <span
                    className={`text-lg font-medium ${
                      step.completed
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.completed && (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-6 mb-8 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              <strong>Search Error:</strong> {error}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Please try again or contact support
            </p>
          </Card>
        )}

        {/* Results */}
        {!loading && result && result.offers.length > 0 && (
          <div>
            {/* Verdicts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {result.offers
                .filter((o) => o.verdict)
                .map((offer) => (
                  <Card key={`${offer.verdict}-${offer.id}`} className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      {offer.verdict === "best_overall" && "🏆 Best Overall"}
                      {offer.verdict === "cheapest" && "💰 Cheapest"}
                      {offer.verdict === "safest" && "🛡️ Safest Buy"}
                      {offer.verdict === "official" && "🏪 Best Official Deal"}
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                      ₹{offer.finalPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      at {offer.store}
                    </div>
                  </Card>
                ))}
            </div>

            {/* All Offers */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              All Deals ({result.offers.length})
            </h2>
            <div className="space-y-4">
              {result.offers.map((offer) => (
                <Card key={offer.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Suspicious Badge */}
                  {offer.suspicious && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ <strong>Suspiciously Low Price:</strong> {offer.suspiciousReason}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {offer.productName}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {offer.isOfficialStore && (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                            Official Store
                          </Badge>
                        )}
                        {offer.isMock && (
                          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                            Demo data
                          </Badge>
                        )}
                        <Badge className="border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200">
                          {offer.availability}
                        </Badge>
                        {offer.warrantyMonths && (
                          <Badge className="border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200">
                            {offer.warrantyMonths}M warranty
                          </Badge>
                        )}
                        {offer.returnWindowDays && (
                          <Badge className="border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200">
                            {offer.returnWindowDays}D returns
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {offer.store} {offer.seller && `• Seller: ${offer.seller}`}
                        {offer.sellerRating && ` • Rating: ${offer.sellerRating}/5`}
                      </p>
                    </div>

                    {/* Pricing Info */}
                    <div className="text-right">
                      <div className="mb-2">
                        {offer.originalPrice && (
                          <p className="text-sm line-through text-slate-500 dark:text-slate-400">
                            ₹{offer.originalPrice.toLocaleString()}
                          </p>
                        )}
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                          ₹{offer.finalPrice.toLocaleString()}
                        </div>
                      </div>
                      {offer.shipping > 0 && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                          + ₹{offer.shipping.toLocaleString()} shipping
                        </p>
                      )}
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Deal
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && result && result.offers.length === 0 && !error && (
          <Card className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No results found for "{query}"
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Try a different search
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
