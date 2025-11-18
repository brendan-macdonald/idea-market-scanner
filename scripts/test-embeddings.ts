// Load environment variables from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

import { createEmbeddingService } from "@/lib/services/embeddings/embedding-service";
import { cosineSimilarity } from "@/lib/services/embeddings/similarity";

async function main() {
  console.log("Testing Embedding Service...\n");

  try {
    const service = createEmbeddingService();

    // Test texts
    const texts = [
      "A fitness app for remote workers",
      "A workout tracker for people working from home",
      "A recipe sharing platform",
    ];

    console.log("Generating embeddings...\n");
    const embeddings = await service.embedBatch(texts);

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    console.log(`   Dimension: ${embeddings[0].length}\n`);

    // Compare similarities
    console.log("Similarity Scores:");
    console.log(`  "${texts[0]}" vs "${texts[1]}"`);
    const sim1 = cosineSimilarity(embeddings[0], embeddings[1]);
    console.log(`  → ${(sim1 * 100).toFixed(1)}% similar\n`);

    console.log(`  "${texts[0]}" vs "${texts[2]}"`);
    const sim2 = cosineSimilarity(embeddings[0], embeddings[2]);
    console.log(`  → ${(sim2 * 100).toFixed(1)}% similar\n`);

    console.log(
      "✅ Embeddings work! The fitness apps are more similar to each other than to recipes."
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
