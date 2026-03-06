import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { TakohemiConfig, TemplateSource, StackGenerator } from "../core/types.js";
import { resolveTemplatePath } from "./template-engine.js";

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next"]);

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Loads takohemi.json from the given directory.
 * Returns null if not found or invalid.
 */
export async function loadTakohemiConfig(
  projectDir: string
): Promise<TakohemiConfig | null> {
  const configPath = path.join(projectDir, "takohemi.json");

  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    const config = await fs.readJson(configPath);
    return config as TakohemiConfig;
  } catch {
    return null;
  }
}

/**
 * Finds the takohemi.json by searching upward from the given path.
 * Returns null if not found.
 */
export async function findTakohemiConfig(
  startPath: string = process.cwd()
): Promise<{ config: TakohemiConfig; dir: string } | null> {
  // Check current directory
  let current = startPath;

  // Search up to root
  while (current !== path.parse(current).root) {
    const config = await loadTakohemiConfig(current);
    if (config) {
      return { config, dir: current };
    }
    current = path.dirname(current);
  }

  // Check root
  const rootConfig = await loadTakohemiConfig(startPath);
  if (rootConfig) {
    return { config: rootConfig, dir: startPath };
  }

  return null;
}

// ============================================================================
// Generator Variables
// ============================================================================

/**
 * Creates generator variables from the module name.
 */
export function createGeneratorVariables(name: string): Record<string, string> {
  return {
    name,
    namePascal: toPascalCase(name),
    nameCamel: toCamelCase(name),
    nameKebab: toKebabCase(name),
  };
}

function toPascalCase(str: string): string {
  return str
    .replace(/(^|[-_ ])(\w)/g, (_, _sep, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

// ============================================================================
// Generator Execution
// ============================================================================

export interface GeneratorOptions {
  /** The generator definition from the stack */
  generator: StackGenerator;
  /** Target directory (project root) */
  targetDir: string;
  /** User-provided variables */
  variables: Record<string, string>;
  /** Subdirectory to generate into (e.g., "components", "pages") */
  subDir?: string;
}

export interface GeneratorResult {
  /** List of generated files */
  files: string[];
}

/**
 * Executes a generator, creating files in the target directory.
 */
export async function runGenerator(
  options: GeneratorOptions
): Promise<GeneratorResult> {
  const { generator, targetDir, variables, subDir } = options;

  // Resolve template path
  const templatePath = await resolveTemplatePath(generator.templateSource);

  // Build full destination path
  const destDir = subDir ? path.join(targetDir, subDir) : targetDir;
  await fs.ensureDir(destDir);

  // Merge variables with generator-specific ones
  const fullVars = {
    ...createGeneratorVariables(variables.name || "NewModule"),
    ...variables,
  };

  // Process and copy template
  const generatedFiles: string[] = [];
  await processGeneratorTemplate(templatePath, destDir, fullVars, generatedFiles);

  return { files: generatedFiles };
}

/**
 * Processes a generator template, copying files to destination.
 */
async function processGeneratorTemplate(
  srcDir: string,
  destDir: string,
  variables: Record<string, string>,
  generatedFiles: string[]
): Promise<void> {
  await fs.ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const srcPath = path.join(srcDir, entry.name);
    // Process filename through Handlebars
    const processedName = Handlebars.compile(entry.name)(variables);
    const destPath = path.join(destDir, processedName);

    if (entry.isDirectory()) {
      await processGeneratorTemplate(srcPath, destPath, variables, generatedFiles);
    } else {
      const ext = path.extname(entry.name).toLowerCase();

      if (BINARY_EXTENSIONS.has(ext)) {
        await fs.copy(srcPath, destPath);
      } else {
        const content = await fs.readFile(srcPath, "utf-8");
        const processed = Handlebars.compile(content)(variables);
        await fs.writeFile(destPath, processed, "utf-8");
      }

      generatedFiles.push(processedName);
    }
  }
}

// ============================================================================
// Generator Discovery
// ============================================================================

/**
 * Gets all available generators for a stack.
 */
export function getStackGenerators(
  stackId: string,
  generators: StackGenerator[]
): StackGenerator[] {
  return generators.filter((g) => g);
}

/**
 * Finds a generator by ID in a list of generators.
 */
export function findGenerator(
  generators: StackGenerator[],
  generatorId: string
): StackGenerator | undefined {
  return generators.find((g) => g.id === generatorId);
}
