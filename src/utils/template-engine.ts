import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { TemplateSource } from "../core/types.js";
import { createLogger } from "./logger.js";

const log = createLogger();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, "../../templates");

// ============================================================================
// Register Handlebars helpers
// ============================================================================

Handlebars.registerHelper("pascalCase", (str: string) =>
  str.replace(/(^|[-_ ])(\w)/g, (_, _sep, char) => char.toUpperCase())
);

Handlebars.registerHelper("camelCase", (str: string) => {
  const pascal = str.replace(/(^|[-_ ])(\w)/g, (_, _sep, char) =>
    char.toUpperCase()
  );
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

Handlebars.registerHelper("kebabCase", (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
);

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

// ============================================================================
// Template Resolution
// ============================================================================

/**
 * Resolves a TemplateSource to an absolute local path.
 * For "local" sources, resolves relative to the bundled templates/ dir.
 * For "github" sources, clones via degit to a temp dir.
 */
export async function resolveTemplatePath(
  source: TemplateSource
): Promise<string> {
  if (source.type === "local") {
    const resolved = path.resolve(TEMPLATES_ROOT, source.path);
    if (!(await fs.pathExists(resolved))) {
      throw new Error(`Template not found: ${resolved}`);
    }
    return resolved;
  }

  if (source.type === "github") {
    // Dynamic import degit (ESM)
    const { default: degit } = await import("degit");
    const ref = source.ref ? `#${source.ref}` : "";
    const emitter = degit(`${source.path}${ref}`, { cache: false, force: true });

    const tmpDir = path.join(
      process.env.TMPDIR || "/tmp",
      `takohemi-${Date.now()}`
    );
    await fs.ensureDir(tmpDir);

    log.debug(`Fetching template from GitHub: ${source.path}${ref}`);
    await emitter.clone(tmpDir);
    return tmpDir;
  }

  throw new Error(`Unknown template source type: ${source.type}`);
}

// ============================================================================
// Template Processing
// ============================================================================

/** Files/dirs to never process with Handlebars */
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next"]);

/**
 * Copies a template directory to the destination, processing all text files
 * through Handlebars with the given variables.
 */
export async function processTemplate(
  srcDir: string,
  destDir: string,
  variables: Record<string, string>
): Promise<void> {
  await fs.ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const srcPath = path.join(srcDir, entry.name);
    // Process filename through Handlebars too (e.g., {{projectName}}.config.ts)
    const processedName = Handlebars.compile(entry.name)(variables);
    const destPath = path.join(destDir, processedName);

    if (entry.isDirectory()) {
      await processTemplate(srcPath, destPath, variables);
    } else {
      const ext = path.extname(entry.name).toLowerCase();

      if (BINARY_EXTENSIONS.has(ext)) {
        // Copy binary files as-is
        await fs.copy(srcPath, destPath);
      } else {
        // Process text files through Handlebars
        const content = await fs.readFile(srcPath, "utf-8");
        const processed = Handlebars.compile(content)(variables);
        await fs.writeFile(destPath, processed, "utf-8");
      }
    }
  }
}

/**
 * Merges an "extra" template on top of an existing project.
 * Handles package.json merging intelligently.
 */
export async function mergeExtra(
  extraDir: string,
  destDir: string,
  variables: Record<string, string>
): Promise<void> {
  const entries = await fs.readdir(extraDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const srcPath = path.join(extraDir, entry.name);
    const processedName = Handlebars.compile(entry.name)(variables);
    const destPath = path.join(destDir, processedName);

    if (entry.isDirectory()) {
      await mergeExtra(srcPath, destPath, variables);
    } else if (entry.name === "package.json") {
      // Special: merge package.json instead of overwriting
      await mergePackageJson(srcPath, destPath, variables);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) {
        await fs.copy(srcPath, destPath, { overwrite: true });
      } else {
        const content = await fs.readFile(srcPath, "utf-8");
        const processed = Handlebars.compile(content)(variables);
        await fs.writeFile(destPath, processed, "utf-8");
      }
    }
  }
}

async function mergePackageJson(
  srcPath: string,
  destPath: string,
  variables: Record<string, string>
): Promise<void> {
  const srcContent = await fs.readFile(srcPath, "utf-8");
  const srcProcessed = Handlebars.compile(srcContent)(variables);
  const srcPkg = JSON.parse(srcProcessed);

  if (await fs.pathExists(destPath)) {
    const destPkg = await fs.readJson(destPath);

    // Deep merge: dependencies, devDependencies, scripts
    destPkg.dependencies = {
      ...(destPkg.dependencies || {}),
      ...(srcPkg.dependencies || {}),
    };
    destPkg.devDependencies = {
      ...(destPkg.devDependencies || {}),
      ...(srcPkg.devDependencies || {}),
    };
    destPkg.scripts = {
      ...(destPkg.scripts || {}),
      ...(srcPkg.scripts || {}),
    };

    await fs.writeJson(destPath, destPkg, { spaces: 2 });
  } else {
    await fs.writeJson(destPath, srcPkg, { spaces: 2 });
  }
}
