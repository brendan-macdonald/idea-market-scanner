import type {
  IdeaInput,
  AnalysisResult,
  CompetitionLevel,
} from "../types/analysis";
import type { SearchProvider } from "./search/search-client";
import type { SearchResult } from "../types/search";
import { EmbeddingService } from "./embeddings/embedding-service";
import { EmbeddingScoringStrategy } from "./scoring/embedding-strategy";

/**
 * Strategy interface for scoring ideas.
 * This lets us swap implementations (keywords → embeddings) without changing consumers.
 */
export interface IdeaScoringStrategy {
  calculateScore(input: IdeaInput): number | Promise<number>;
}

/**
 * Maps originality score to competition level.
 * Pure function, independent of scoring strategy.
 */
function calculateCompetitionLevel(originalityScore: number): CompetitionLevel {
  if (originalityScore >= 80) return "Low";
  if (originalityScore >= 60) return "Medium";
  if (originalityScore >= 40) return "High";
  return "Very High";
}

/**
 * Generates contextual suggestions based on the analysis.
 * Now enhanced with search results data.
 */
function generateSuggestions(
  originalityScore: number,
  competitionLevel: CompetitionLevel,
  similarProducts?: SearchResult[]
): string[] {
  const suggestions: string[] = [];

  if (originalityScore < 50) {
    suggestions.push(
      "Consider adding a unique twist or targeting a specific niche market."
    );
  }

  if (competitionLevel === "Very High" || competitionLevel === "High") {
    suggestions.push(
      "Research existing competitors to find gaps in their offerings."
    );
    suggestions.push("Focus on a specific user segment that's underserved.");
  }

  if (originalityScore >= 70) {
    suggestions.push(
      "Your idea seems fairly unique! Validate demand through user interviews."
    );
  }

  // Add suggestion based on number of similar products found
  if (similarProducts && similarProducts.length > 0) {
    suggestions.push(
      `Found ${similarProducts.length} similar products. Study their reviews to identify pain points.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Start with an MVP and gather user feedback early.");
  }

  return suggestions;
}

//Main entry point: analyzes an idea using the provided scoring strategy.
//Design: Accepts a strategy parameter for dependency injection.
//This makes testing easy and allows swapping strategies without code changes.

export async function analyzeIdea(
  input: IdeaInput,
  options: {
    scoringStrategy?: IdeaScoringStrategy;
    searchClient?: SearchProvider;
    embeddingService?: EmbeddingService;
    useEmbeddings?: boolean; // New flag for Phase 2B
  } = {}
): Promise<AnalysisResult> {
  const {
    scoringStrategy,
    searchClient,
    embeddingService,
    useEmbeddings = false, // Default to keywords for backward compatibility
  } = options;

  // Optionally search for similar products (Phase 2A)
  let similarProducts: SearchResult[] | undefined;
  if (searchClient) {
    try {
      const searchQuery = `${input.title} ${input.description}`;
      const searchResults = await searchClient.search(searchQuery, {
        maxResults: 5,
      });
      similarProducts = searchResults.results;
    } catch (error) {
      console.error("Search failed, continuing without results:", error);
      // Graceful degradation: continue without search results
    }
  }

  // Determine which scoring strategy to use (Phase 2B)
  let finalStrategy: IdeaScoringStrategy;

  if (scoringStrategy) {
    // Use provided strategy (for testing or custom strategies)
    finalStrategy = scoringStrategy;
  } else if (
    useEmbeddings &&
    embeddingService &&
    similarProducts &&
    similarProducts.length > 0
  ) {
    // Use embedding strategy if enabled and we have data
    console.log("Using embedding-based scoring");
    finalStrategy = new EmbeddingScoringStrategy(
      embeddingService,
      similarProducts
    );
  } else {
    // No scoring possible without search results + embeddings
    console.warn(
      "No search results or embedding service - returning neutral score"
    );
    // Return neutral result
    return {
      originalityScore: 50,
      competitionLevel: "Medium",
      suggestions: [
        "Unable to analyze - search or embedding service unavailable.",
        "Try again later or check your API keys.",
      ],
      similarProducts: undefined,
    };
  }

  // Run scoring
  const originalityScore = await finalStrategy.calculateScore(input);
  const competitionLevel = calculateCompetitionLevel(originalityScore);

  const suggestions = generateSuggestions(
    originalityScore,
    competitionLevel,
    similarProducts
  );

  return {
    originalityScore,
    competitionLevel,
    suggestions,
    similarProducts,
  };
}
