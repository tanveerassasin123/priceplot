import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PricePilot — Find the Best Price. Automatically.",
  description: "Search thousands of listings and let AI find the best verified deal for you. Compare prices across multiple stores instantly with PricePilot.",
  keywords: "price comparison, shopping, deals, price tracking, product search",
  authors: [{ name: "PricePilot" }],
  openGraph: {
    title: "PricePilot — Find the Best Price",
    description: "Compare prices across retailers and find the best deals automatically",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
