import chalk from "chalk";
import type { Logger } from "../core/types.js";

const VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");

const PREFIX = chalk.hex("#FF6B35").bold("[takohemi]");

export function createLogger(): Logger {
  return {
    info(message: string) {
      console.log(`${PREFIX} ${message}`);
    },
    success(message: string) {
      console.log(`${PREFIX} ${chalk.green("✔")} ${message}`);
    },
    warn(message: string) {
      console.log(`${PREFIX} ${chalk.yellow("⚠")} ${chalk.yellow(message)}`);
    },
    error(message: string) {
      console.error(`${PREFIX} ${chalk.red("✖")} ${chalk.red(message)}`);
    },
    debug(message: string) {
      if (VERBOSE) {
        console.log(`${PREFIX} ${chalk.gray(`[debug] ${message}`)}`);
      }
    },
  };
}
