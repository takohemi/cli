import path from "node:path";
import fs from "fs-extra";
import ora from "ora";
import { execa } from "execa";
import type { TakohemiStack, TakohemiConfig, HookContext, TemplateSource } from "../core/types.js";
import {
  resolveTemplatePath,
  processTemplate,
  mergeExtra,
} from "./template-engine.js";
import { createLogger } from "./logger.js";

const log = createLogger();
const PKG_VERSION = "0.1.0"; // TODO: read from package.json

export interface ScaffoldOptions {
  projectName: string;
  stack: TakohemiStack;
  variables: Record<string, string>;
  selectedExtras: string[];
  targetDir?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
}

export async function scaffold(options: ScaffoldOptions): Promise<string> {
  const {
    projectName,
    stack,
    variables,
    selectedExtras,
    targetDir,
    skipInstall = false,
    skipGit = false,
  } = options;

  const projectDir = path.resolve(targetDir || ".", projectName);

  // Check if directory already exists
  if (await fs.pathExists(projectDir)) {
    throw new Error(
      `Directory "${projectName}" already exists. Choose a different name or remove it.`
    );
  }

  // Merge variables with defaults
  const allVars: Record<string, string> = {
    projectName,
    projectNameKebab: projectName
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase(),
    projectNamePascal: projectName
      .replace(/(^|[-_ ])(\w)/g, (_, _sep, char) => char.toUpperCase()),
    year: new Date().getFullYear().toString(),
    ...variables,
  };

  // Build hook context
  const hookCtx: HookContext = {
    projectDir,
    projectName,
    variables: allVars,
    extras: selectedExtras,
    exec: async (command: string) => {
      const [cmd, ...args] = command.split(" ");
      await execa(cmd, args, { cwd: projectDir, stdio: "inherit" });
    },
    log,
  };

  // ── Step 1: Before scaffold hook ──────────────────────────────────────
  if (stack.hooks.beforeScaffold) {
    await stack.hooks.beforeScaffold(hookCtx);
  }

  // ── Step 2: Copy and process base template ────────────────────────────
  const spinner = ora("Scaffolding project...").start();

  try {
    const templatePath = await resolveTemplatePath(stack.templateSource);
    await processTemplate(templatePath, projectDir, allVars);
    spinner.succeed("Base template scaffolded");
  } catch (err) {
    spinner.fail("Failed to scaffold base template");
    throw err;
  }

  // ── Step 3: After scaffold hook ───────────────────────────────────────
  if (stack.hooks.afterScaffold) {
    await stack.hooks.afterScaffold(hookCtx);
  }

  // ── Step 3.5: Apply variable-conditional overlays ────────────────────
  for (const [varName, varValue] of Object.entries(variables)) {
    if (varValue === "none") continue;

    const overlaySource: TemplateSource = {
      type: "local",
      path: `${stack.id}/variables/${varName}/${varValue}`,
    };

    try {
      const overlayPath = await resolveTemplatePath(overlaySource);
      const overlaySpinner = ora(`Applying ${varName}: ${varValue}...`).start();
      await mergeExtra(overlayPath, projectDir, allVars);
      overlaySpinner.succeed(`Applied: ${varName} → ${varValue}`);
    } catch {
      // No overlay for this variable/value — skip silently
    }
  }

  // ── Step 4: Apply selected extras ─────────────────────────────────────
  if (selectedExtras.length > 0) {
    for (const extraId of selectedExtras) {
      const extra = stack.extras.find((e) => e.id === extraId);
      if (!extra) {
        log.warn(`Extra "${extraId}" not found in stack "${stack.id}". Skipping.`);
        continue;
      }

      const extraSpinner = ora(`Applying extra: ${extra.name}...`).start();
      try {
        const extraPath = await resolveTemplatePath(extra.templateSource);
        await mergeExtra(extraPath, projectDir, allVars);
        extraSpinner.succeed(`Applied: ${extra.name}`);
      } catch (err) {
        extraSpinner.fail(`Failed to apply: ${extra.name}`);
        throw err;
      }
    }
  }

  // ── Step 5: Write takohemi.json config ────────────────────────────────
  const config: TakohemiConfig = {
    cliVersion: PKG_VERSION,
    stack: stack.id,
    extras: selectedExtras,
    variables: allVars,
    createdAt: new Date().toISOString(),
  };

  await fs.writeJson(path.join(projectDir, "takohemi.json"), config, {
    spaces: 2,
  });

  // ── Step 6: Git init ──────────────────────────────────────────────────
  if (!skipGit) {
    const gitSpinner = ora("Initializing git...").start();
    try {
      await execa("git", ["init"], { cwd: projectDir, stdio: "pipe" });
      await execa("git", ["add", "-A"], { cwd: projectDir, stdio: "pipe" });
      await execa("git", ["commit", "-m", "feat: initial scaffold by takohemi"], {
        cwd: projectDir,
        stdio: "pipe",
      });
      gitSpinner.succeed("Git initialized with first commit");
    } catch {
      gitSpinner.warn("Git init skipped (git not available)");
    }
  }

  // ── Step 7: Install dependencies ──────────────────────────────────────
  if (!skipInstall) {
    const installSpinner = ora("Installing dependencies...").start();
    try {
      // Detect package manager
      const pm = await detectPackageManager(projectDir);
      await execa(pm, ["install"], { cwd: projectDir, stdio: "pipe" });
      installSpinner.succeed(`Dependencies installed with ${pm}`);
    } catch {
      installSpinner.warn("Dependency install failed. Run manually.");
    }
  }

  // ── Step 8: After setup hook ──────────────────────────────────────────
  if (stack.hooks.afterSetup) {
    await stack.hooks.afterSetup(hookCtx);
  }

  return projectDir;
}

async function detectPackageManager(
  projectDir: string
): Promise<"pnpm" | "yarn" | "npm"> {
  if (await fs.pathExists(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs.pathExists(path.join(projectDir, "yarn.lock"))) return "yarn";
  return "npm";
}
