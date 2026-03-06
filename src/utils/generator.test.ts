import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import {
  loadTakohemiConfig,
  findTakohemiConfig,
  createGeneratorVariables,
  findGenerator,
} from "./generator.js";
import type { StackGenerator } from "../core/types.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `takohemi-test-${Date.now()}`);
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ============================================================================
// loadTakohemiConfig
// ============================================================================

describe("loadTakohemiConfig", () => {
  it("returns config when takohemi.json exists", async () => {
    const config = {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    };
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), config);

    const result = await loadTakohemiConfig(tmpDir);
    expect(result).toEqual(config);
  });

  it("returns null when no takohemi.json", async () => {
    const result = await loadTakohemiConfig(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null for invalid JSON", async () => {
    await fs.writeFile(path.join(tmpDir, "takohemi.json"), "not json{{{");
    const result = await loadTakohemiConfig(tmpDir);
    expect(result).toBeNull();
  });
});

// ============================================================================
// findTakohemiConfig
// ============================================================================

describe("findTakohemiConfig", () => {
  it("finds config in the given directory", async () => {
    const config = {
      cliVersion: "0.1.4",
      stack: "nextjs",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    };
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), config);

    const result = await findTakohemiConfig(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.config.stack).toBe("nextjs");
    expect(result!.dir).toBe(tmpDir);
  });

  it("finds config in parent directory", async () => {
    const config = {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    };
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), config);

    const subDir = path.join(tmpDir, "src", "components");
    await fs.ensureDir(subDir);

    const result = await findTakohemiConfig(subDir);
    expect(result).not.toBeNull();
    expect(result!.dir).toBe(tmpDir);
  });

  it("returns null when no config anywhere up the tree", async () => {
    // Use a deep temp subdir with no config files
    const deepDir = path.join(tmpDir, "a", "b", "c");
    await fs.ensureDir(deepDir);

    const result = await findTakohemiConfig(deepDir);
    // Might find a takohemi.json higher up on the real FS, so just check it doesn't crash
    // and if found, it's not in our temp dir
    if (result) {
      expect(result.dir).not.toContain(tmpDir);
    } else {
      expect(result).toBeNull();
    }
  });
});

// ============================================================================
// createGeneratorVariables
// ============================================================================

describe("createGeneratorVariables", () => {
  it("generates all case variants from camelCase name", () => {
    const vars = createGeneratorVariables("userProfile");
    expect(vars.name).toBe("userProfile");
    expect(vars.namePascal).toBe("UserProfile");
    expect(vars.nameCamel).toBe("userProfile");
    expect(vars.nameKebab).toBe("user-profile");
  });

  it("handles kebab-case input", () => {
    const vars = createGeneratorVariables("my-button");
    expect(vars.namePascal).toBe("MyButton");
    expect(vars.nameCamel).toBe("myButton");
    expect(vars.nameKebab).toBe("my-button");
  });

  it("handles single word", () => {
    const vars = createGeneratorVariables("header");
    expect(vars.namePascal).toBe("Header");
    expect(vars.nameCamel).toBe("header");
    expect(vars.nameKebab).toBe("header");
  });

  it("handles PascalCase input", () => {
    const vars = createGeneratorVariables("UserCard");
    expect(vars.namePascal).toBe("UserCard");
    expect(vars.nameCamel).toBe("userCard");
    expect(vars.nameKebab).toBe("user-card");
  });
});

// ============================================================================
// findGenerator
// ============================================================================

describe("findGenerator", () => {
  const generators: StackGenerator[] = [
    {
      id: "component",
      name: "Component",
      description: "A component",
      templateSource: { type: "local", path: "react-vite/generators/component" },
    },
    {
      id: "hook",
      name: "Hook",
      description: "A hook",
      templateSource: { type: "local", path: "react-vite/generators/hook" },
    },
  ];

  it("finds generator by id", () => {
    const result = findGenerator(generators, "component");
    expect(result).toBeDefined();
    expect(result!.id).toBe("component");
  });

  it("finds second generator", () => {
    const result = findGenerator(generators, "hook");
    expect(result).toBeDefined();
    expect(result!.id).toBe("hook");
  });

  it("returns undefined for unknown id", () => {
    const result = findGenerator(generators, "unknown");
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty list", () => {
    const result = findGenerator([], "component");
    expect(result).toBeUndefined();
  });
});
