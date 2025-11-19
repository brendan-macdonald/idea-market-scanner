/**
 * Simple test of the simplified analysis service.
 */
import { analyzeIdea } from "@/lib/services/analysis-service";

async function test() {
  const ideas = [
    {
      title: "AI-powered task management app",
      description:
        "A smart todo app that uses AI to prioritize tasks based on urgency and importance",
    },
    {
      title: "Dating app for dog owners",
      description:
        "A dating platform that matches people based on their dogs' compatibility and breeds",
    },
  ];

  for (const idea of ideas) {
    console.log("\n" + "=".repeat(80));
    console.log(`\n📝 Testing: ${idea.title}\n`);

    const result = await analyzeIdea(idea);

    // 1. Score & Competition Level
    console.log(
      `✅ Originality Score: ${result.originalityScore}/100 (${result.competitionLevel} Competition)`
    );

    // 2. Count of similar competitors
    console.log(
      `📊 Found ${result.similarCount} highly similar products (${
        result.similarProducts?.length || 0
      } total)`
    );

    // 3. Top 3 Competitors
    if (result.topCompetitors.length > 0) {
      console.log(`\n🔍 Top 3 Closest Competitors:\n`);
      result.topCompetitors.forEach((comp, i) => {
        console.log(
          `   ${i + 1}. ${comp.title} — ${(comp.similarity * 100).toFixed(
            0
          )}% match`
        );
        console.log(`      "${comp.snippet}"`);
        console.log(`      ${comp.url}\n`);
      });
    }

    // 4. Explanation
    console.log(`💡 Why we scored it this way:`);
    console.log(`   ${result.explanation}\n`);

    // 5. Keywords
    if (result.keywords.length > 0) {
      console.log(`🏷️  Common themes: ${result.keywords.join(", ")}\n`);
    }

    // 6. Unique Angle
    if (result.uniqueAngle) {
      console.log(`✨ ${result.uniqueAngle}\n`);
    }

    // 7. Differentiation Suggestions
    console.log(`🎯 Differentiation Suggestions:`);
    result.suggestions.forEach((s) => console.log(`   • ${s}`));

    // Delay between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

test();
