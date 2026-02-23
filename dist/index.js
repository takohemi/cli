#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/utils/logger.ts
import chalk from "chalk";
var VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");
var PREFIX = chalk.hex("#FF6B35").bold("[takohemi]");
function createLogger() {
  return {
    info(message) {
      console.log(`${PREFIX} ${message}`);
    },
    success(message) {
      console.log(`${PREFIX} ${chalk.green("\u2714")} ${message}`);
    },
    warn(message) {
      console.log(`${PREFIX} ${chalk.yellow("\u26A0")} ${chalk.yellow(message)}`);
    },
    error(message) {
      console.error(`${PREFIX} ${chalk.red("\u2716")} ${chalk.red(message)}`);
    },
    debug(message) {
      if (VERBOSE) {
        console.log(`${PREFIX} ${chalk.gray(`[debug] ${message}`)}`);
      }
    }
  };
}

// src/core/registry.ts
var log = createLogger();
var Registry = class {
  stacks = /* @__PURE__ */ new Map();
  commands = /* @__PURE__ */ new Map();
  plugins = /* @__PURE__ */ new Map();
  registerStack(stack) {
    if (this.stacks.has(stack.id)) {
      log.warn(`Stack "${stack.id}" is already registered. Overwriting.`);
    }
    this.stacks.set(stack.id, stack);
    log.debug(`Registered stack: ${stack.id} (${stack.category})`);
  }
  registerCommand(command) {
    if (this.commands.has(command.name)) {
      log.warn(`Command "${command.name}" is already registered. Overwriting.`);
    }
    this.commands.set(command.name, command);
    log.debug(`Registered command: ${command.name}`);
  }
  getStacks(category) {
    const all = Array.from(this.stacks.values());
    if (!category) return all;
    return all.filter((s) => s.category === category);
  }
  getStack(id) {
    return this.stacks.get(id);
  }
  getCommands() {
    return Array.from(this.commands.values());
  }
  getCommand(name) {
    return this.commands.get(name);
  }
  async loadPlugin(plugin) {
    if (this.plugins.has(plugin.name)) {
      log.warn(`Plugin "${plugin.name}" already loaded. Skipping.`);
      return;
    }
    log.debug(`Loading plugin: ${plugin.name}@${plugin.version}`);
    if (plugin.stacks) {
      for (const stack of plugin.stacks) {
        this.registerStack(stack);
      }
    }
    if (plugin.commands) {
      for (const command of plugin.commands) {
        this.registerCommand(command);
      }
    }
    if (plugin.setup) {
      await plugin.setup(this);
    }
    this.plugins.set(plugin.name, plugin);
    log.debug(`Plugin "${plugin.name}" loaded successfully`);
  }
  getLoadedPlugins() {
    return Array.from(this.plugins.values());
  }
};
var instance = null;
function getRegistry() {
  if (!instance) {
    instance = new Registry();
  }
  return instance;
}

// src/plugins/react-vite/index.ts
var reactVitePlugin = {
  name: "takohemi-plugin-react-vite",
  version: "0.1.0",
  stacks: [
    {
      id: "react-vite",
      name: "React + Vite",
      description: "React 19 with Vite, TypeScript, and modern tooling",
      category: "frontend",
      templateSource: {
        type: "local",
        path: "react-vite/base"
      },
      variables: [
        {
          name: "styling",
          label: "Styling solution",
          type: "select",
          choices: [
            { title: "Tailwind CSS", value: "tailwind" },
            { title: "CSS Modules", value: "css-modules" },
            { title: "Styled Components", value: "styled-components" },
            { title: "None (plain CSS)", value: "none" }
          ],
          defaultValue: "tailwind"
        },
        {
          name: "stateManagement",
          label: "State management",
          type: "select",
          choices: [
            { title: "Zustand", value: "zustand" },
            { title: "Redux Toolkit", value: "redux" },
            { title: "Jotai", value: "jotai" },
            { title: "None (React state only)", value: "none" }
          ],
          defaultValue: "zustand"
        },
        {
          name: "router",
          label: "Routing",
          type: "select",
          choices: [
            { title: "React Router v7", value: "react-router" },
            { title: "TanStack Router", value: "tanstack-router" },
            { title: "None (SPA, no routing)", value: "none" }
          ],
          defaultValue: "react-router"
        }
      ],
      extras: [
        {
          id: "testing",
          name: "Testing (Vitest + Testing Library)",
          description: "Unit & integration testing with Vitest and React Testing Library",
          templateSource: { type: "local", path: "react-vite/extras/testing" }
        },
        {
          id: "storybook",
          name: "Storybook",
          description: "Component documentation and visual testing with Storybook",
          templateSource: { type: "local", path: "react-vite/extras/storybook" }
        },
        {
          id: "eslint-prettier",
          name: "ESLint + Prettier",
          description: "Opinionated linting and formatting config",
          templateSource: { type: "local", path: "react-vite/extras/eslint-prettier" }
        },
        {
          id: "husky",
          name: "Husky + Commitlint",
          description: "Git hooks with commit message validation",
          templateSource: { type: "local", path: "react-vite/extras/husky" },
          dependsOn: ["eslint-prettier"]
        },
        {
          id: "docker",
          name: "Docker",
          description: "Multi-stage Dockerfile + docker-compose for dev & prod",
          templateSource: { type: "local", path: "react-vite/extras/docker" }
        },
        {
          id: "ci-github",
          name: "GitHub Actions CI/CD",
          description: "CI pipeline with lint, test, build, and deploy stages",
          templateSource: { type: "local", path: "react-vite/extras/ci-github" }
        }
      ],
      hooks: {
        async afterSetup(ctx) {
          ctx.log.info("");
          ctx.log.success(`Project "${ctx.projectName}" is ready!`);
          ctx.log.info("");
          ctx.log.info(`  cd ${ctx.projectName}`);
          ctx.log.info("  npm run dev");
          ctx.log.info("");
        }
      }
    }
  ]
};
var react_vite_default = reactVitePlugin;

// src/plugins/nextjs/index.ts
var nextjsPlugin = {
  name: "takohemi-plugin-nextjs",
  version: "0.1.0",
  stacks: [
    {
      id: "nextjs",
      name: "Next.js (App Router)",
      description: "Next.js 15 with App Router, TypeScript, and server components",
      category: "frontend",
      templateSource: {
        type: "local",
        path: "nextjs/base"
      },
      variables: [
        {
          name: "styling",
          label: "Styling solution",
          type: "select",
          choices: [
            { title: "Tailwind CSS", value: "tailwind" },
            { title: "CSS Modules", value: "css-modules" },
            { title: "None (plain CSS)", value: "none" }
          ],
          defaultValue: "tailwind"
        },
        {
          name: "database",
          label: "Database",
          type: "select",
          choices: [
            { title: "MongoDB (Mongoose)", value: "mongodb" },
            { title: "PostgreSQL (Prisma)", value: "prisma" },
            { title: "SQLite (Drizzle)", value: "drizzle" },
            { title: "None", value: "none" }
          ],
          defaultValue: "none"
        },
        {
          name: "auth",
          label: "Authentication",
          type: "select",
          choices: [
            { title: "NextAuth.js (Auth.js)", value: "nextauth" },
            { title: "Clerk", value: "clerk" },
            { title: "None", value: "none" }
          ],
          defaultValue: "none"
        },
        {
          name: "stateManagement",
          label: "Client state management",
          type: "select",
          choices: [
            { title: "Zustand", value: "zustand" },
            { title: "None (React state + server components)", value: "none" }
          ],
          defaultValue: "none"
        }
      ],
      extras: [
        {
          id: "testing",
          name: "Testing (Vitest + Playwright)",
          description: "Unit testing with Vitest and E2E with Playwright",
          templateSource: { type: "local", path: "nextjs/extras/testing" }
        },
        {
          id: "eslint-prettier",
          name: "ESLint + Prettier",
          description: "Opinionated linting and formatting config",
          templateSource: { type: "local", path: "nextjs/extras/eslint-prettier" }
        },
        {
          id: "husky",
          name: "Husky + Commitlint",
          description: "Git hooks with commit message validation",
          templateSource: { type: "local", path: "nextjs/extras/husky" },
          dependsOn: ["eslint-prettier"]
        },
        {
          id: "docker",
          name: "Docker",
          description: "Optimized multi-stage Dockerfile for Next.js standalone output",
          templateSource: { type: "local", path: "nextjs/extras/docker" }
        },
        {
          id: "ci-github",
          name: "GitHub Actions CI/CD",
          description: "CI pipeline with lint, test, build, and deploy stages",
          templateSource: { type: "local", path: "nextjs/extras/ci-github" }
        },
        {
          id: "cloudflare",
          name: "Cloudflare Workers",
          description: "Deploy to Cloudflare Workers via OpenNext adapter",
          templateSource: { type: "local", path: "nextjs/extras/cloudflare" }
        },
        {
          id: "seo",
          name: "SEO + Sitemap",
          description: "Metadata helpers, sitemap generation, and robots.txt",
          templateSource: { type: "local", path: "nextjs/extras/seo" }
        }
      ],
      hooks: {
        async afterSetup(ctx) {
          ctx.log.info("");
          ctx.log.success(`Project "${ctx.projectName}" is ready!`);
          ctx.log.info("");
          ctx.log.info(`  cd ${ctx.projectName}`);
          ctx.log.info("  npm run dev");
          ctx.log.info("");
          if (ctx.variables.database !== "none") {
            ctx.log.warn("Don't forget to set up your .env with database credentials.");
          }
        }
      }
    }
  ]
};
var nextjs_default = nextjsPlugin;

// src/plugins/loader.ts
async function loadAllPlugins() {
  const registry = getRegistry();
  const builtInPlugins = [
    react_vite_default,
    nextjs_default
    // ── Future plugins go here ──
    // nestjsPlugin,
    // expressPlugin,
    // mongoPlugin,
    // dockerPlugin,
  ];
  for (const plugin of builtInPlugins) {
    await registry.loadPlugin(plugin);
  }
}

// src/commands/create.ts
import chalk3 from "chalk";

// src/utils/scaffold.ts
import path2 from "path";
import fs2 from "fs-extra";
import ora from "ora";
import { execa } from "execa";

// src/utils/template-engine.ts
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import Handlebars from "handlebars";
var log2 = createLogger();
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var TEMPLATES_ROOT = path.resolve(__dirname, "../templates");
Handlebars.registerHelper(
  "pascalCase",
  (str) => str.replace(/(^|[-_ ])(\w)/g, (_, _sep, char) => char.toUpperCase())
);
Handlebars.registerHelper("camelCase", (str) => {
  const pascal = str.replace(
    /(^|[-_ ])(\w)/g,
    (_, _sep, char) => char.toUpperCase()
  );
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});
Handlebars.registerHelper(
  "kebabCase",
  (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase()
);
Handlebars.registerHelper("eq", (a, b) => a === b);
async function resolveTemplatePath(source) {
  if (source.type === "local") {
    const resolved = path.resolve(TEMPLATES_ROOT, source.path);
    if (!await fs.pathExists(resolved)) {
      throw new Error(`Template not found: ${resolved}`);
    }
    return resolved;
  }
  if (source.type === "github") {
    const { default: degit } = await import("degit");
    const ref = source.ref ? `#${source.ref}` : "";
    const emitter = degit(`${source.path}${ref}`, { cache: false, force: true });
    const tmpDir = path.join(
      process.env.TMPDIR || "/tmp",
      `takohemi-${Date.now()}`
    );
    await fs.ensureDir(tmpDir);
    log2.debug(`Fetching template from GitHub: ${source.path}${ref}`);
    await emitter.clone(tmpDir);
    return tmpDir;
  }
  throw new Error(`Unknown template source type: ${source.type}`);
}
var BINARY_EXTENSIONS = /* @__PURE__ */ new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".zip",
  ".tar",
  ".gz"
]);
var SKIP_DIRS = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", ".next"]);
async function processTemplate(srcDir, destDir, variables) {
  await fs.ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const processedName = Handlebars.compile(entry.name)(variables);
    const destPath = path.join(destDir, processedName);
    if (entry.isDirectory()) {
      await processTemplate(srcPath, destPath, variables);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) {
        await fs.copy(srcPath, destPath);
      } else {
        const content = await fs.readFile(srcPath, "utf-8");
        const processed = Handlebars.compile(content)(variables);
        await fs.writeFile(destPath, processed, "utf-8");
      }
    }
  }
}
async function mergeExtra(extraDir, destDir, variables) {
  const entries = await fs.readdir(extraDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const srcPath = path.join(extraDir, entry.name);
    const processedName = Handlebars.compile(entry.name)(variables);
    const destPath = path.join(destDir, processedName);
    if (entry.isDirectory()) {
      await mergeExtra(srcPath, destPath, variables);
    } else if (entry.name === "package.json") {
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
async function mergePackageJson(srcPath, destPath, variables) {
  const srcContent = await fs.readFile(srcPath, "utf-8");
  const srcProcessed = Handlebars.compile(srcContent)(variables);
  const srcPkg = JSON.parse(srcProcessed);
  if (await fs.pathExists(destPath)) {
    const destPkg = await fs.readJson(destPath);
    destPkg.dependencies = {
      ...destPkg.dependencies || {},
      ...srcPkg.dependencies || {}
    };
    destPkg.devDependencies = {
      ...destPkg.devDependencies || {},
      ...srcPkg.devDependencies || {}
    };
    destPkg.scripts = {
      ...destPkg.scripts || {},
      ...srcPkg.scripts || {}
    };
    await fs.writeJson(destPath, destPkg, { spaces: 2 });
  } else {
    await fs.writeJson(destPath, srcPkg, { spaces: 2 });
  }
}

// src/utils/scaffold.ts
var log3 = createLogger();
var PKG_VERSION = "0.1.0";
async function scaffold(options) {
  const {
    projectName,
    stack,
    variables,
    selectedExtras,
    targetDir,
    skipInstall = false,
    skipGit = false
  } = options;
  const projectDir = path2.resolve(targetDir || ".", projectName);
  if (await fs2.pathExists(projectDir)) {
    throw new Error(
      `Directory "${projectName}" already exists. Choose a different name or remove it.`
    );
  }
  const allVars = {
    projectName,
    projectNameKebab: projectName.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase(),
    projectNamePascal: projectName.replace(/(^|[-_ ])(\w)/g, (_, _sep, char) => char.toUpperCase()),
    year: (/* @__PURE__ */ new Date()).getFullYear().toString(),
    ...variables
  };
  const hookCtx = {
    projectDir,
    projectName,
    variables: allVars,
    extras: selectedExtras,
    exec: async (command) => {
      const [cmd, ...args] = command.split(" ");
      await execa(cmd, args, { cwd: projectDir, stdio: "inherit" });
    },
    log: log3
  };
  if (stack.hooks.beforeScaffold) {
    await stack.hooks.beforeScaffold(hookCtx);
  }
  const spinner = ora("Scaffolding project...").start();
  try {
    const templatePath = await resolveTemplatePath(stack.templateSource);
    await processTemplate(templatePath, projectDir, allVars);
    spinner.succeed("Base template scaffolded");
  } catch (err) {
    spinner.fail("Failed to scaffold base template");
    throw err;
  }
  if (stack.hooks.afterScaffold) {
    await stack.hooks.afterScaffold(hookCtx);
  }
  for (const [varName, varValue] of Object.entries(variables)) {
    if (varValue === "none") continue;
    const overlaySource = {
      type: "local",
      path: `${stack.id}/variables/${varName}/${varValue}`
    };
    try {
      const overlayPath = await resolveTemplatePath(overlaySource);
      const overlaySpinner = ora(`Applying ${varName}: ${varValue}...`).start();
      await mergeExtra(overlayPath, projectDir, allVars);
      overlaySpinner.succeed(`Applied: ${varName} \u2192 ${varValue}`);
    } catch {
    }
  }
  if (selectedExtras.length > 0) {
    for (const extraId of selectedExtras) {
      const extra = stack.extras.find((e) => e.id === extraId);
      if (!extra) {
        log3.warn(`Extra "${extraId}" not found in stack "${stack.id}". Skipping.`);
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
  const config = {
    cliVersion: PKG_VERSION,
    stack: stack.id,
    extras: selectedExtras,
    variables: allVars,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await fs2.writeJson(path2.join(projectDir, "takohemi.json"), config, {
    spaces: 2
  });
  if (!skipGit) {
    const gitSpinner = ora("Initializing git...").start();
    try {
      await execa("git", ["init"], { cwd: projectDir, stdio: "pipe" });
      await execa("git", ["add", "-A"], { cwd: projectDir, stdio: "pipe" });
      await execa("git", ["commit", "-m", "feat: initial scaffold by takohemi"], {
        cwd: projectDir,
        stdio: "pipe"
      });
      gitSpinner.succeed("Git initialized with first commit");
    } catch {
      gitSpinner.warn("Git init skipped (git not available)");
    }
  }
  if (!skipInstall) {
    const installSpinner = ora("Installing dependencies...").start();
    try {
      const pm = await detectPackageManager(projectDir);
      await execa(pm, ["install"], { cwd: projectDir, stdio: "pipe" });
      installSpinner.succeed(`Dependencies installed with ${pm}`);
    } catch {
      installSpinner.warn("Dependency install failed. Run manually.");
    }
  }
  if (stack.hooks.afterSetup) {
    await stack.hooks.afterSetup(hookCtx);
  }
  return projectDir;
}
async function detectPackageManager(projectDir) {
  if (await fs2.pathExists(path2.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs2.pathExists(path2.join(projectDir, "yarn.lock"))) return "yarn";
  return "npm";
}

// src/prompts/create.ts
import prompts from "prompts";
import chalk2 from "chalk";
async function promptProjectName(defaultName) {
  const { projectName } = await prompts(
    {
      type: "text",
      name: "projectName",
      message: "Project name",
      initial: defaultName,
      validate: (value) => {
        if (!value.trim()) return "Project name is required";
        if (!/^[a-zA-Z0-9_-]+$/.test(value))
          return "Only letters, numbers, hyphens and underscores";
        return true;
      }
    },
    { onCancel: () => process.exit(0) }
  );
  return projectName;
}
async function promptStack() {
  const registry = getRegistry();
  const allStacks = registry.getStacks();
  const categories = [...new Set(allStacks.map((s) => s.category))];
  if (categories.length === 1) {
    return promptStackFromList(allStacks);
  }
  const categoryLabels = {
    frontend: "\u{1F5A5}  Frontend",
    backend: "\u2699\uFE0F  Backend",
    fullstack: "\u{1F504} Full-Stack",
    database: "\u{1F5C4}  Database",
    infra: "\u{1F3D7}  Infrastructure",
    library: "\u{1F4E6} Library / Package"
  };
  const { category } = await prompts(
    {
      type: "select",
      name: "category",
      message: "What are you building?",
      choices: categories.map((c) => ({
        title: categoryLabels[c] || c,
        value: c
      }))
    },
    { onCancel: () => process.exit(0) }
  );
  const filteredStacks = registry.getStacks(category);
  return promptStackFromList(filteredStacks);
}
async function promptStackFromList(stacks) {
  if (stacks.length === 1) return stacks[0];
  const { stackId } = await prompts(
    {
      type: "select",
      name: "stackId",
      message: "Choose a stack",
      choices: stacks.map((s) => ({
        title: `${s.name} ${chalk2.gray(`\u2014 ${s.description}`)}`,
        value: s.id
      }))
    },
    { onCancel: () => process.exit(0) }
  );
  return stacks.find((s) => s.id === stackId);
}
async function promptVariables(variables) {
  const result = {};
  for (const variable of variables) {
    const question = buildQuestion(variable);
    const response = await prompts(question, {
      onCancel: () => process.exit(0)
    });
    result[variable.name] = response[variable.name];
  }
  return result;
}
function buildQuestion(variable) {
  const base = {
    name: variable.name,
    message: variable.label
  };
  switch (variable.type) {
    case "text":
      return {
        ...base,
        type: "text",
        initial: variable.defaultValue,
        validate: variable.validate
      };
    case "select":
      return {
        ...base,
        type: "select",
        choices: variable.choices || [],
        initial: variable.choices?.findIndex(
          (c) => c.value === variable.defaultValue
        )
      };
    case "multiselect":
      return {
        ...base,
        type: "multiselect",
        choices: variable.choices || [],
        instructions: chalk2.gray("  \u2191/\u2193 navigate, space toggle, enter confirm")
      };
    case "confirm":
      return {
        ...base,
        type: "confirm",
        initial: variable.defaultValue === "true"
      };
    default:
      return { ...base, type: "text" };
  }
}
async function promptExtras(stack) {
  if (stack.extras.length === 0) return [];
  const { selectedExtras } = await prompts(
    {
      type: "multiselect",
      name: "selectedExtras",
      message: "Select extras to include",
      choices: stack.extras.map((e) => ({
        title: `${e.name} ${chalk2.gray(`\u2014 ${e.description}`)}`,
        value: e.id,
        selected: ["eslint-prettier"].includes(e.id)
        // Pre-select essentials
      })),
      instructions: chalk2.gray("  \u2191/\u2193 navigate, space toggle, enter confirm")
    },
    { onCancel: () => process.exit(0) }
  );
  const resolved = new Set(selectedExtras);
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

// src/commands/create.ts
var log4 = createLogger();
async function createCommand(options) {
  console.log("");
  console.log(
    chalk3.hex("#FF6B35").bold("  \u2584\u2580\u2580\u2580\u2588\u2580\u2580\u2580\u2584  ") + chalk3.bold("takohemi")
  );
  console.log(
    chalk3.hex("#FF6B35")("  \u2588   \u2588   \u2588  ") + chalk3.gray("v0.1.0 \u2014 Your project, your rules.")
  );
  console.log(
    chalk3.hex("#FF6B35")("  \u2580\u2584\u2584\u2584\u2588\u2584\u2584\u2584\u2580  ")
  );
  console.log("");
  try {
    const projectName = options.name || await promptProjectName();
    const stack = await promptStack();
    log4.info(`Selected: ${chalk3.bold(stack.name)}`);
    const variables = await promptVariables(stack.variables);
    const selectedExtras = await promptExtras(stack);
    console.log("");
    log4.info(chalk3.bold("Summary:"));
    log4.info(`  Project:  ${chalk3.cyan(projectName)}`);
    log4.info(`  Stack:    ${chalk3.cyan(stack.name)}`);
    if (Object.keys(variables).length > 0) {
      for (const [key, value] of Object.entries(variables)) {
        log4.info(`  ${key}: ${chalk3.cyan(value)}`);
      }
    }
    if (selectedExtras.length > 0) {
      log4.info(`  Extras:   ${chalk3.cyan(selectedExtras.join(", "))}`);
    }
    console.log("");
    await scaffold({
      projectName,
      stack,
      variables,
      selectedExtras,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit
    });
  } catch (error) {
    if (error instanceof Error) {
      log4.error(error.message);
    } else {
      log4.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}

// src/commands/add.ts
import chalk4 from "chalk";
var log5 = createLogger();
async function addCommand(_module) {
  log5.warn(
    `The ${chalk4.bold("add")} command is coming in v0.2.`
  );
  log5.info("It will allow you to generate modules inside an existing project:");
  log5.info("");
  log5.info(`  ${chalk4.gray("$")} takohemi add component Button`);
  log5.info(`  ${chalk4.gray("$")} takohemi add page Dashboard`);
  log5.info(`  ${chalk4.gray("$")} takohemi add hook useAuth`);
  log5.info(`  ${chalk4.gray("$")} takohemi add store cart`);
  log5.info("");
}

// src/commands/doctor.ts
import chalk5 from "chalk";
var log6 = createLogger();
async function doctorCommand() {
  log6.warn(
    `The ${chalk5.bold("doctor")} command is coming in v0.3.`
  );
  log6.info("It will validate your project against Takohemi standards:");
  log6.info("");
  log6.info(`  ${chalk5.gray("$")} takohemi doctor`);
  log6.info("");
  log6.info(`  ${chalk5.green("\u2714")} Project structure is valid`);
  log6.info(`  ${chalk5.green("\u2714")} TypeScript config OK`);
  log6.info(`  ${chalk5.yellow("\u26A0")} 3 dependencies have updates available`);
  log6.info(`  ${chalk5.red("\u2716")} Missing .env variable: DATABASE_URL`);
  log6.info("");
}

// src/commands/list.ts
import chalk6 from "chalk";
var log7 = createLogger();
async function listCommand() {
  const registry = getRegistry();
  const stacks = registry.getStacks();
  const plugins = registry.getLoadedPlugins();
  console.log("");
  log7.info(chalk6.bold("Available stacks:"));
  console.log("");
  const categoryLabels = {
    frontend: "Frontend",
    backend: "Backend",
    fullstack: "Full-Stack",
    database: "Database",
    infra: "Infrastructure",
    library: "Library"
  };
  const grouped = /* @__PURE__ */ new Map();
  for (const stack of stacks) {
    const cat = stack.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(stack);
  }
  for (const [category, categoryStacks] of grouped) {
    console.log(`  ${chalk6.bold(categoryLabels[category] || category)}`);
    for (const stack of categoryStacks) {
      console.log(
        `    ${chalk6.cyan(stack.id.padEnd(20))} ${chalk6.gray(stack.description)}`
      );
      if (stack.extras.length > 0) {
        console.log(
          `    ${" ".repeat(20)} ${chalk6.gray(`extras: ${stack.extras.map((e) => e.id).join(", ")}`)}`
        );
      }
    }
    console.log("");
  }
  log7.info(`${chalk6.bold(plugins.length)} plugin(s) loaded, ${chalk6.bold(stacks.length)} stack(s) available`);
  console.log("");
}

// src/index.ts
var program = new Command();
program.name("takohemi").description("Opinionated project scaffolding CLI with plugin architecture").version("0.1.0");
program.command("create").alias("c").description("Create a new project from a template").argument("[name]", "Project name").option("-s, --stack <stack>", "Stack ID (skip interactive selection)").option("--no-install", "Skip dependency installation").option("--no-git", "Skip git initialization").option("-v, --verbose", "Show debug output").action(async (name, options) => {
  await loadAllPlugins();
  await createCommand({
    name,
    stack: options.stack,
    skipInstall: !options.install,
    skipGit: !options.git
  });
});
program.command("add").alias("a").description("Add a module to an existing project (v0.2)").argument("[module]", "Module type (component, page, hook, store)").argument("[name]", "Module name").action(async (module) => {
  await addCommand(module);
});
program.command("doctor").alias("d").description("Check project health and standards compliance (v0.3)").action(async () => {
  await doctorCommand();
});
program.command("list").alias("ls").description("List available stacks and plugins").action(async () => {
  await loadAllPlugins();
  await listCommand();
});
program.parse();
//# sourceMappingURL=index.js.map