import type {
  IdeaInput,
  AnalysisResult,
  CompetitionLevel,
} from "../types/analysis";
import type { SearchProvider } from "./search/search-client";
import type { SearchResult } from "../types/search";

/**
 * Strategy interface for scoring ideas.
 * This lets us swap implementations (keywords → embeddings) without changing consumers.
 */
export interface IdeaScoringStrategy {
  calculateScore(input: IdeaInput): number | Promise<number>;
}

/**
 * Phase 1: Simple keyword-based scoring.
 * Phase 2: an EmbeddingScoringStrategy that implements the same interface.
 */

class KeywordScoringStrategy implements IdeaScoringStrategy {
  private readonly saturatedKeywords = [
    "social network",
    "dating app",
    "todo list",
    "recipe app",
    "fitness tracker",
    "e-commerce",
    "marketplace",
  ];

  calculateScore(input: IdeaInput): number {
    const combinedText =
      `${input.title} ${input.description}`.toLocaleLowerCase();

    //simple heuristic: count how many saturated keywords appear
    const matchCount = this.saturatedKeywords.filter((keyword) =>
      combinedText.includes(keyword)
    ).length;

    const baseScore = 100 - matchCount * 20;
    return Math.max(0, Math.min(100, baseScore));
  }
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
  } = {}
): Promise<AnalysisResult> {
  const { scoringStrategy = new KeywordScoringStrategy(), searchClient } =
    options;

  // Run scoring
  const originalityScore = await scoringStrategy.calculateScore(input);
  const competitionLevel = calculateCompetitionLevel(originalityScore);

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
