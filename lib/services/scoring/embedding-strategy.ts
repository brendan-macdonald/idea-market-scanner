import type { IdeaScoringStrategy } from "../analysis-service";
import type { IdeaInput } from "@/lib/types/analysis";
import type { SearchResult } from "@/lib/types/search";
import { EmbeddingService } from "../embeddings/embedding-service";
import { averageSimilarity } from "../embeddings/similarity";

/**
 * Scoring strategy that uses embeddings and semantic similarity.
 * This is where AI-powered analysis happens!
 *
 * Algorithm:
 * 1. Embed the user's idea
 * 2. Embed all similar products found via search
 * 3. Calculate average cosine similarity across all competitors
 * 4. Convert to originality score: (1 - similarity) × 100
 *
 * Example:
 * - 90% average similarity → 10 originality score (not original)
 * - 20% average similarity → 80 originality score (very original!)
 */
export class EmbeddingScoringStrategy implements IdeaScoringStrategy {
  private embeddingService: EmbeddingService;
  private searchResults: SearchResult[];

  /**
   * @param embeddingService - Service for generating embeddings
   * @param searchResults - Similar products to compare against
   */
  constructor(
    embeddingService: EmbeddingService,
    searchResults: SearchResult[]
  ) {
    this.embeddingService = embeddingService;
    this.searchResults = searchResults;
  }

  /**
   * Calculates originality score using semantic similarity.
   *
   * Returns a score from 0-100:
   * - 100 = completely unique (no similar products)
   * - 0 = identical to existing products
   */
  async calculateScore(input: IdeaInput): Promise<number> {
    try {
      // If no search results, we can't compare (return neutral score)
      if (this.searchResults.length === 0) {
        console.warn("No search results to compare against");
        return 50; // Neutral score when we have no data
      }

      // Step 1: Create text representation of the user's idea
      const userIdeaText = `${input.title}. ${input.description}`;

      // Step 2: Create text from each search result
      const competitorTexts = this.searchResults.map(
        (result) => `${result.title}. ${result.description}`
      );

      // Step 3: Batch embed everything in ONE API call (cost optimization!)
      const allTexts = [userIdeaText, ...competitorTexts];
      console.log(
        `Embedding ${allTexts.length} texts (1 idea + ${competitorTexts.length} competitors)...`
      );

      const embeddings = await this.embeddingService.embedBatch(allTexts);

      // Step 4: Split embeddings
      const userEmbedding = embeddings[0];
      const competitorEmbeddings = embeddings.slice(1);

      // Step 5: Calculate average similarity across all competitors
      const avgSimilarity = averageSimilarity(
        userEmbedding,
        competitorEmbeddings
      );

      console.log(
        `Average similarity to competitors: ${(avgSimilarity * 100).toFixed(
          1
        )}%`
      );

      // Step 6: Convert similarity to originality score
      // High similarity = low originality
      // similarity of 0.9 (90%) → originality of 10
      // similarity of 0.2 (20%) → originality of 80
      const originalityScore = (1 - avgSimilarity) * 100;

      // Clamp between 0-100
      return Math.max(0, Math.min(100, Math.round(originalityScore)));
    } catch (error) {
      console.error("Embedding scoring failed:", error);

      // Graceful degradation: if embeddings fail, return a neutral score
      // In production, you might want to fall back to keyword strategy
      return 50;
    }
  }
}
