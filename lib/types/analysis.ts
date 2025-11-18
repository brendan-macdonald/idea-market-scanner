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

  /** Actionable suggestions for the user */
  suggestions: string[];

  /** Similar products found via web search */
  similarProducts?: SearchResult[];
}
