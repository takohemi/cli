import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import chalk from "chalk";
import { loadTakohemiConfig } from "./generator.js";

export interface DiagnosticResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

/**
 * Validates a Takohemi project and returns diagnostic results.
 */
export async function validateProject(
  projectDir: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // 1. Check takohemi.json
  const config = await loadTakohemiConfig(projectDir);
  if (!config) {
    results.push({
      name: "takohemi.json",
      status: "fail",
      message: "Not a Takohemi project (no takohemi.json found)",
    });
    return results;
  }

  results.push({
    name: "takohemi.json",
    status: "pass",
    message: `Valid (stack: ${config.stack})`,
  });

  // 2. Check project structure
  const hasSrc = await fs.pathExists(path.join(projectDir, "src"));
  const hasPackageJson = await fs.pathExists(path.join(projectDir, "package.json"));

  results.push({
    name: "Project structure",
    status: hasSrc && hasPackageJson ? "pass" : "fail",
    message: hasSrc && hasPackageJson ? "Valid" : "Missing src/ or package.json",
  });

  // 3. Check TypeScript config
  const hasTsConfig = await fs.pathExists(path.join(projectDir, "tsconfig.json"));
  results.push({
    name: "TypeScript config",
    status: hasTsConfig ? "pass" : "warn",
    message: hasTsConfig ? "tsconfig.json found" : "tsconfig.json not found",
  });

  // 4. Check node_modules
  const hasNodeModules = await fs.pathExists(path.join(projectDir, "node_modules"));
  results.push({
    name: "Dependencies",
    status: hasNodeModules ? "pass" : "warn",
    message: hasNodeModules ? "Installed" : "node_modules not found (run npm install)",
  });

  // 5. TypeScript type check (if tsconfig exists)
  if (hasTsConfig) {
    try {
      const tsResult = await execa("npx", ["tsc", "--noEmit"], {
        cwd: projectDir,
        reject: false,
      });
      results.push({
        name: "TypeScript",
        status: tsResult.failed ? "warn" : "pass",
        message: tsResult.failed ? "Type errors found" : "No type errors",
      });
    } catch {
      results.push({
        name: "TypeScript",
        status: "warn",
        message: "Could not run type check",
      });
    }
  }

  // 6. Check for .env file
  const hasEnvFile = await fs.pathExists(path.join(projectDir, ".env"));
  const hasEnvExample = await fs.pathExists(path.join(projectDir, ".env.example"));
  results.push({
    name: "Environment",
    status: hasEnvFile || hasEnvExample ? "pass" : "warn",
    message: hasEnvFile
      ? ".env file present"
      : hasEnvExample
        ? ".env.example present"
        : "No .env or .env.example found",
  });

  return results;
}

/**
 * Formats diagnostic results for display.
 */
export function formatDiagnostics(results: DiagnosticResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    const icon =
      result.status === "pass"
        ? chalk.green("✔")
        : result.status === "warn"
          ? chalk.yellow("⚠")
          : chalk.red("✖");

    lines.push(`  ${icon} ${result.name}: ${result.message}`);
  }

  // Summary
  const passCount = results.filter((r) => r.status === "pass").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const failCount = results.filter((r) => r.status === "fail").length;

  lines.push("");
  lines.push(
    `  Summary: ${chalk.green(`${passCount} passed`)}${
      warnCount > 0 ? `, ${chalk.yellow(`${warnCount} warnings`)}` : ""
    }${failCount > 0 ? `, ${chalk.red(`${failCount} failures`)}` : ""}`
  );

  return lines.join("\n");
}

/**
 * Returns overall exit code based on results.
 */
export function getExitCode(results: DiagnosticResult[]): number {
  const hasFailures = results.some((r) => r.status === "fail");
  return hasFailures ? 1 : 0;
}
