import type {
  SearchResult,
  SearchResponse,
  SearchOptions,
} from "@/lib/types/search";

/**
 * Interface for search providers.
 * This allows us to swap implementations (Brave → Google → etc.) easily.
 */
export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

/**
 * Brave Search API implementation.
 * Handles HTTP requests and normalizes responses to our SearchResult format.
 */
export class BraveSearchClient implements SearchProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.search.brave.com/res/v1/web/search";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Brave Search API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Searches for content using Brave Search API.
   *
   * @param query - The search query
   * @param options - Search configuration options
   * @returns Normalized search results
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        count: String(options.maxResults || 10),
      });

      if (options.country) {
        params.append("country", options.country);
      }

      if (options.safeSearch !== undefined) {
        params.append("safesearch", options.safeSearch ? "strict" : "off");
      }

      // Make the HTTP request
      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Brave Search API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Normalize the response to our format
      return this.normalizeResponse(query, data, Date.now() - startTime);
    } catch (error) {
      console.error("Search error:", error);
      throw new Error(
        `Failed to perform search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Converts Brave's response format to our normalized SearchResponse.
   * This is where we handle the messy external data.
   */
  private normalizeResponse(
    query: string,
    braveData: any,
    searchTime: number
  ): SearchResponse {
    const results: SearchResult[] = (braveData.web?.results || []).map(
      (item: any) => ({
        id: item.url,
        title: item.title || "Untitled",
        description: item.description || "",
        url: item.url,
        domain: this.extractDomain(item.url),
        relevanceScore: undefined, // Brave doesn't provide this
      })
    );

    return {
      query,
      results,
      totalResults: braveData.web?.results?.length || 0,
      searchTime,
    };
  }

  /**
   * Extracts domain from URL for display purposes.
   * Helper function to keep code clean.
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }
}

/**
 * Factory function to create the appropriate search client.
 * Makes it easy to swap providers or add fallbacks later.
 */
export function createSearchClient(): SearchProvider {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error(
      "BRAVE_SEARCH_API_KEY environment variable is not set. " +
        "Please add it to your .env.local file."
    );
  }

  return new BraveSearchClient(apiKey);
}
