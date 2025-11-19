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

// Adjusted threshold - 60% similarity = close competitor (was 70%)
// This catches more saturated markets where competitors are "close enough"
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Progress callback type for real-time status updates
 */
export type ProgressCallback = (status: string, progress: number) => void;

/**
 * Options for analysis
 */
export interface AnalysisOptions {
  onProgress?: ProgressCallback;
}

/**
 * Main analysis function - simple and straightforward.
 */
export async function analyzeIdea(
  input: IdeaInput,
  options?: AnalysisOptions
): Promise<AnalysisResult> {
  const onProgress = options?.onProgress || (() => {});

  try {
    // Step 1: Search for competitors across multiple sources
    onProgress(
      "Searching for competitors across web, HackerNews, and App Store...",
      10
    );
    const competitors = await searchForCompetitors(input);

    if (competitors.length === 0) {
      onProgress("Analysis complete!", 100);
      return {
        originalityScore: 85,
        competitionLevel: "Low",
        topCompetitors: [],
        similarCount: 0,
        explanation:
          "No direct competitors found in our search. This could indicate a unique niche or new market space.",
        suggestions: [
          "Validate demand through user interviews before building.",
          "Research adjacent markets to ensure you're not missing existing solutions.",
          "Consider whether the lack of competitors indicates low demand or a true gap.",
        ],
        keywords: extractKeywords(input, []),
        similarProducts: [],
      };
    }

    // Step 2: Generate embeddings
    onProgress(`Analyzing ${competitors.length} competitors with AI...`, 40);
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
    onProgress("Calculating similarity scores...", 60);
    const similarities = competitorEmbeddings
      .map((compEmbed, idx) => ({
        similarity: cosineSimilarity(ideaEmbedding, compEmbed),
        competitor: competitors[idx],
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // Step 3.5: Filter for niche matching
    // If the idea targets a specific niche/audience, competitors must mention it
    onProgress("Filtering for niche-specific competitors...", 70);
    const nicheTerms = extractNicheTerms(input);
    const nicheFilteredSimilarities =
      nicheTerms.length > 0
        ? similarities.map((s) => {
            const matchesNiche = competitorMatchesNiche(
              s.competitor,
              nicheTerms
            );
            // If competitor doesn't match the niche, reduce its similarity significantly
            return {
              ...s,
              similarity: matchesNiche ? s.similarity : s.similarity * 0.5,
            };
          })
        : similarities;

    // Step 4: Compute simple metrics
    onProgress("Computing originality score...", 85);
    const closeCompetitors = nicheFilteredSimilarities.filter(
      (s) => s.similarity >= SIMILARITY_THRESHOLD
    );
    const maxSimilarity = nicheFilteredSimilarities[0].similarity;
    const top5Avg =
      nicheFilteredSimilarities
        .slice(0, 5)
        .reduce((sum, s) => sum + s.similarity, 0) /
      Math.min(5, nicheFilteredSimilarities.length);

    // Step 5: Calculate saturation score using IMPROVED heuristics
    // Key insight: High max similarity OR many close competitors = saturated
    //
    // Formula breakdown:
    // - maxSimilarity: If top competitor is 80%+ similar, market is saturated regardless of count
    // - top5Avg: Average of top 5 competitors matters more than overall average
    // - competitorFactor: More close competitors = more saturated (exponential growth)
    //
    // Weight distribution:
    // - 40% max similarity (single strong competitor matters)
    // - 30% top 5 average (cluster of competitors matters)
    // - 30% competitor count (market breadth matters)

    const competitorFactor = Math.min(closeCompetitors.length / 8, 1); // Cap at 8+ (was 10)
    const similarityFactor = maxSimilarity * 0.5 + top5Avg * 0.5; // Use top5 instead of avg
    let saturationLevel =
      maxSimilarity * 0.4 + similarityFactor * 0.3 + competitorFactor * 0.3;

    // Specificity boost: If idea has multiple unique/niche terms, reduce saturation
    // This helps distinguish "weather app" (generic) from "AR furniture for tiny homes" (specific niche)
    const specificityBoost = calculateSpecificityBoost(input, competitors);
    saturationLevel = saturationLevel * (1 - specificityBoost * 0.3); // Max 30% boost for highly specific ideas

    const originalityScore = Math.round((1 - saturationLevel) * 100);
    const competitionLevel = getCompetitionLevel(originalityScore);

    // Attach similarity scores to competitors for display (use niche-filtered scores)
    const competitorsWithScores = nicheFilteredSimilarities.map((s) => ({
      ...s.competitor,
      similarity: s.similarity,
    }));

    // Extract top 3 competitors for focused display
    const topCompetitors = nicheFilteredSimilarities.slice(0, 3).map((s) => ({
      title: s.competitor.title,
      snippet:
        s.competitor.description.slice(0, 100) +
        (s.competitor.description.length > 100 ? "..." : ""),
      url: s.competitor.url,
      similarity: s.similarity,
    }));

    // Extract common keywords
    const keywords = extractKeywords(input, competitors);

    // Detect unique angle
    const uniqueAngle = detectUniqueAngle(input, competitors);

    // Generate explanation
    const explanation = generateExplanation(
      closeCompetitors.length,
      nicheFilteredSimilarities.length,
      top5Avg,
      maxSimilarity,
      keywords
    );

    onProgress("Analysis complete!", 100);

    return {
      originalityScore,
      competitionLevel,
      topCompetitors,
      similarCount: closeCompetitors.length,
      explanation,
      suggestions: generateSuggestions(
        originalityScore,
        closeCompetitors.length,
        input,
        topCompetitors
      ),
      keywords,
      uniqueAngle,
      similarProducts: competitorsWithScores,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    onProgress("Analysis failed", 0);
    return {
      originalityScore: 50,
      competitionLevel: "Medium",
      topCompetitors: [],
      similarCount: 0,
      explanation: "Analysis failed. Please try again.",
      suggestions: [
        "Unable to complete analysis. Please check your API keys and try again.",
      ],
      keywords: [],
      similarProducts: [],
    };
  }
}

/**
 * Extract common keywords from idea and competitors.
 */
function extractKeywords(
  input: IdeaInput,
  competitors: SearchResult[]
): string[] {
  const text = `${input.title} ${input.description} ${competitors
    .slice(0, 10)
    .map((c) => c.title)
    .join(" ")}`.toLowerCase();

  // Common words to ignore
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "app",
    "tool",
    "platform",
    "software",
    "service",
    "system",
    "that",
    "this",
    "your",
    "our",
    "new",
    "best",
  ]);

  // Count word frequency
  const words = text.match(/\b[a-z]{3,}\b/g) || [];
  const frequency: Record<string, number> = {};

  for (const word of words) {
    if (!stopWords.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  }

  // Get top 5 keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Detect if the idea has a unique angle not found in competitors.
 */
function detectUniqueAngle(
  input: IdeaInput,
  competitors: SearchResult[]
): string | undefined {
  const ideaText = `${input.title} ${input.description}`.toLowerCase();
  const competitorText = competitors
    .map((c) => `${c.title} ${c.description}`)
    .join(" ")
    .toLowerCase();

  // Extract distinctive phrases from idea (2-3 word combinations)
  const ideaWords = ideaText.match(/\b[a-z]+\b/g) || [];
  const uniquePhrases: string[] = [];

  for (let i = 0; i < ideaWords.length - 1; i++) {
    const phrase = `${ideaWords[i]} ${ideaWords[i + 1]}`;
    // Skip common patterns
    if (
      phrase.includes("app") ||
      phrase.includes("platform") ||
      phrase.includes("tool")
    )
      continue;

    // If phrase is in idea but not in competitors, it's potentially unique
    if (ideaText.includes(phrase) && !competitorText.includes(phrase)) {
      uniquePhrases.push(phrase);
    }
  }

  if (uniquePhrases.length > 0) {
    return `Unique angle detected: ${uniquePhrases[0]}`;
  }

  return undefined;
}

/**
 * Calculate specificity boost for niche ideas.
 * Returns 0-1, where 1 = highly specific niche, 0 = generic idea.
 *
 * Heuristics:
 * - Length of title (longer = more specific)
 * - Number of unique/rare words
 * - Presence of industry-specific terms
 */
function calculateSpecificityBoost(
  input: IdeaInput,
  competitors: SearchResult[]
): number {
  const ideaText = `${input.title} ${input.description}`.toLowerCase();
  const words = ideaText.match(/\b[a-z]{4,}\b/g) || [];

  let specificityScore = 0;

  // 1. Title length bonus (longer titles = more specific)
  // "Weather app" (2 words) vs "AR furniture visualization for tiny homes" (6 words)
  const titleWords = input.title.split(/\s+/).length;
  if (titleWords >= 6) specificityScore += 0.4;
  else if (titleWords >= 4) specificityScore += 0.2;

  // 2. Rare/technical term bonus
  const rareTerms = [
    "quantum",
    "blockchain",
    "augmented",
    "decentralized",
    "construction",
    "post-quantum",
    "cryptography",
    "resistant",
    "visualization",
    "tiny",
  ];
  const rareTermCount = words.filter((w) => rareTerms.includes(w)).length;
  if (rareTermCount >= 3) specificityScore += 0.4;
  else if (rareTermCount >= 2) specificityScore += 0.2;

  // 3. Industry/niche combination bonus
  // Check for patterns like "[industry] + [generic thing]"
  const industries = [
    "medical",
    "construction",
    "healthcare",
    "legal",
    "finance",
    "education",
  ];
  const genericTerms = ["app", "tool", "platform", "software", "system"];
  const hasIndustry = words.some((w) => industries.includes(w));
  const hasGeneric = words.some((w) => genericTerms.includes(w));
  if (hasIndustry && hasGeneric) specificityScore += 0.3;

  return Math.min(specificityScore, 1); // Cap at 1
}

/**
 * Generate a simple explanation of the score.
 */
function generateExplanation(
  closeCompetitors: number,
  totalCompetitors: number,
  top5Avg: number,
  maxSimilarity: number,
  keywords: string[]
): string {
  if (closeCompetitors === 0) {
    return `We found ${totalCompetitors} products but none with high similarity (>60%). Your idea appears to target a unique niche.`;
  }

  if (closeCompetitors >= 5) {
    return `We found ${closeCompetitors} highly similar products with ${(
      top5Avg * 100
    ).toFixed(0)}% average match in top 5. Common themes include: ${keywords
      .slice(0, 3)
      .join(", ")}.`;
  }

  if (maxSimilarity > 0.7) {
    return `Found ${totalCompetitors} similar tools with high overlap. Top competitor is ${(
      maxSimilarity * 100
    ).toFixed(0)}% similar with keywords like "${keywords
      .slice(0, 3)
      .join(", ")}".`;
  }

  return `Your idea has ${(top5Avg * 100).toFixed(
    0
  )}% average similarity to top competitors from ${totalCompetitors} products — suggesting some competition but room for differentiation.`;
}

/**
 * Extract niche/audience terms from the idea.
 * These are specific segments like "for X", "construction workers", "tiny homes", etc.
 */
function extractNicheTerms(input: IdeaInput): string[] {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const nicheTerms: string[] = [];

  // Pattern 1: "for X" phrases (e.g., "for construction workers", "for dog owners")
  const forPatterns = text.match(
    /for ([a-z\s]+?)(?:\s+(?:who|that|with|in|$))/g
  );
  if (forPatterns) {
    forPatterns.forEach((match) => {
      const term = match
        .replace(/^for\s+/, "")
        .replace(/\s+(who|that|with|in)$/, "")
        .trim();
      if (term.length > 3 && term.split(" ").length <= 4) {
        nicheTerms.push(term);
      }
    });
  }

  // Pattern 2: Industry-specific terms
  const industries = [
    "construction",
    "healthcare",
    "medical",
    "finance",
    "legal",
    "education",
    "real estate",
    "retail",
    "restaurant",
    "manufacturing",
    "logistics",
    "enterprise",
    "b2b",
    "saas",
    "startup",
    "freelance",
  ];
  industries.forEach((industry) => {
    if (text.includes(industry)) {
      nicheTerms.push(industry);
    }
  });

  // Pattern 3: Specific demographics
  const demographics = [
    "tiny homes",
    "small business",
    "remote workers",
    "students",
    "seniors",
    "parents",
    "kids",
    "children",
    "teenagers",
    "professionals",
    "developers",
    "designers",
    "writers",
    "artists",
    "musicians",
    "gamers",
  ];
  demographics.forEach((demo) => {
    if (text.includes(demo)) {
      nicheTerms.push(demo);
    }
  });

  // Pattern 4: Compound terms like "construction workers", "dog owners"
  const compoundPattern = text.match(
    /([a-z]+)\s+(workers|owners|users|professionals|experts|enthusiasts|lovers)/g
  );
  if (compoundPattern) {
    compoundPattern.forEach((term) => nicheTerms.push(term));
  }

  return [...new Set(nicheTerms)]; // Deduplicate
}

/**
 * Check if a competitor mentions the niche terms.
 * If the idea is "voice journaling for construction workers",
 * generic "voice journaling" apps shouldn't count as strong competitors.
 */
function competitorMatchesNiche(
  competitor: SearchResult,
  nicheTerms: string[]
): boolean {
  if (nicheTerms.length === 0) return true; // No niche = all competitors count

  const competitorText =
    `${competitor.title} ${competitor.description}`.toLowerCase();

  // Competitor matches niche if it mentions ANY of the niche terms
  const matches = nicheTerms.some((term) => competitorText.includes(term));
  return matches;
}

/**
 * Detect if a search result is an academic/research source.
 * Academic papers inflate saturation scores for novel commercial ideas.
 */
function isAcademicSource(result: SearchResult): boolean {
  const url = result.url.toLowerCase();
  const title = result.title.toLowerCase();

  // Academic URL patterns
  const academicDomains = [
    ".edu",
    "sciencedirect.com",
    "researchgate.net",
    "arxiv.org",
    "ieee.org",
    "acm.org",
    "springer.com",
    "nature.com",
    "scholar.google",
    "pubmed",
    "ncbi.nlm.nih.gov",
    "semanticscholar.org",
    "jstor.org",
    "wiley.com",
    "tandfonline.com",
    "mdpi.com",
    "frontiersin.org",
  ];

  // Check URL
  if (academicDomains.some((domain) => url.includes(domain))) {
    return true;
  }

  // Academic journal/publication patterns in title
  const academicPatterns = [
    "scientific reports",
    "journal of",
    "proceedings of",
    "international conference",
    "research paper",
    "ieee",
    "acm",
    "colab",
    "cluster computing",
    "| science",
    "nature communications",
    "framework for",
    "system for",
    "novel approach",
    "proposed method",
  ];

  if (academicPatterns.some((pattern) => title.includes(pattern))) {
    return true;
  }

  // Academic paper title patterns (formal, research-style titles)
  // Typically: "A [Technical] [System/Method/Framework] for [Purpose]"
  if (
    title.match(/^a [a-z-]+ (blockchain|system|framework|method|approach)/i)
  ) {
    return true;
  }

  return false;
}

/**
 * Search for competitors using multiple sources.
 * Runs all searches in parallel for speed.
 * Filters out academic/research papers to focus on commercial competition.
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

  // Filter out academic sources - focus on commercial products
  const commercialResults = unique.filter(
    (result) => !isAcademicSource(result)
  );
  const academicCount = unique.length - commercialResults.length;

  console.log(
    `Found ${unique.length} unique competitors across ${sources.length} sources (${academicCount} academic filtered)`
  );
  return commercialResults.slice(0, 50); // Cap at 50 total results
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
 * Generate actionable differentiation suggestions (2-3 bullets).
 */
function generateSuggestions(
  score: number,
  closeCompetitors: number,
  input: IdeaInput,
  topCompetitors: Array<{
    title: string;
    snippet: string;
    url: string;
    similarity: number;
  }>
): string[] {
  const suggestions: string[] = [];

  // Suggestion 1: Market-based advice
  if (closeCompetitors > 5) {
    suggestions.push(
      "Target a narrower audience (e.g., specific industry or user segment) instead of everyone."
    );
  } else if (closeCompetitors === 0) {
    suggestions.push(
      "Your idea appears unique — focus on validating demand before building."
    );
  } else {
    suggestions.push(
      "Consider what makes your approach different from the top 3 competitors listed above."
    );
  }

  // Suggestion 2: Feature-based differentiation
  if (score < 50) {
    suggestions.push(
      "Focus on one unique feature or workflow that competitors don't emphasize."
    );
  } else {
    suggestions.push(
      "Your idea has differentiation potential — emphasize what makes it unique in your messaging."
    );
  }

  // Suggestion 3: Industry specialization
  suggestions.push(
    "Your idea could stand out by specializing in a specific industry or use case."
  );

  return suggestions.slice(0, 3); // Max 3 suggestions
}
