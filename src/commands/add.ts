import chalk from "chalk";
import { createLogger } from "../utils/logger.js";

const log = createLogger();

export async function addCommand(module: string | undefined): Promise<void> {
  // TODO: v0.2 — This will read takohemi.json from the current project,
  // detect the stack, and generate modules (components, pages, hooks, etc.)
  //
  // Example usage:
  //   takohemi add component Button
  //   takohemi add page Dashboard
  //   takohemi add hook useAuth
  //   takohemi add api-route users
  //   takohemi add store cart

  log.warn(
    `The ${chalk.bold("add")} command is coming in v0.2.`
  );
  log.info("It will allow you to generate modules inside an existing project:");
  log.info("");
  log.info(`  ${chalk.gray("$")} takohemi add component Button`);
  log.info(`  ${chalk.gray("$")} takohemi add page Dashboard`);
  log.info(`  ${chalk.gray("$")} takohemi add hook useAuth`);
  log.info(`  ${chalk.gray("$")} takohemi add store cart`);
  log.info("");
}
