import { NextRequest, NextResponse } from "next/server";
import { analyzeIdea } from "@/lib/services/analysis-service";
import type { IdeaInput } from "@/lib/types/analysis";

/**
 * POST /api/analyze
 *
 * Supports streaming progress updates via Server-Sent Events (SSE).
 * Client can set Accept: text/event-stream for progress updates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const input: IdeaInput = {
      title: body.title,
      description: body.description,
    };

    // Check if client wants streaming progress
    const acceptHeader = request.headers.get("accept") || "";
    const wantsStream = acceptHeader.includes("text/event-stream");

    if (wantsStream) {
      // Stream progress updates
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Call analysis with progress callback
            const result = await analyzeIdea(input, {
              onProgress: (status: string, progress: number) => {
                // Send progress update as SSE
                const data = JSON.stringify({ status, progress });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              },
            });

            // Send final result
            const finalData = JSON.stringify({ 
              status: "complete", 
              progress: 100, 
              result 
            });
            controller.enqueue(
              encoder.encode(`data: ${finalData}\n\n`)
            );
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            const errorData = JSON.stringify({ 
              status: "error", 
              error: "Analysis failed" 
            });
            controller.enqueue(
              encoder.encode(`data: ${errorData}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming: just return the result
    const result = await analyzeIdea(input);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error analyzing idea:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function validateInput(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const { title, description } = body as Record<string, unknown>;

  if (!title || typeof title !== "string") {
    return "Title is required and must be a string";
  }

  if (!description || typeof description !== "string") {
    return "Description is required and must be a string";
  }

  if (title.trim().length < 3) {
    return "Title must be at least 3 characters";
  }

  if (description.trim().length < 10) {
    return "Description must be at least 10 characters";
  }

  return null;
}
