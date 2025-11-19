import type { SearchResult } from "./search";

//Represents the user's idea input.
//(minimal for MVP)
export interface IdeaInput {
  title: string;
  description: string;
}

//Competition levels for market saturation

export type CompetitionLevel = "Low" | "Medium" | "High" | "Very High";

//Result of analyzing an idea
//Contract between our service and the API/UI

export interface AnalysisResult {
  /** A score from 0-100 indicating how "original" the idea seems */
  originalityScore: number;

  /** How crowded the market is for this type of idea */
  competitionLevel: CompetitionLevel;

  /** Top 3 closest competitors (for focused display) */
  topCompetitors: Array<{
    title: string;
    snippet: string;
    url: string;
    similarity: number;
  }>;

  /** Count of highly similar products found */
  similarCount: number;

  /** Simple explanation of why we scored it this way */
  explanation: string;

  /** Actionable differentiation suggestions (2-3 bullets) */
  suggestions: string[];

  /** Common keywords/themes found across idea + competitors */
  keywords: string[];

  /** Unique feature detected in the idea (if any) */
  uniqueAngle?: string;

  /** All similar products found via web search (for detailed view) */
  similarProducts?: SearchResult[];
}
