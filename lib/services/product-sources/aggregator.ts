import type { ProductSource } from "./types";
import type { SearchResult } from "@/lib/types/search";

/**
 * Aggregates results from multiple product sources.
 * Handles deduplication, prioritization, and error handling.
 */
export class ProductAggregator {
  private sources: ProductSource[];
  private maxResults: number;

  constructor(sources: ProductSource[], maxResults = 10) {
    this.sources = sources;
    this.maxResults = maxResults;
  }

  /**
   * Searches all available sources and combines results.
   * Sources are queried in parallel for speed.
   */
  async searchAll(query: string): Promise<SearchResult[]> {
    console.log(`Searching ${this.sources.length} sources for: "${query}"`);

    // Query all sources in parallel
    const results = await Promise.all(
      this.sources.map(async (source) => {
        try {
          if (source.isAvailable && !source.isAvailable()) {
            console.log(`Skipping ${source.name} - not available`);
            return [];
          }

          console.log(`Querying ${source.name}...`);
          const sourceResults = await source.search(query, this.maxResults);
          console.log(
            `${source.name} returned ${sourceResults.length} results`
          );
          return sourceResults;
        } catch (error) {
          console.error(`${source.name} failed:`, error);
          return []; // Continue with other sources
        }
      })
    );

    // Flatten and deduplicate
    const allResults = results.flat();
    const deduplicated = this.deduplicateResults(allResults);

    console.log(`Total unique results: ${deduplicated.length}`);

    // Return top N results
    return deduplicated.slice(0, this.maxResults);
  }

  /**
   * Searches with multiple query variations to catch more niche competitors.
   * Example: "dog dating app", "pet dating app", "dating for dog owners"
   *
   * This increases coverage without changing per-source limits.
   */
  async searchMultiQuery(queries: string[]): Promise<SearchResult[]> {
    console.log(`Multi-query search with ${queries.length} variations:`);
    queries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

    const allQueryResults: SearchResult[][] = [];

    // Search queries sequentially to avoid rate limits
    for (const query of queries) {
      // Search all sources for this query (in parallel)
      const results = await Promise.all(
        this.sources.map(async (source) => {
          try {
            if (source.isAvailable && !source.isAvailable()) {
              return [];
            }

            const sourceResults = await source.search(
              query,
              Math.ceil(this.maxResults / queries.length) // Split limit across queries
            );
            return sourceResults;
          } catch (error) {
            console.error(`${source.name} failed for "${query}":`, error);
            return [];
          }
        })
      );

      allQueryResults.push(results.flat());

      // Small delay between queries to respect rate limits (250ms)
      if (query !== queries[queries.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    // Combine all results from all queries
    const allResults = allQueryResults.flat();
    const deduplicated = this.deduplicateResults(allResults);

    console.log(
      `Found ${deduplicated.length} unique results across ${queries.length} queries`
    );

    // Return top N results
    return deduplicated.slice(0, this.maxResults);
  }

  /**
   * Removes duplicate results based on URL similarity.
   * Keeps the result with higher relevance score.
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();

    for (const result of results) {
      // Normalize URL for comparison (remove protocol, www, trailing slash)
      const normalizedUrl = this.normalizeUrl(result.url);

      const existing = seen.get(normalizedUrl);
      if (
        !existing ||
        (result.relevanceScore || 0) > (existing.relevanceScore || 0)
      ) {
        seen.set(normalizedUrl, result);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalizes URLs for deduplication.
   */
  private normalizeUrl(url: string): string {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }

  /**
   * Adds a new source to the aggregator.
   * Useful for dynamic source management.
   */
  addSource(source: ProductSource): void {
    this.sources.push(source);
  }

  /**
   * Removes a source by name.
   */
  removeSource(name: string): void {
    this.sources = this.sources.filter((s) => s.name !== name);
  }
}
