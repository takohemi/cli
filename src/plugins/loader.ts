import { getRegistry } from "../core/registry.js";

// Built-in plugins
import reactVitePlugin from "../plugins/react-vite/index.js";
import nextjsPlugin from "../plugins/nextjs/index.js";

/**
 * Loads all built-in plugins into the registry.
 * In the future, this will also scan for external plugins
 * installed via npm (e.g., @takohemi/plugin-nestjs).
 */
export async function loadAllPlugins(): Promise<void> {
  const registry = getRegistry();

  // Load built-in plugins
  const builtInPlugins = [
    reactVitePlugin,
    nextjsPlugin,
    // ── Future plugins go here ──
    // nestjsPlugin,
    // expressPlugin,
    // mongoPlugin,
    // dockerPlugin,
  ];

  for (const plugin of builtInPlugins) {
    await registry.loadPlugin(plugin);
  }

  // TODO: Scan node_modules for @takohemi/plugin-* packages
  // This enables the community/external plugin model:
  //
  // const externalPlugins = await scanForPlugins();
  // for (const plugin of externalPlugins) {
  //   await registry.loadPlugin(plugin);
  // }
}
