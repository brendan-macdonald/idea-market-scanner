import { NextRequest, NextResponse } from "next/server";
import { analyzeIdea } from "@/lib/services/analysis-service";
import type { IdeaInput } from "@/lib/types/analysis";

/**
 * POST /api/analyze
 *
 * Simple API route - just validate input and call analyzeIdea().
 * All logic is in the service layer.
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

    // Call the simplified analysis service
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
