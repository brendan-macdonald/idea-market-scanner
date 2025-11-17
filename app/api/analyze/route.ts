import { NextRequest, NextResponse } from "next/server";
import { analyzeIdea } from "@/lib/services/analysis-service";
import type { IdeaInput } from "@/lib/types/analysis";

/**
 * POST /api/analyze
 *
 * Accepts an idea and returns an analysis.
 * This is a "thin" HTTP layer — validation + calling the service.
 */

export async function POST(request: NextRequest) {
  try {
    //parse request body
    const body = await request.json();

    //validate input
    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    //type-safe after validation
    const input: IdeaInput = {
      title: body.title,
      description: body.description,
    };

    //call business logic
    const result = await analyzeIdea(input);

    //return result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error analyzing idea:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

//Validates request body
//Returns an error message if invalid, null if valid.

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

  return null; //valid input
}
