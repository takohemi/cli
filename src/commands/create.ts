import chalk from "chalk";
import { scaffold } from "../utils/scaffold.js";
import { createLogger } from "../utils/logger.js";
import {
  promptProjectName,
  promptStack,
  promptVariables,
  promptExtras,
} from "../prompts/create.js";

const log = createLogger();

interface CreateOptions {
  name?: string;
  stack?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
}

export async function createCommand(options: CreateOptions): Promise<void> {
  // Banner
  console.log("");
  console.log(
    chalk.hex("#FF6B35").bold("  ▄▀▀▀█▀▀▀▄  ") + chalk.bold("takohemi")
  );
  console.log(
    chalk.hex("#FF6B35")("  █   █   █  ") +
      chalk.gray("v0.1.0 — Your project, your rules.")
  );
  console.log(
    chalk.hex("#FF6B35")("  ▀▄▄▄█▄▄▄▀  ")
  );
  console.log("");

  try {
    // Step 1: Project name
    const projectName = options.name || (await promptProjectName());

    // Step 2: Select stack
    const stack = await promptStack();
    log.info(`Selected: ${chalk.bold(stack.name)}`);

    // Step 3: Stack-specific variables
    const variables = await promptVariables(stack.variables);

    // Step 4: Select extras
    const selectedExtras = await promptExtras(stack);

    console.log("");
    log.info(chalk.bold("Summary:"));
    log.info(`  Project:  ${chalk.cyan(projectName)}`);
    log.info(`  Stack:    ${chalk.cyan(stack.name)}`);
    if (Object.keys(variables).length > 0) {
      for (const [key, value] of Object.entries(variables)) {
        log.info(`  ${key}: ${chalk.cyan(value)}`);
      }
    }
    if (selectedExtras.length > 0) {
      log.info(`  Extras:   ${chalk.cyan(selectedExtras.join(", "))}`);
    }
    console.log("");

    // Step 5: Scaffold
    const projectDir = await scaffold({
      projectName,
      stack,
      variables,
      selectedExtras,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit,
    });

    // Done — the afterSetup hook handles the final message
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    } else {
      log.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}
