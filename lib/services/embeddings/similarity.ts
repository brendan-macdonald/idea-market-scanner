import type { Embedding } from "@/lib/types/embedding";

/**
 * Calculates the dot product of two vectors.
 * (step in cosine similarity calculation)
 *
 * Pure function: no side effects, same input = same output.
 */
function dotProduct(vecA: Embedding, vecB: Embedding): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
}

/**
 * Calculates the magnitude (length) of a vector.
 * Used in cosine similarity normalization.
 */
function magnitude(vec: Embedding): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Calculates cosine similarity between two embeddings.
 * Returns a value between -1 and 1 (usually 0-1 for text).
 *
 * 1.0 = identical meaning
 * 0.0 = completely unrelated
 *
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 */
export function cosineSimilarity(vecA: Embedding, vecB: Embedding): number {
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (magA * magB);
}

/**
 * Finds the average similarity between one embedding and multiple others.
 * Useful for comparing an idea against multiple competitors.
 */
export function averageSimilarity(
  target: Embedding,
  comparisons: Embedding[]
): number {
  if (comparisons.length === 0) {
    return 0;
  }

  const similarities = comparisons.map((comp) =>
    cosineSimilarity(target, comp)
  );

  const sum = similarities.reduce((acc, sim) => acc + sim, 0);
  return sum / similarities.length;
}

/**
 * Finds the maximum (highest) similarity.
 * Useful for finding the most similar competitor.
 */
export function maxSimilarity(
  target: Embedding,
  comparisons: Embedding[]
): number {
  if (comparisons.length === 0) {
    return 0;
  }

  const similarities = comparisons.map((comp) =>
    cosineSimilarity(target, comp)
  );

  return Math.max(...similarities);
}
