import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import { validateProject, formatDiagnostics, getExitCode } from "./validator.js";
import type { DiagnosticResult } from "./validator.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `takohemi-validator-test-${Date.now()}`);
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ============================================================================
// validateProject
// ============================================================================

describe("validateProject", () => {
  it("fails when no takohemi.json exists", async () => {
    const results = await validateProject(tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fail");
    expect(results[0].name).toBe("takohemi.json");
  });

  it("passes takohemi.json check when config exists", async () => {
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    });
    await fs.ensureDir(path.join(tmpDir, "src"));
    await fs.writeJson(path.join(tmpDir, "package.json"), { name: "test" });

    const results = await validateProject(tmpDir);
    const configResult = results.find((r) => r.name === "takohemi.json");
    expect(configResult).toBeDefined();
    expect(configResult!.status).toBe("pass");
  });

  it("checks project structure (src/ and package.json)", async () => {
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    });
    // No src/ or package.json

    const results = await validateProject(tmpDir);
    const structResult = results.find((r) => r.name === "Project structure");
    expect(structResult).toBeDefined();
    expect(structResult!.status).toBe("fail");
  });

  it("passes structure check when src/ and package.json exist", async () => {
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    });
    await fs.ensureDir(path.join(tmpDir, "src"));
    await fs.writeJson(path.join(tmpDir, "package.json"), { name: "test" });

    const results = await validateProject(tmpDir);
    const structResult = results.find((r) => r.name === "Project structure");
    expect(structResult!.status).toBe("pass");
  });

  it("warns when tsconfig.json is missing", async () => {
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    });
    await fs.ensureDir(path.join(tmpDir, "src"));
    await fs.writeJson(path.join(tmpDir, "package.json"), { name: "test" });

    const results = await validateProject(tmpDir);
    const tsResult = results.find((r) => r.name === "TypeScript config");
    expect(tsResult!.status).toBe("warn");
  });

  it("warns when node_modules is missing", async () => {
    await fs.writeJson(path.join(tmpDir, "takohemi.json"), {
      cliVersion: "0.1.4",
      stack: "react-vite",
      extras: [],
      variables: {},
      createdAt: "2026-01-01",
    });
    await fs.ensureDir(path.join(tmpDir, "src"));
    await fs.writeJson(path.join(tmpDir, "package.json"), { name: "test" });

    const results = await validateProject(tmpDir);
    const depsResult = results.find((r) => r.name === "Dependencies");
    expect(depsResult!.status).toBe("warn");
  });
});

// ============================================================================
// formatDiagnostics
// ============================================================================

describe("formatDiagnostics", () => {
  it("formats pass/warn/fail results with summary", () => {
    const results: DiagnosticResult[] = [
      { name: "Config", status: "pass", message: "OK" },
      { name: "Deps", status: "warn", message: "Missing" },
      { name: "Structure", status: "fail", message: "Bad" },
    ];

    const output = formatDiagnostics(results);
    expect(output).toContain("Config");
    expect(output).toContain("Deps");
    expect(output).toContain("Structure");
    expect(output).toContain("1 passed");
    expect(output).toContain("1 warnings");
    expect(output).toContain("1 failures");
  });

  it("omits warnings/failures count when zero", () => {
    const results: DiagnosticResult[] = [
      { name: "Config", status: "pass", message: "OK" },
    ];

    const output = formatDiagnostics(results);
    expect(output).toContain("1 passed");
    expect(output).not.toContain("warnings");
    expect(output).not.toContain("failures");
  });
});

// ============================================================================
// getExitCode
// ============================================================================

describe("getExitCode", () => {
  it("returns 0 when all pass", () => {
    const results: DiagnosticResult[] = [
      { name: "A", status: "pass", message: "" },
      { name: "B", status: "pass", message: "" },
    ];
    expect(getExitCode(results)).toBe(0);
  });

  it("returns 0 when only warnings", () => {
    const results: DiagnosticResult[] = [
      { name: "A", status: "pass", message: "" },
      { name: "B", status: "warn", message: "" },
    ];
    expect(getExitCode(results)).toBe(0);
  });

  it("returns 1 when any failure", () => {
    const results: DiagnosticResult[] = [
      { name: "A", status: "pass", message: "" },
      { name: "B", status: "fail", message: "" },
    ];
    expect(getExitCode(results)).toBe(1);
  });
});
