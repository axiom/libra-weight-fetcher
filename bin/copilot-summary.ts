/**
 * Generates a demotivational weight-tracking summary via GitHub Copilot CLI.
 *
 * Usage:
 *   bun run bin/copilot-summary.ts              # call Copilot and print summary
 *   bun run bin/copilot-summary.ts --prompt-only # print prompt text and exit
 *   bun run bin/copilot-summary.ts --json       # print raw JSON output
 *
 * Requires COPILOT_GITHUB_TOKEN to be set (a GitHub PAT with "Copilot Requests"
 * permission) unless --prompt-only is given.
 */
import { $ } from "bun";
import type { WeightEntry } from "../src/shared";
import rawWeights from "../src/weights.json";
import {
  applyDefaultSmoothing,
  buildKpiData,
  buildPrompt,
  type DemotivationalSummary,
  parseCoilotResponse,
} from "./copilot-summary.logic";

const promptOnly = process.argv.includes("--prompt-only");
const jsonOutput = process.argv.includes("--json");

if (!promptOnly && !jsonOutput && !process.env.COPILOT_GITHUB_TOKEN) {
  console.error(
    "Error: COPILOT_GITHUB_TOKEN is not set.\n" +
      "Create a GitHub PAT with the 'Copilot Requests' permission and export it:\n" +
      "  export COPILOT_GITHUB_TOKEN=<token>",
  );
  process.exit(1);
}

const rawEntries = rawWeights satisfies WeightEntry[];
const entries = applyDefaultSmoothing(rawEntries);
const kpiData = buildKpiData(entries);
const prompt = buildPrompt(kpiData);

if (promptOnly) {
  console.log(prompt);
  process.exit(0);
}

try {
  const result = await $`copilot -p ${prompt} -s --no-ask-user`.text();

  if (jsonOutput) {
    console.log(result);
    process.exit(0);
  }

  const parsed = parseCoilotResponse(result);
  if (!parsed) {
    console.error("Error: Copilot response was not valid JSON.");
    console.error("Raw response:", result);
    process.exit(1);
  }

  printSummary(parsed);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("not found") || message.includes("No such file")) {
    console.error(
      "Error: 'copilot' command not found.\n" +
        "Install GitHub Copilot CLI with: npm install -g @github/copilot",
    );
  } else {
    console.error("Error running copilot:", message);
  }
  process.exit(1);
}

/**
 * Pretty-prints a demotivational summary to stdout.
 */
function printSummary(summary: DemotivationalSummary): void {
  console.log("");
  console.log(`🎯 ${summary.headline}`);
  console.log("");
  console.log(summary.summary);
  console.log("");
  console.log(summary.details);
  console.log("");
}
