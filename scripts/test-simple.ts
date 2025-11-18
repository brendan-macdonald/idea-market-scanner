/**
 * Simple test of the simplified analysis service.
 */
import { analyzeIdea } from "@/lib/services/analysis-service";

async function test() {
  const ideas = [
    {
      title: "AI-powered task management app",
      description: "A smart todo app that uses AI to prioritize tasks",
    },
    {
      title: "Dating app for dog owners",
      description:
        "A dating platform that matches people based on their dogs' compatibility",
    },
  ];

  for (const idea of ideas) {
    console.log("\n" + "=".repeat(70));
    console.log(`\n📝 ${idea.title}\n`);

    const result = await analyzeIdea(idea);

    console.log(
      `\n✅ Score: ${result.originalityScore}/100 (${result.competitionLevel})`
    );
    console.log(`   Competitors found: ${result.similarProducts?.length || 0}`);
    console.log(`\n💡 Suggestions:`);
    result.suggestions.forEach((s) => console.log(`   - ${s}`));

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

test();
