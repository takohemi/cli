import type {
  PluginRegistry,
  TakohemiStack,
  PluginCommand,
  StackCategory,
  TakohemiPlugin,
} from "./types.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger();

class Registry implements PluginRegistry {
  private stacks: Map<string, TakohemiStack> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private plugins: Map<string, TakohemiPlugin> = new Map();

  registerStack(stack: TakohemiStack): void {
    if (this.stacks.has(stack.id)) {
      log.warn(`Stack "${stack.id}" is already registered. Overwriting.`);
    }
    this.stacks.set(stack.id, stack);
    log.debug(`Registered stack: ${stack.id} (${stack.category})`);
  }

  registerCommand(command: PluginCommand): void {
    if (this.commands.has(command.name)) {
      log.warn(`Command "${command.name}" is already registered. Overwriting.`);
    }
    this.commands.set(command.name, command);
    log.debug(`Registered command: ${command.name}`);
  }

  getStacks(category?: StackCategory): TakohemiStack[] {
    const all = Array.from(this.stacks.values());
    if (!category) return all;
    return all.filter((s) => s.category === category);
  }

  getStack(id: string): TakohemiStack | undefined {
    return this.stacks.get(id);
  }

  getCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  getCommand(name: string): PluginCommand | undefined {
    return this.commands.get(name);
  }

  async loadPlugin(plugin: TakohemiPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      log.warn(`Plugin "${plugin.name}" already loaded. Skipping.`);
      return;
    }

    log.debug(`Loading plugin: ${plugin.name}@${plugin.version}`);

    // Register stacks
    if (plugin.stacks) {
      for (const stack of plugin.stacks) {
        this.registerStack(stack);
      }
    }

    // Register commands
    if (plugin.commands) {
      for (const command of plugin.commands) {
        this.registerCommand(command);
      }
    }

    // Run plugin setup
    if (plugin.setup) {
      await plugin.setup(this);
    }

    this.plugins.set(plugin.name, plugin);
    log.debug(`Plugin "${plugin.name}" loaded successfully`);
  }

  getLoadedPlugins(): TakohemiPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Singleton
let instance: Registry | null = null;

export function getRegistry(): Registry {
  if (!instance) {
    instance = new Registry();
  }
  return instance;
}
