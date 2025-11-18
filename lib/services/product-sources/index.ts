import { ProductAggregator } from "./aggregator";
import { HackerNewsSource } from "./hacker-news-source";
import { ITunesSource } from "./itunes-source";
import { BraveSource } from "./brave-source";

/**
 * Creates a configured product aggregator with all available sources.
 * Sources are added in priority order (best first).
 */
export function createProductAggregator(): ProductAggregator {
  const sources = [];

  // Priority 1: Hacker News (best free source for tech products)
  sources.push(new HackerNewsSource());

  // Priority 2: iTunes (mobile apps)
  sources.push(new ITunesSource());

  // Priority 3: Brave Search (fallback for everything else)
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveApiKey) {
    sources.push(new BraveSource(braveApiKey));
  } else {
    console.warn("Brave Search API key not found - skipping Brave source");
  }

  // Return aggregator with higher limit for better market coverage
  // 30 results from potentially 120+ candidates gives us excellent market view
  // All these APIs are free, so no cost to cast a wider net
  return new ProductAggregator(sources, 30);
}

// Export types and classes for external use
export type { ProductSource } from "./types";
export { ProductAggregator } from "./aggregator";
export { HackerNewsSource } from "./hacker-news-source";
export { ITunesSource } from "./itunes-source";
export { BraveSource } from "./brave-source";
