"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types/analysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

/**
 * Displays the analysis results in a retro 8-bit aesthetic.
 */
export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saturation Score Card */}
        <div className="bg-[#B4E380] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#B4E380] border-b-4 border-black p-3">
            <h3 className="text-lg font-bold text-black">Saturation Score</h3>
          </div>
          <div className="p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-6xl font-bold text-black">
                {result.originalityScore}
              </span>
              <span className="text-2xl font-bold text-black uppercase">
                {getScoreLabel(result.originalityScore)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white border-2 border-black h-8 mb-4">
              <div
                className={`h-full border-r-2 border-black transition-all duration-500 ${getScoreBarColor(
                  result.originalityScore
                )}`}
                style={{ width: `${result.originalityScore}%` }}
              />
            </div>

            <p className="text-sm text-black font-medium">
              {result.explanation}
            </p>
          </div>
        </div>

        {/* Top Competitors Card */}
        <div className="bg-[#C39BD3] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#C39BD3] border-b-4 border-black p-3">
            <h3 className="text-lg font-bold text-black">Top Competitors</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 mb-4">
              {result.topCompetitors && result.topCompetitors.length > 0 ? (
                result.topCompetitors.map((competitor, index) => (
                  <a
                    key={index}
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border-2 border-black p-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-[#5DADE2] border-2 border-black flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-black text-sm mb-1 truncate">
                          {competitor.title}
                        </div>
                        <div className="text-xs text-gray-700 line-clamp-2">
                          {competitor.snippet}
                        </div>
                        {competitor.similarity !== undefined && (
                          <div className="mt-1 text-xs font-bold text-black">
                            {(competitor.similarity * 100).toFixed(0)}% match
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-black">
                  No direct competitors found!
                </p>
              )}
            </div>

            {/* View More Button */}
            {result.similarProducts && result.similarProducts.length > 3 && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-white border-2 border-black px-4 py-2 font-bold text-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                View More ({result.similarProducts.length} total)
              </button>
            )}
          </div>
        </div>

        {/* Combined Tips/Suggestions Card - Spans full width */}
        <div className="md:col-span-2 bg-[#FFB3E6] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FFB3E6] border-b-4 border-black p-3">
            <h3 className="text-lg font-bold text-black">Tips & Suggestions</h3>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-black"
                >
                  <span className="text-black font-bold flex-shrink-0">■</span>
                  <span className="font-medium">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal for All Competitors */}
      {showModal && (
        <div className="fixed inset-0 bg-[#FFB3BA] bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#C39BD3] border-b-4 border-black p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">
                All Competitors ({result.similarProducts?.length || 0})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-500 border-2 border-black w-8 h-8 flex items-center justify-center font-bold text-black hover:bg-red-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {result.similarProducts?.map((product, index) => (
                  <a
                    key={product.id || index}
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border-2 border-black p-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#5DADE2] border-2 border-black flex-shrink-0 flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-black text-sm mb-1">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-700 mb-2 line-clamp-2">
                          {product.description}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {product.similarity !== undefined && (
                            <span className="text-xs font-bold text-black bg-yellow-200 border border-black px-2 py-0.5">
                              {(product.similarity * 100).toFixed(0)}% match
                            </span>
                          )}
                          {product.source && (
                            <span className="text-xs font-bold text-black bg-blue-200 border border-black px-2 py-0.5">
                              {getSourceDisplayName(product.source)}
                            </span>
                          )}
                          {product.domain && (
                            <span className="text-xs text-gray-600">
                              {product.domain}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Returns label based on score
 */
function getScoreLabel(score: number): string {
  if (score >= 70) return "UNIQUE";
  if (score >= 50) return "GOOD";
  if (score >= 30) return "COMPETITIVE";
  return "SATURATED";
}

/**
 * Returns color class for progress bar
 */
function getScoreBarColor(score: number): string {
  if (score >= 70) return "bg-[#6BCF7F]"; // Green - unique
  if (score >= 50) return "bg-[#FFD93D]"; // Yellow - good
  if (score >= 30) return "bg-[#FFB366]"; // Orange - competitive
  return "bg-[#FF6B6B]"; // Red - saturated
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
