import type { SearchResult } from "@/lib/types/search";

/**
 * Interface that all product sources must implement.
 * This makes it easy to add new sources without changing other code.
 */
export interface ProductSource {
  /** Unique name for this source (e.g., "hacker-news", "itunes") */
  name: string;

  /** Search for products matching the query */
  search(query: string, limit?: number): Promise<SearchResult[]>;

  /** Optional: Check if this source is available/configured */
  isAvailable?(): boolean;
}

/**
 * Configuration for product aggregator
 */
export interface AggregatorConfig {
  /** List of sources to use (in priority order) */
  sources: ProductSource[];

  /** Maximum total results to return */
  maxResults?: number;

  /** Whether to deduplicate results across sources */
  deduplicate?: boolean;
}
