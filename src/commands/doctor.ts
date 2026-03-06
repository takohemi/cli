import chalk from "chalk";
import ora from "ora";
import { createLogger } from "../utils/logger.js";
import { findTakohemiConfig } from "../utils/generator.js";
import {
  validateProject,
  formatDiagnostics,
  getExitCode,
} from "../utils/validator.js";

const log = createLogger();

export async function doctorCommand(): Promise<void> {
  const spinner = ora("Running diagnostics...").start();

  // Find project
  const projectInfo = await findTakohemiConfig();

  if (!projectInfo) {
    spinner.fail("Not a Takohemi project");
    log.error(
      `Run ${chalk.bold("takohemi create")} first, or run from a project directory.`
    );
    process.exit(1);
  }

  const { config, dir: projectDir } = projectInfo;

  spinner.succeed(`Found project at: ${chalk.bold(projectDir)}`);

  // Run validation
  console.log("");
  console.log(chalk.bold("🔍 Running diagnostics..."));
  console.log("");

  const results = await validateProject(projectDir);
  console.log(formatDiagnostics(results));

  // Exit with appropriate code
  const exitCode = getExitCode(results);
  if (exitCode !== 0) {
    console.log("");
    console.log(
      chalk.red("✖ Project has failures. Please fix the issues above.")
    );
  } else if (results.some((r) => r.status === "warn")) {
    console.log("");
    console.log(
      chalk.yellow("⚠ Project has warnings. Consider addressing them.")
    );
  } else {
    console.log("");
    console.log(chalk.green("✔ Project looks healthy!"));
  }

  process.exit(exitCode);
}
