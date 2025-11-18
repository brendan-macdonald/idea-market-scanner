/**
 * A vector embedding representation of text.
 * OpenAI returns 1536-dimensional vectors.
 */
export type Embedding = number[];

//Result of comparing two embeddings
export interface SimilarityResult {
  //Cosine similarity score (0-1, where 1 = identical)
  similarity: number;

  //What is being compared
  comparedTo: string;
}

//Request to generate an embedding
export interface EmbeddingRequest {
  text: string;
  model?: string;
}
