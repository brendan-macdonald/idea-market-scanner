import type { SearchResult } from "@/lib/types/search";

/**
 * Hacker News source using their public Algolia API.
 * Searches "Show HN" posts (product launches).
 *
 * Simple, no abstractions - just search and return normalized results.
 * API Docs: https://hn.algolia.com/api
 */
export class HackerNewsSource {
  private readonly baseUrl = "http://hn.algolia.com/api/v1";

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(
        query
      )}&tags=show_hn&hitsPerPage=${limit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HN API returned ${response.status}`);
      }

      const data = await response.json();

      return this.normalizeResults(data.hits || []);
    } catch (error) {
      console.error("Hacker News search failed:", error);
      return []; // Graceful degradation
    }
  }

  isAvailable(): boolean {
    return true; // No auth required
  }

  /**
   * Converts HN format to our SearchResult format.
   */
  private normalizeResults(
    hits: Array<{
      objectID: string;
      title?: string;
      story_text?: string;
      comment_text?: string;
      url?: string;
      points?: number;
    }>
  ): SearchResult[] {
    return hits.map((hit) => ({
      id: `hn-${hit.objectID}`,
      title: hit.title || "Untitled",
      description: hit.story_text || hit.comment_text || "",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      domain: "news.ycombinator.com",
      source: "hacker-news",
    }));
  }
}
