import type { Options } from "@wdio/types";
import * as path from "path";

// Determine the correct binary path based on platform
const getBinaryPath = (): string => {
  const platform = process.platform;
  const basePath = path.join(__dirname, "src-tauri", "target", "release");

  if (platform === "win32") {
    return path.join(basePath, "eft-tracker-companion.exe");
  } else if (platform === "darwin") {
    return path.join(
      basePath,
      "bundle",
      "macos",
      "EFT Tracker Companion.app",
      "Contents",
      "MacOS",
      "eft-tracker-companion"
    );
  } else {
    // Linux
    return path.join(basePath, "eft-tracker-companion");
  }
};

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: "local",

  // Automatically start tauri-driver
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: "./tsconfig.json",
      transpileOnly: true,
    },
  },

  //
  // ==================
  // Specify Test Files
  // ==================
  specs: ["./tests/e2e/**/*.spec.ts"],

  // Patterns to exclude
  exclude: [],

  //
  // ============
  // Capabilities
  // ============
  maxInstances: 1,
  capabilities: [
    {
      // Use the native Tauri WebDriver capabilities
      "tauri:options": {
        application: getBinaryPath(),
      },
    } as WebdriverIO.Capabilities,
  ],

  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: "info",

  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,

  // Set a base URL in order to shorten url command calls
  baseUrl: "",

  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,

  // Default timeout in milliseconds for request
  connectionRetryTimeout: 120000,

  // Default request retries count
  connectionRetryCount: 3,

  // tauri-driver runs on port 4444
  hostname: "localhost",
  port: 4444,

  //
  // Framework Configuration
  //
  framework: "mocha",

  // Options to be passed to Mocha.
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },

  //
  // Test Reporters
  //
  reporters: ["spec"],

  //
  // Hooks
  //
  // Runs before a WebdriverIO command gets executed
  beforeCommand: async function () {
    // Small delay between commands to ensure UI stability
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  // Hook after each test
  afterTest: async function (
    _test: unknown,
    _context: unknown,
    result: { error?: Error; passed: boolean }
  ) {
    // Take screenshot on failure
    if (!result.passed) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      await browser.saveScreenshot(`./tests/e2e/screenshots/failure-${timestamp}.png`);
    }
  },
};
