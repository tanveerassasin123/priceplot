"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  initialQuery = "",
  autoFocus = false,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="product-search">
        Search for a product
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          id="product-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a product..."
          autoFocus={autoFocus}
          className="pl-12"
        />
      </div>
      <Button type="submit">Compare Prices</Button>
      <Link
        href="/search?image=1"
        className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
      >
        Search by Image
      </Link>
    </form>
  );
}
