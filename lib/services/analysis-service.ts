/**
 * SIMPLIFIED ANALYSIS SERVICE
 *
 * Core flow:
 * 1. Search web for competitors
 * 2. Generate embeddings for idea + competitors
 * 3. Calculate cosine similarities
 * 4. Compute simple heuristics (# close competitors, avg similarity, max similarity)
 * 5. Return saturation score + explanation
 *
 * No fancy strategies, no over-engineering - just straightforward analysis.
 */

import type {
  IdeaInput,
  AnalysisResult,
  CompetitionLevel,
} from "../types/analysis";
import type { SearchResult } from "../types/search";
import { BraveSource } from "./product-sources/brave-source";
import { HackerNewsSource } from "./product-sources/hacker-news-source";
import { ITunesSource } from "./product-sources/itunes-source";
import { createEmbeddingService } from "./embeddings/embedding-service";
import { cosineSimilarity } from "./embeddings/similarity";

// Simple threshold for determining "close" competitors
const SIMILARITY_THRESHOLD = 0.7; // 70% similar = close competitor

/**
 * Main analysis function - simple and straightforward.
 */
export async function analyzeIdea(input: IdeaInput): Promise<AnalysisResult> {
  try {
    // Step 1: Search for competitors across multiple sources
    const competitors = await searchForCompetitors(input);

    if (competitors.length === 0) {
      return {
        originalityScore: 85,
        competitionLevel: "Low",
        suggestions: [
          "No direct competitors found! This could be a unique opportunity.",
          "Validate demand through user interviews before building.",
        ],
        similarProducts: [],
      };
    }

    // Step 2: Generate embeddings
    const ideaText = `${input.title}. ${input.description}`;
    const competitorTexts = competitors.map(
      (c) => `${c.title}. ${c.description}`
    );

    const embeddingService = createEmbeddingService();
    const embeddings = await embeddingService.embedBatch([
      ideaText,
      ...competitorTexts,
    ]);
    const ideaEmbedding = embeddings[0];
    const competitorEmbeddings = embeddings.slice(1);

    // Step 3: Calculate similarities
    const similarities = competitorEmbeddings
      .map((compEmbed, idx) => ({
        similarity: cosineSimilarity(ideaEmbedding, compEmbed),
        competitor: competitors[idx],
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // Step 4: Compute simple metrics
    const closeCompetitors = similarities.filter(
      (s) => s.similarity >= SIMILARITY_THRESHOLD
    );
    const avgSimilarity =
      similarities.reduce((sum, s) => sum + s.similarity, 0) /
      similarities.length;
    const maxSimilarity = similarities[0].similarity;

    // Step 5: Calculate saturation score using simple heuristics
    // More close competitors + higher similarity = more saturated (lower score)
    const competitorFactor = Math.min(closeCompetitors.length / 10, 1); // Cap at 10+ competitors
    const similarityFactor = maxSimilarity * 0.5 + avgSimilarity * 0.5;
    const saturationLevel = competitorFactor * 0.6 + similarityFactor * 0.4;

    const originalityScore = Math.round((1 - saturationLevel) * 100);
    const competitionLevel = getCompetitionLevel(originalityScore);

    // Attach similarity scores to competitors for display
    const competitorsWithScores = similarities.map((s) => ({
      ...s.competitor,
      similarity: s.similarity,
    }));

    return {
      originalityScore,
      competitionLevel,
      suggestions: generateSuggestions(
        originalityScore,
        closeCompetitors.length,
        competitorsWithScores.length
      ),
      similarProducts: competitorsWithScores,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      originalityScore: 50,
      competitionLevel: "Medium",
      suggestions: ["Analysis failed. Please try again."],
      similarProducts: [],
    };
  }
}

/**
 * Search for competitors using multiple sources.
 * Runs all searches in parallel for speed.
 */
async function searchForCompetitors(input: IdeaInput): Promise<SearchResult[]> {
  const query = input.title; // Use title as search query
  const sources: Array<Promise<SearchResult[]>> = [];

  // Brave Search (web results)
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveApiKey) {
    const braveSource = new BraveSource(braveApiKey);
    sources.push(braveSource.search(query, 20));
  }

  // Hacker News (tech product launches)
  const hnSource = new HackerNewsSource();
  sources.push(hnSource.search(query, 10));

  // iTunes/App Store (mobile apps)
  const itunesSource = new ITunesSource();
  sources.push(itunesSource.search(query, 20));

  // Wait for all searches to complete
  const results = await Promise.all(sources);

  // Flatten and deduplicate
  const allResults = results.flat();
  const seen = new Set<string>();
  const unique: SearchResult[] = [];

  for (const result of allResults) {
    const key = result.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }

  console.log(
    `Found ${unique.length} unique competitors across ${sources.length} sources`
  );
  return unique.slice(0, 50); // Cap at 50 total results
}

/**
 * Map score to competition level.
 */
function getCompetitionLevel(score: number): CompetitionLevel {
  if (score >= 80) return "Low";
  if (score >= 60) return "Medium";
  if (score >= 40) return "High";
  return "Very High";
}

/**
 * Generate simple, helpful suggestions.
 */
function generateSuggestions(
  score: number,
  closeCompetitors: number,
  totalCompetitors: number
): string[] {
  const suggestions: string[] = [];

  if (closeCompetitors > 5) {
    suggestions.push(
      `Found ${closeCompetitors} very similar products. Consider finding a unique angle or niche.`
    );
  }

  if (score < 40) {
    suggestions.push(
      "This market is saturated. Focus on differentiation or a specific user segment."
    );
  } else if (score >= 70) {
    suggestions.push(
      "Your idea appears unique! Validate demand with potential users."
    );
  }

  if (totalCompetitors > 0) {
    suggestions.push(
      `Study the ${totalCompetitors} competitors found to identify gaps.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Build an MVP and gather user feedback early.");
  }

  return suggestions;
}
