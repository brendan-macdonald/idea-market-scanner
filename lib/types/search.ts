/**
 * A normalized search result from any search provider.
 * internal representation, independent of the external API.
 */

export interface SearchResult {
  //unique identifier
  id: string;
  //title of page/product
  title: string;
  //description/snippet from the search result
  description: string;
  //URL to the actual page
  url: string;
  // Optional: domain name for display
  domain?: string;
  //Optional: relevance score from the search engine (0-1)
  relevanceScore?: number;
  // Optional: source that returned this result (hacker-news, itunes, brave, etc.)
  source?: string;
}

/**
 * Response from our search service.
 * Includes results + metadata about the search.
 */
export interface SearchResponse {
  //search query that was executed
  query: string;
  //array of search results
  results: SearchResult[];
  //total number of results found
  totalResults: number;
  //how long the search took (ms)
  searchTime?: number;
}

/**
 * Options for configuring a search request.
 */
export interface SearchOptions {
  //Maximum number of results to return
  maxResults?: number;

  //Filter by country code (e.g., 'us', 'uk')
  country?: string;

  //Safe search level
  safeSearch?: boolean;
}
