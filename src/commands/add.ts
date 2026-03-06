import chalk from "chalk";
import prompts from "prompts";
import { createLogger } from "../utils/logger.js";
import {
  findTakohemiConfig,
  findGenerator,
  runGenerator,
} from "../utils/generator.js";
import { getRegistry } from "../core/registry.js";
import type { StackGenerator } from "../core/types.js";

const log = createLogger();

interface AddOptions {
  module?: string;
  name?: string;
}

export async function addCommand(options: AddOptions): Promise<void> {
  const { module: moduleType, name: moduleName } = options;

  // 1. Find takohemi.json config
  const projectInfo = await findTakohemiConfig();

  if (!projectInfo) {
    log.error(
      `Not a Takohemi project. Run ${chalk.bold("takohemi create")} first, or run from a project directory.`
    );
    process.exit(1);
  }

  const { config, dir: projectDir } = projectInfo;
  log.debug(`Found project at: ${projectDir}, stack: ${config.stack}`);

  // 2. Get stack from registry
  const registry = getRegistry();
  const stack = registry.getStack(config.stack);

  if (!stack) {
    log.error(
      `Stack "${config.stack}" not found. Is the plugin loaded?`
    );
    process.exit(1);
  }

  // 3. Get available generators
  const generators = stack.generators || [];

  if (generators.length === 0) {
    log.warn(`No generators available for stack "${stack.name}".`);
    log.info("Generators can be added via stack plugins.");
    return;
  }

  // 4. Prompt for generator type if not provided
  let selectedGenerator: StackGenerator | undefined;

  if (moduleType) {
    selectedGenerator = findGenerator(generators, moduleType);
    if (!selectedGenerator) {
      log.error(
        `Unknown generator "${moduleType}". Available: ${generators
          .map((g) => g.id)
          .join(", ")}`
      );
      process.exit(1);
    }
  } else {
    const { generatorId } = await prompts(
      {
        type: "select",
        name: "generatorId",
        message: "What do you want to add?",
        choices: generators.map((g) => ({
          title: `${g.name} ${chalk.gray(`— ${g.description}`)}`,
          value: g.id,
        })),
      },
      { onCancel: () => process.exit(0) }
    );
    selectedGenerator = findGenerator(generators, generatorId);
  }

  if (!selectedGenerator) {
    log.error("No generator selected.");
    process.exit(1);
  }

  // 5. Prompt for module name if not provided
  let finalName = moduleName;

  if (!finalName) {
    const { name } = await prompts(
      {
        type: "text",
        name: "name",
        message: `${selectedGenerator.name} name`,
        validate: (value: string) => {
          if (!value.trim()) return "Name is required";
          if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value))
            return "Must start with letter, alphanumeric and hyphens only";
          return true;
        },
      },
      { onCancel: () => process.exit(0) }
    );
    finalName = name;
  }

  if (!finalName) {
    log.error("Module name is required.");
    process.exit(1);
  }

  // 6. Prompt for generator options
  const options_ = selectedGenerator.options || [];
  const selectedOptions: Record<string, string> = {};

  for (const opt of options_) {
    const { value } = await prompts(
      {
        type: opt.type === "confirm" ? "confirm" : "text",
        name: "value",
        message: opt.label,
        initial: opt.defaultValue,
      },
      { onCancel: () => process.exit(0) }
    );
    selectedOptions[opt.name] = String(value);
  }

  // 7. Run the generator
  log.info("");
  log.info(
    `Generating ${chalk.bold(selectedGenerator.name)}: ${chalk.bold(finalName)}`
  );

  try {
    const result = await runGenerator({
      generator: selectedGenerator,
      targetDir: projectDir,
      subDir: selectedGenerator.subDir,
      variables: {
        name: finalName,
        ...selectedOptions,
      },
    });

    log.success(`Created ${result.files.length} file(s):`);
    for (const file of result.files) {
      log.info(`  - ${chalk.gray(file)}`);
    }
    log.info("");
  } catch (err) {
    log.error(`Failed to generate: ${(err as Error).message}`);
    process.exit(1);
  }
}
