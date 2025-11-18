import type { AnalysisResult } from "@/lib/types/analysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

/**
 * Displays the analysis results in a clean, readable format.
 * Pure presentational component — no logic, just display.
 */
export default function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>

      {/* Originality Score */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Originality Score
          </span>
          <span className="text-2xl font-bold text-indigo-600">
            {result.originalityScore}/100
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${result.originalityScore}%` }}
          />
        </div>
      </div>

      {/* Competition Level */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Competition Level
        </h3>
        <div className="flex items-center">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${getCompetitionColor(
              result.competitionLevel
            )}`}
          >
            {result.competitionLevel}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
        <ul className="space-y-2">
          {result.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start text-gray-700 text-sm">
              <span className="text-indigo-600 mr-2 flex-shrink-0">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Returns Tailwind classes based on competition level.
 * Helper function keeps the JSX clean.
 */
function getCompetitionColor(
  level: AnalysisResult["competitionLevel"]
): string {
  switch (level) {
    case "Low":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "High":
      return "bg-orange-100 text-orange-800";
    case "Very High":
      return "bg-red-100 text-red-800";
  }
}
