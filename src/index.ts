import { Command } from "commander";
import { loadAllPlugins } from "./plugins/loader.js";
import { createCommand } from "./commands/create.js";
import { addCommand } from "./commands/add.js";
import { doctorCommand } from "./commands/doctor.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("takohemi")
  .description("Opinionated project scaffolding CLI with plugin architecture")
  .version("0.1.0");

// ── create ──────────────────────────────────────────────────────────────
program
  .command("create")
  .alias("c")
  .description("Create a new project from a template")
  .argument("[name]", "Project name")
  .option("-s, --stack <stack>", "Stack ID (skip interactive selection)")
  .option("--no-install", "Skip dependency installation")
  .option("--no-git", "Skip git initialization")
  .option("-v, --verbose", "Show debug output")
  .action(async (name, options) => {
    await loadAllPlugins();
    await createCommand({
      name,
      stack: options.stack,
      skipInstall: !options.install,
      skipGit: !options.git,
    });
  });

// ── add ─────────────────────────────────────────────────────────────────
program
  .command("add")
  .alias("a")
  .description("Add a module to an existing project (v0.2)")
  .argument("[module]", "Module type (component, page, hook, store)")
  .argument("[name]", "Module name")
  .action(async (module, name, options) => {
    await loadAllPlugins();
    await addCommand({ module, name });
  });

// ── doctor ──────────────────────────────────────────────────────────────
program
  .command("doctor")
  .alias("d")
  .description("Check project health and standards compliance (v0.3)")
  .action(async () => {
    await doctorCommand();
  });

// ── list ─────────────────────────────────────────────────────────────────
program
  .command("list")
  .alias("ls")
  .description("List available stacks and plugins")
  .action(async () => {
    await loadAllPlugins();
    await listCommand();
  });

// ── Parse ───────────────────────────────────────────────────────────────
program.parse();
