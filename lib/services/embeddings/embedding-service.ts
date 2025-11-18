import OpenAI from "openai";
import type { Embedding, EmbeddingRequest } from "@/lib/types/embedding";

/**
 * Service for generating text embeddings using OpenAI.
 * Handles API calls, batching, and error handling.
 */
export class EmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "text-embedding-3-small") {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generates an embedding for a single piece of text.
   *
   * @param text - The text to embed
   * @returns A 1536-dimensional vector
   */
  async embed(text: string): Promise<Embedding> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw new Error(
        `Failed to generate embedding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generates embeddings for multiple texts in a single API call.
   * More efficient than calling embed() multiple times.
   *
   * OpenAI allows up to 2048 inputs per request.
   *
   * @param texts - Array of texts to embed
   * @returns Array of embeddings in the same order
   */
  async embedBatch(texts: string[]): Promise<Embedding[]> {
    if (texts.length === 0) {
      return [];
    }

    if (texts.length > 2048) {
      throw new Error("Cannot embed more than 2048 texts at once");
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      // Sort by index to ensure correct order
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      console.error("Batch embedding generation failed:", error);
      throw new Error(
        `Failed to generate embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

/**
 * Factory function to create an embedding service.
 * Reads API key from environment variables.
 */
export function createEmbeddingService(): EmbeddingService {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. " +
        "Please add it to your .env.local file."
    );
  }

  return new EmbeddingService(apiKey);
}
