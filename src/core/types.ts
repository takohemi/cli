// ============================================================================
// Takohemi Core Types
// The entire plugin system is built on these interfaces.
// Adding a new stack, command, or feature = implementing these contracts.
// ============================================================================

/**
 * Represents a single technology stack (e.g., react-vite, nextjs, nestjs)
 * Each plugin registers one or more stacks.
 */
export interface TakohemiStack {
  /** Unique identifier (e.g., "react-vite", "nextjs") */
  id: string;
  /** Display name shown in prompts */
  name: string;
  /** Short description */
  description: string;
  /** Category for grouping in prompts */
  category: StackCategory;
  /** Template source — local path or GitHub repo */
  templateSource: TemplateSource;
  /** Variables the template expects (replaced via Handlebars) */
  variables: TemplateVariable[];
  /** Optional extras that can be layered on top */
  extras: StackExtra[];
  /** Post-scaffold hooks (install deps, init git, etc.) */
  hooks: StackHooks;
  /** Minimum CLI version required */
  minCliVersion?: string;
}

export type StackCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "database"
  | "infra"
  | "library";

export interface TemplateSource {
  /** "local" = bundled with CLI, "github" = fetched from repo */
  type: "local" | "github";
  /** Path (local) or repo URL (github) — e.g., "takohemi/templates/react-vite" */
  path: string;
  /** Branch or tag to pull from (github only) */
  ref?: string;
}

export interface TemplateVariable {
  /** Variable name (used in Handlebars: {{projectName}}) */
  name: string;
  /** Human-readable label for prompts */
  label: string;
  /** Default value */
  defaultValue?: string;
  /** Type of input */
  type: "text" | "select" | "confirm" | "multiselect";
  /** Options for select/multiselect */
  choices?: { title: string; value: string }[];
  /** Validation function */
  validate?: (value: string) => boolean | string;
}

export interface StackExtra {
  /** Unique ID */
  id: string;
  /** Display name */
  name: string;
  /** Description shown in multi-select */
  description: string;
  /** Template source for this extra */
  templateSource: TemplateSource;
  /** Does this extra depend on other extras? */
  dependsOn?: string[];
}

export interface StackHooks {
  /** Runs before template is copied */
  beforeScaffold?: (ctx: HookContext) => Promise<void>;
  /** Runs after template is copied but before extras */
  afterScaffold?: (ctx: HookContext) => Promise<void>;
  /** Runs after everything is set up */
  afterSetup?: (ctx: HookContext) => Promise<void>;
}

export interface HookContext {
  /** Absolute path to the generated project */
  projectDir: string;
  /** Project name */
  projectName: string;
  /** All resolved variables */
  variables: Record<string, string>;
  /** Selected extras */
  extras: string[];
  /** Utility to run shell commands in the project dir */
  exec: (command: string) => Promise<void>;
  /** Logger */
  log: Logger;
}

// ============================================================================
// Plugin System
// ============================================================================

/**
 * A Takohemi plugin registers stacks and/or commands.
 * This is the contract every plugin must implement.
 */
export interface TakohemiPlugin {
  /** Unique plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Stacks provided by this plugin */
  stacks?: TakohemiStack[];
  /** Additional CLI commands provided by this plugin */
  commands?: PluginCommand[];
  /** Called when the plugin is loaded */
  setup?: (registry: PluginRegistry) => Promise<void>;
}

export interface PluginCommand {
  /** Command name (e.g., "lint", "doctor") */
  name: string;
  /** Description for --help */
  description: string;
  /** Command arguments definition */
  arguments?: CommandArgument[];
  /** Command options definition */
  options?: CommandOption[];
  /** The handler */
  handler: (args: Record<string, unknown>) => Promise<void>;
}

export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: unknown;
}

// ============================================================================
// Registry — Central hub where plugins register their stacks/commands
// ============================================================================

export interface PluginRegistry {
  registerStack(stack: TakohemiStack): void;
  registerCommand(command: PluginCommand): void;
  getStacks(category?: StackCategory): TakohemiStack[];
  getStack(id: string): TakohemiStack | undefined;
  getCommands(): PluginCommand[];
  getCommand(name: string): PluginCommand | undefined;
}

// ============================================================================
// Config — Project-level takohemi configuration
// ============================================================================

export interface TakohemiConfig {
  /** CLI version that generated this project */
  cliVersion: string;
  /** Stack used */
  stack: string;
  /** Extras enabled */
  extras: string[];
  /** Resolved variables */
  variables: Record<string, string>;
  /** Timestamp */
  createdAt: string;
  /** Custom config per plugin */
  plugins?: Record<string, unknown>;
}

// ============================================================================
// Logger
// ============================================================================

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
