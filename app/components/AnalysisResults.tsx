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

      {/* Similar Products (Phase 2A) */}
      {result.similarProducts && result.similarProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Similar Products Found ({result.similarProducts.length})
          </h3>
          <div className="space-y-3">
            {result.similarProducts.map((product) => (
              <a
                key={product.id}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 hover:text-indigo-600">
                        {product.title}
                      </h4>
                      {product.source && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getSourceBadgeColor(
                            product.source
                          )}`}
                        >
                          {getSourceDisplayName(product.source)}
                        </span>
                      )}
                    </div>
                    {product.domain && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.domain}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
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

/**
 * Returns Tailwind classes for source badge based on the source name.
 */
function getSourceBadgeColor(source: string): string {
  switch (source) {
    case "hacker-news":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "itunes":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "brave-search":
    case "brave":
      return "bg-purple-50 text-purple-700 border border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

/**
 * Returns human-readable display name for the source.
 */
function getSourceDisplayName(source: string): string {
  switch (source) {
    case "hacker-news":
      return "Hacker News";
    case "itunes":
      return "App Store";
    case "brave-search":
    case "brave":
      return "Web";
    default:
      return source;
  }
}
