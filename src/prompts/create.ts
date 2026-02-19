import prompts from "prompts";
import chalk from "chalk";
import type { TakohemiStack, TemplateVariable, StackCategory } from "../core/types.js";
import { getRegistry } from "../core/registry.js";

/**
 * Prompts the user for a project name (validated).
 */
export async function promptProjectName(
  defaultName?: string
): Promise<string> {
  const { projectName } = await prompts(
    {
      type: "text",
      name: "projectName",
      message: "Project name",
      initial: defaultName,
      validate: (value: string) => {
        if (!value.trim()) return "Project name is required";
        if (!/^[a-zA-Z0-9_-]+$/.test(value))
          return "Only letters, numbers, hyphens and underscores";
        return true;
      },
    },
    { onCancel: () => process.exit(0) }
  );

  return projectName;
}

/**
 * Prompts the user to select a stack category, then a specific stack.
 */
export async function promptStack(): Promise<TakohemiStack> {
  const registry = getRegistry();
  const allStacks = registry.getStacks();

  // Group by category
  const categories = [...new Set(allStacks.map((s) => s.category))];

  if (categories.length === 1) {
    // Skip category selection if only one
    return promptStackFromList(allStacks);
  }

  const categoryLabels: Record<StackCategory, string> = {
    frontend: "🖥  Frontend",
    backend: "⚙️  Backend",
    fullstack: "🔄 Full-Stack",
    database: "🗄  Database",
    infra: "🏗  Infrastructure",
    library: "📦 Library / Package",
  };

  const { category } = await prompts(
    {
      type: "select",
      name: "category",
      message: "What are you building?",
      choices: categories.map((c) => ({
        title: categoryLabels[c] || c,
        value: c,
      })),
    },
    { onCancel: () => process.exit(0) }
  );

  const filteredStacks = registry.getStacks(category);
  return promptStackFromList(filteredStacks);
}

async function promptStackFromList(
  stacks: TakohemiStack[]
): Promise<TakohemiStack> {
  if (stacks.length === 1) return stacks[0];

  const { stackId } = await prompts(
    {
      type: "select",
      name: "stackId",
      message: "Choose a stack",
      choices: stacks.map((s) => ({
        title: `${s.name} ${chalk.gray(`— ${s.description}`)}`,
        value: s.id,
      })),
    },
    { onCancel: () => process.exit(0) }
  );

  return stacks.find((s) => s.id === stackId)!;
}

/**
 * Prompts the user for all stack-specific variables.
 */
export async function promptVariables(
  variables: TemplateVariable[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const variable of variables) {
    const question = buildQuestion(variable);
    const response = await prompts(question, {
      onCancel: () => process.exit(0),
    });
    result[variable.name] = response[variable.name];
  }

  return result;
}

function buildQuestion(variable: TemplateVariable): prompts.PromptObject {
  const base = {
    name: variable.name,
    message: variable.label,
  };

  switch (variable.type) {
    case "text":
      return {
        ...base,
        type: "text",
        initial: variable.defaultValue,
        validate: variable.validate,
      };

    case "select":
      return {
        ...base,
        type: "select",
        choices: variable.choices || [],
        initial: variable.choices?.findIndex(
          (c) => c.value === variable.defaultValue
        ),
      };

    case "multiselect":
      return {
        ...base,
        type: "multiselect",
        choices: variable.choices || [],
        instructions: chalk.gray("  ↑/↓ navigate, space toggle, enter confirm"),
      };

    case "confirm":
      return {
        ...base,
        type: "confirm",
        initial: variable.defaultValue === "true",
      };

    default:
      return { ...base, type: "text" };
  }
}

/**
 * Prompts the user to select extras (optional add-ons).
 */
export async function promptExtras(
  stack: TakohemiStack
): Promise<string[]> {
  if (stack.extras.length === 0) return [];

  const { selectedExtras } = await prompts(
    {
      type: "multiselect",
      name: "selectedExtras",
      message: "Select extras to include",
      choices: stack.extras.map((e) => ({
        title: `${e.name} ${chalk.gray(`— ${e.description}`)}`,
        value: e.id,
        selected: ["eslint-prettier"].includes(e.id), // Pre-select essentials
      })),
      instructions: chalk.gray("  ↑/↓ navigate, space toggle, enter confirm"),
    },
    { onCancel: () => process.exit(0) }
  );

  // Resolve dependencies
  const resolved = new Set<string>(selectedExtras);
  for (const extraId of selectedExtras) {
    const extra = stack.extras.find((e) => e.id === extraId);
    if (extra?.dependsOn) {
      for (const dep of extra.dependsOn) {
        resolved.add(dep);
      }
    }
  }

  return Array.from(resolved);
}
