import type { SearchResult } from "@/lib/types/search";

/**
 * Brave Search source - simple search implementation.
 * No abstractions - just search and return normalized results.
 */
export class BraveSource {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.search.brave.com/res/v1/web/search";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Brave Search API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Brave API max is 20 results per request
      const actualLimit = Math.min(limit, 20);
      const params = new URLSearchParams({
        q: query,
        count: String(actualLimit),
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave API returned ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeResults(data.web?.results || []);
    } catch (error) {
      console.error("Brave search failed:", error);
      return [];
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  private normalizeResults(
    results: Array<{
      title?: string;
      description?: string;
      url: string;
    }>
  ): SearchResult[] {
    return results.map((item) => ({
      id: item.url,
      title: item.title || "Untitled",
      description: item.description || "",
      url: item.url,
      domain: this.extractDomain(item.url),
      source: "brave-search",
    }));
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }
}
