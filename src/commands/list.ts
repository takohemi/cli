import chalk from "chalk";
import { getRegistry } from "../core/registry.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger();

export async function listCommand(): Promise<void> {
  const registry = getRegistry();
  const stacks = registry.getStacks();
  const plugins = registry.getLoadedPlugins();

  console.log("");
  log.info(chalk.bold("Available stacks:"));
  console.log("");

  const categoryLabels: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    fullstack: "Full-Stack",
    database: "Database",
    infra: "Infrastructure",
    library: "Library",
  };

  // Group by category
  const grouped = new Map<string, typeof stacks>();
  for (const stack of stacks) {
    const cat = stack.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(stack);
  }

  for (const [category, categoryStacks] of grouped) {
    console.log(`  ${chalk.bold(categoryLabels[category] || category)}`);
    for (const stack of categoryStacks) {
      console.log(
        `    ${chalk.cyan(stack.id.padEnd(20))} ${chalk.gray(stack.description)}`
      );
      if (stack.extras.length > 0) {
        console.log(
          `    ${" ".repeat(20)} ${chalk.gray(`extras: ${stack.extras.map((e) => e.id).join(", ")}`)}`
        );
      }
    }
    console.log("");
  }

  log.info(`${chalk.bold(plugins.length)} plugin(s) loaded, ${chalk.bold(stacks.length)} stack(s) available`);
  console.log("");
}
