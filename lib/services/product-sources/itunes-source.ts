import type { SearchResult } from "@/lib/types/search";

/**
 * iTunes/App Store source using Apple's public search API.
 * Great for finding mobile apps in any category.
 *
 * Simple, no abstractions - just search and return normalized results.
 * API Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI
 */
export class ITunesSource {
  private readonly baseUrl = "https://itunes.apple.com/search";

  async search(query: string, limit = 50): Promise<SearchResult[]> {
    try {
      const url = `${this.baseUrl}?term=${encodeURIComponent(
        query
      )}&entity=software&limit=${limit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`iTunes API returned ${response.status}`);
      }

      const data = await response.json();

      return this.normalizeResults(data.results || []);
    } catch (error) {
      console.error("iTunes search failed:", error);
      return [];
    }
  }

  isAvailable(): boolean {
    return true; // No auth required
  }

  /**
   * Converts iTunes format to our SearchResult format.
   */
  private normalizeResults(
    results: Array<{
      trackId: number;
      trackName?: string;
      description?: string;
      trackViewUrl: string;
      averageUserRating?: number;
    }>
  ): SearchResult[] {
    return results.map((app) => ({
      id: `itunes-${app.trackId}`,
      title: app.trackName || "Untitled",
      description: app.description || "",
      url: app.trackViewUrl,
      domain: "apps.apple.com",
      source: "itunes",
    }));
  }
}
