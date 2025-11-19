"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types/analysis";
import AnalysisResults from "./components/AnalysisResults";

export default function HomePage() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Response state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  /**
   * Handles form submission with streaming progress updates.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous state
    setError(null);
    setResult(null);
    setIsLoading(true);
    setProgressStatus("Starting analysis...");
    setProgressPercent(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        return;
      }

      // Check if we got a stream or regular JSON
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = ""; // Accumulate incomplete lines

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and add to buffer
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonData = line.slice(6);
              try {
                const data = JSON.parse(jsonData);

                if (data.status === "complete" && data.result) {
                  setResult(data.result);
                  setProgressStatus("Complete!");
                  setProgressPercent(100);
                } else if (data.status === "error") {
                  setError(data.error || "Analysis failed");
                } else {
                  setProgressStatus(data.status || "Processing...");
                  setProgressPercent(data.progress || 0);
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } else {
        // Fallback: regular JSON response
        const data = await response.json();
        setResult(data);
        setProgressStatus("Complete!");
        setProgressPercent(100);
      }
    } catch (err) {
      // Network error or JSON parse error
      setError("Failed to connect to the server");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFB3BA] p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div className="bg-[#5DADE2] border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Seenit
          </h1>
        </div>
        <nav className="flex gap-4">
          <a
            href="#"
            className="text-black font-bold hover:underline text-lg hidden sm:block"
          >
            Docs
          </a>
          <a
            href="https://github.com/brendan-macdonald/idea-market-scanner"
            className="text-black font-bold hover:underline text-lg hidden sm:block"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto">
        {/* Search Box */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          {/* Title Bar */}
          <div className="bg-[#5DADE2] border-b-4 border-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border-2 border-black"></div>
              <div className="w-4 h-4 bg-yellow-400 border-2 border-black"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4 leading-tight">
              Is your app idea
              <br />
              original or saturated?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Quickly find out the originality of your app idea
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="🔍 Project management tool with automated task tracking"
                className="w-full px-4 py-3 border-4 border-black text-black placeholder-gray-500 focus:outline-none focus:ring-0 font-medium"
                required
                minLength={3}
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your idea in more detail..."
                rows={3}
                className="w-full px-4 py-3 border-4 border-black text-black placeholder-gray-500 focus:outline-none focus:ring-0"
                required
                minLength={10}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFD93D] border-4 border-black px-8 py-3 font-bold text-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </form>

            {/* Progress Indicator */}
            {isLoading && (
              <div className="mt-6 p-4 bg-[#5DADE2] border-4 border-black">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-black font-bold text-sm">
                    {progressStatus || "Starting analysis..."}
                  </p>
                  <span className="text-black font-bold text-sm">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-white border-2 border-black h-6">
                  <div
                    className="bg-[#6BCF7F] h-full border-r-2 border-black transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-100 border-4 border-black">
                <p className="text-red-800 font-bold">❌ {error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && <AnalysisResults result={result} />}
      </main>
    </div>
  );
}
