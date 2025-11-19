/**
 * Comprehensive test with predictions.
 * Let's test various ideas across the saturation spectrum and see if our scores align.
 */
import { analyzeIdea } from "@/lib/services/analysis-service";

interface TestCase {
  title: string;
  description: string;
  expectedScore: number; // 0-100, our prediction
  expectedLevel: string; // Very High, High, Medium, Low
  reasoning: string;
}

const testCases: TestCase[] = [
  {
    title: "AI-powered task management app",
    description:
      "A smart todo app that uses AI to prioritize tasks based on urgency and importance",
    expectedScore: 25,
    expectedLevel: "Very High",
    reasoning:
      "Extremely saturated - Todoist, Motion, ClickUp, Asana all have AI features. Dozens of competitors.",
  },
  {
    title: "Dating app for dog owners",
    description:
      "A dating platform that matches people based on their dogs' compatibility and breeds",
    expectedScore: 45,
    expectedLevel: "High",
    reasoning:
      "Multiple direct competitors exist (Dig, FetchaDate, Tindog, PetMeet) but still a niche market.",
  },
  {
    title: "Project management tool",
    description:
      "A web-based tool for teams to collaborate on projects and track progress",
    expectedScore: 15,
    expectedLevel: "Very High",
    reasoning:
      "One of the most saturated SaaS categories - Jira, Asana, Monday, Trello, ClickUp, etc.",
  },
  {
    title: "Pomodoro timer app",
    description:
      "A simple timer app that helps you focus using the Pomodoro technique",
    expectedScore: 20,
    expectedLevel: "Very High",
    reasoning:
      "Hundreds of pomodoro apps exist across all platforms. Very simple and heavily replicated.",
  },
  {
    title: "Recipe app with meal planning",
    description:
      "An app that helps you discover recipes and plan your weekly meals",
    expectedScore: 30,
    expectedLevel: "Very High",
    reasoning:
      "Many recipe apps exist (Yummly, Mealime, Paprika, etc.) with meal planning features.",
  },
  {
    title: "Meditation app for anxiety",
    description:
      "A guided meditation app specifically designed to help reduce anxiety and stress",
    expectedScore: 35,
    expectedLevel: "High",
    reasoning:
      "Headspace, Calm, Insight Timer dominate, but 'anxiety-specific' adds some niche focus.",
  },
  {
    title: "Quantum-resistant blockchain for medical records",
    description:
      "A decentralized system using post-quantum cryptography to secure patient health data",
    expectedScore: 75,
    expectedLevel: "Low",
    reasoning:
      "Very niche combination - quantum-resistant crypto + medical records + blockchain is rare.",
  },
  {
    title: "AR furniture visualization for tiny homes",
    description:
      "Augmented reality app that shows how furniture fits in spaces under 400 sq ft",
    expectedScore: 65,
    expectedLevel: "Medium",
    reasoning:
      "IKEA Place exists for AR furniture, but 'tiny homes' specific angle is more niche.",
  },
  {
    title: "Voice journaling app for construction workers",
    description:
      "A hands-free voice journal app designed for documenting daily work on construction sites",
    expectedScore: 70,
    expectedLevel: "Medium",
    reasoning:
      "Voice journaling exists broadly, but construction worker niche is very specific and underserved.",
  },
  {
    title: "Weather app",
    description:
      "An app that shows current weather conditions and forecasts for your location",
    expectedScore: 10,
    expectedLevel: "Very High",
    reasoning:
      "One of the most saturated app categories - hundreds of weather apps, built into every OS.",
  },
];

async function runTests() {
  console.log("\n" + "=".repeat(90));
  console.log("IDEA SATURATION ANALYSIS - PREDICTION vs REALITY TEST");
  console.log("=".repeat(90) + "\n");

  let totalDifference = 0;
  const results: Array<{
    title: string;
    expected: number;
    actual: number;
    diff: number;
    match: boolean;
  }> = [];

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.title}`);
    console.log(
      `   Expected: ${testCase.expectedScore}/100 (${testCase.expectedLevel})`
    );
    console.log(`   Reasoning: ${testCase.reasoning}`);

    const result = await analyzeIdea({
      title: testCase.title,
      description: testCase.description,
    });

    const difference = Math.abs(
      result.originalityScore - testCase.expectedScore
    );
    const levelMatch = result.competitionLevel === testCase.expectedLevel;

    console.log(
      `\n   ✅ Actual: ${result.originalityScore}/100 (${result.competitionLevel})`
    );
    console.log(`   📊 Difference: ${difference} points`);
    console.log(`   🎯 Level Match: ${levelMatch ? "✓ MATCH" : "✗ MISMATCH"}`);
    console.log(`   💬 ${result.explanation}`);

    if (result.topCompetitors.length > 0) {
      console.log(
        `\n   Top competitor: ${result.topCompetitors[0].title} (${(
          result.topCompetitors[0].similarity * 100
        ).toFixed(0)}% match)`
      );
    }

    totalDifference += difference;
    results.push({
      title: testCase.title,
      expected: testCase.expectedScore,
      actual: result.originalityScore,
      diff: difference,
      match: levelMatch,
    });

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Summary
  console.log("\n" + "=".repeat(90));
  console.log("SUMMARY");
  console.log("=".repeat(90) + "\n");

  const avgDifference = totalDifference / testCases.length;
  const levelMatches = results.filter((r) => r.match).length;
  const accuracy = (levelMatches / testCases.length) * 100;

  console.log(`Average score difference: ${avgDifference.toFixed(1)} points`);
  console.log(
    `Competition level accuracy: ${levelMatches}/${
      testCases.length
    } (${accuracy.toFixed(0)}%)\n`
  );

  console.log("Detailed Results:");
  console.log("-".repeat(90));
  results.forEach((r) => {
    const status = r.match ? "✓" : "✗";
    console.log(
      `${status} ${r.title.padEnd(55)} | Expected: ${r.expected
        .toString()
        .padStart(2)}  Actual: ${r.actual
        .toString()
        .padStart(2)}  Diff: ${r.diff.toString().padStart(2)}`
    );
  });

  console.log("\n" + "=".repeat(90));
  console.log("\n🎯 Analysis:");
  if (avgDifference < 10) {
    console.log(
      "   ✅ Excellent accuracy! Scores are very close to predictions."
    );
  } else if (avgDifference < 20) {
    console.log("   ✓ Good accuracy. Some fine-tuning might help.");
  } else {
    console.log("   ⚠️  Significant variance. Algorithm may need adjustment.");
  }

  if (accuracy >= 80) {
    console.log("   ✅ Competition level classification is highly accurate.");
  } else if (accuracy >= 60) {
    console.log(
      "   ✓ Competition level classification is decent but could improve."
    );
  } else {
    console.log("   ⚠️  Competition level classification needs improvement.");
  }

  console.log("\n");
}

runTests();
