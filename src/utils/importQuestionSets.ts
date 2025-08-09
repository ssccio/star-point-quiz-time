/**
 * Utility to import YAML question sets into the database
 * Run this once to populate the question_sets and questions tables
 */

import { questionSetService } from "@/lib/questionSetService";
import {
  loadQuestionsFromYAML,
  getAvailableQuestionSets,
} from "./questionLoader";

export async function importAllQuestionSets() {
  const results: { name: string; status: string; error?: string }[] = [];

  try {
    // Get all available YAML question sets
    const yamlSets = getAvailableQuestionSets();

    for (const yamlSet of yamlSets) {
      try {
        console.log(`Importing ${yamlSet.title}...`);

        // Load the questions from YAML
        const questionData = await loadQuestionsFromYAML(
          `${yamlSet.id}.yaml`,
          false,
          false
        );

        // Check if this set already exists in the database
        const existingSets = await questionSetService.getQuestionSets(true);
        const exists = existingSets.some((s) => s.name === yamlSet.title);

        if (exists) {
          console.log(`Skipping ${yamlSet.title} - already exists`);
          results.push({
            name: yamlSet.title,
            status: "skipped",
            error: "Already exists in database",
          });
          continue;
        }

        // Import to database
        const setId = await questionSetService.importFromYAML(
          yamlSet.title,
          questionData
        );

        console.log(`Successfully imported ${yamlSet.title} with ID: ${setId}`);
        results.push({ name: yamlSet.title, status: "success" });
      } catch (error) {
        console.error("Failed to import:", yamlSet.title, error);
        results.push({
          name: yamlSet.title,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log summary
    console.log("\n=== Import Summary ===");
    const successful = results.filter((r) => r.status === "success").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const failed = results.filter((r) => r.status === "error").length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailed imports:");
      results
        .filter((r) => r.status === "error")
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    return results;
  } catch (error) {
    console.error("Failed to import question sets:", error);
    throw error;
  }
}

/**
 * Import a single YAML file to the database
 */
export async function importSingleQuestionSet(yamlFile: string) {
  try {
    // Load the questions from YAML
    const questionData = await loadQuestionsFromYAML(yamlFile, false, false);

    // Extract name from metadata or file
    const name = questionData.metadata.title || yamlFile.replace(".yaml", "");

    // Check if already exists
    const existingSets = await questionSetService.getQuestionSets(true);
    const exists = existingSets.some((s) => s.name === name);

    if (exists) {
      throw new Error(`Question set "${name}" already exists in database`);
    }

    // Import to database
    const setId = await questionSetService.importFromYAML(name, questionData);

    console.log(`Successfully imported "${name}" with ID: ${setId}`);
    return setId;
  } catch (error) {
    console.error("Failed to import:", yamlFile, error);
    throw error;
  }
}
