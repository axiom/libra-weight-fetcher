/**
 * Generates a daily accountability summary via GitHub Copilot CLI.
 *
 * Usage:
 *   bun run bin/copilot-summary.ts              # call Copilot and pretty-print summary
 *   bun run bin/copilot-summary.ts --prompt-only # print prompt text and exit (no token needed)
 *   bun run bin/copilot-summary.ts --json       # output clean validated JSON (for writing to advice.json)
 *
 * Requires COPILOT_GITHUB_TOKEN to be set (a GitHub PAT with "Copilot Requests"
 * permission) unless --prompt-only is given.
 */
import { $ } from "bun";
import type { DemotivationalSummary, WeightEntry } from "../src/shared";
import rawWeights from "../src/weights.json";
import {
  applyDefaultSmoothing,
  buildKpiData,
  buildPrompt,
  parseCoilotResponse,
} from "./copilot-summary.logic";

const promptOnly = process.argv.includes("--prompt-only");
const jsonOutput = process.argv.includes("--json");

if (!promptOnly && !process.env.COPILOT_GITHUB_TOKEN) {
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

let parsed: DemotivationalSummary;

try {
  const result = await $`copilot -p ${prompt} --model claude-haiku-4.5`.text();
  const maybeValid = parseCoilotResponse(result);
  if (!maybeValid) {
    console.error("Error: Copilot response was not valid JSON.");
    console.error("Raw response:", result);
    process.exit(1);
  }
  parsed = maybeValid;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("not found") || message.includes("No such file")) {
    console.error(
      "Error: 'copilot' command not found.\n" +
        "Install GitHub Copilot CLI with: npm install -g @github/copilot",
    );
  } else {
    console.error("Error running copilot:", message);
    const stderr =
      err != null &&
      typeof err === "object" &&
      "stderr" in err &&
      err.stderr != null
        ? Buffer.isBuffer(err.stderr)
          ? err.stderr.toString()
          : String(err.stderr)
        : null;
    if (stderr) {
      console.error("Copilot stderr:", stderr);
    }
  }
  process.exit(1);
}

if (jsonOutput) {
  // Output clean re-stringified JSON (not raw copilot output) for piping to advice.json
  console.log(JSON.stringify(parsed, null, 2));
  process.exit(0);
}

printSummary(parsed);

/**
 * Pretty-prints a summary to stdout.
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
