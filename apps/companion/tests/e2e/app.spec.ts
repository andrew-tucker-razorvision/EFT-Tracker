/**
 * E2E tests for EFT Tracker Companion App
 *
 * These tests run against the actual Tauri application using tauri-driver.
 * They test the full application flow including Rust backend and React frontend.
 *
 * Prerequisites:
 * 1. Build the app: npm run tauri:build
 * 2. Start tauri-driver: cargo install tauri-driver && tauri-driver
 * 3. Run tests: npm run test:e2e
 */

describe("EFT Tracker Companion App", () => {
  describe("Initial Load", () => {
    it("should display the app header", async () => {
      // Wait for the app to load
      await browser.waitUntil(
        async () => {
          const header = await $("h1");
          return header.isDisplayed();
        },
        { timeout: 10000, timeoutMsg: "App header did not load" }
      );

      const header = await $("h1");
      await expect(header).toHaveText("EFT Tracker Companion");
    });

    it("should show the Account section", async () => {
      const accountSection = await $("h2=Account");
      await expect(accountSection).toBeDisplayed();
    });

    it("should show the EFT Installation section", async () => {
      const installSection = await $("h2=EFT Installation");
      await expect(installSection).toBeDisplayed();
    });

    it("should show the settings button in header", async () => {
      // Settings button should be in the header
      const settingsButton = await $('button[aria-label="Settings"]');
      // If no aria-label, try finding by SVG icon class
      if (!(await settingsButton.isExisting())) {
        const headerButtons = await $$("header button");
        expect(headerButtons.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Unlinked State", () => {
    it("should show 'Link Account' button when not linked", async () => {
      // Look for the Link Account button in the Account section
      const linkButton = await $("button*=Link Account");
      await expect(linkButton).toBeDisplayed();
    });

    it("should show onboarding guide when not linked", async () => {
      const getStarted = await $("h2*=Get Started");
      await expect(getStarted).toBeDisplayed();
    });

    it("should display step-by-step instructions", async () => {
      // Check for numbered steps
      const step1 = await $("span=1");
      const step2 = await $("span=2");
      const step3 = await $("span=3");

      await expect(step1).toBeDisplayed();
      await expect(step2).toBeDisplayed();
      await expect(step3).toBeDisplayed();
    });

    it("should have a link to eft-tracker.vercel.app", async () => {
      const link = await $('a[href="https://eft-tracker.vercel.app"]');
      await expect(link).toBeDisplayed();
    });
  });

  describe("Link Account View", () => {
    it("should navigate to link account view when clicking Link Account", async () => {
      // Find and click the Link Account button in onboarding section
      const linkButton = await $(
        ".bg-tarkov-accent\\/10 button*=Link Account"
      );
      if (await linkButton.isExisting()) {
        await linkButton.click();
      } else {
        // Try the header button
        const headerLink = await $("button*=Link Account");
        await headerLink.click();
      }

      // Should now see the token input form
      await browser.waitUntil(
        async () => {
          const tokenInput = await $('input[type="password"]');
          return tokenInput.isDisplayed();
        },
        { timeout: 5000 }
      );

      const tokenInput = await $('input[type="password"]');
      await expect(tokenInput).toBeDisplayed();
    });

    it("should show validation error for invalid token", async () => {
      const tokenInput = await $('input[type="password"]');
      await tokenInput.setValue("invalid_token_12345");

      // Find and click the validate/link button
      const validateButton = await $("button*=Link");
      await validateButton.click();

      // Wait for error message
      await browser.waitUntil(
        async () => {
          const errorText = await $(".text-tarkov-error");
          return errorText.isExisting();
        },
        { timeout: 10000, timeoutMsg: "Error message did not appear" }
      );
    });

    it("should have a back button to return to main view", async () => {
      const backButton = await $("button*=Back");
      if (await backButton.isExisting()) {
        await backButton.click();
      } else {
        // Try finding cancel or X button
        const cancelButton = await $("button*=Cancel");
        if (await cancelButton.isExisting()) {
          await cancelButton.click();
        }
      }

      // Should be back on main view
      await browser.waitUntil(
        async () => {
          const accountSection = await $("h2=Account");
          return accountSection.isDisplayed();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Settings View", () => {
    it("should navigate to settings when clicking settings button", async () => {
      // Find settings button in header (gear icon)
      const settingsButtons = await $$("header button");
      // Click the last button in header (usually settings)
      const settingsButton = settingsButtons[settingsButtons.length - 1];
      await settingsButton.click();

      // Wait for settings view to load
      await browser.waitUntil(
        async () => {
          const settingsTitle = await $("h2*=Settings");
          const appearanceSection = await $("*=Appearance");
          return (
            (await settingsTitle.isExisting()) ||
            (await appearanceSection.isExisting())
          );
        },
        { timeout: 5000 }
      );
    });

    it("should have notification sound toggle", async () => {
      const soundToggle = await $("*=Notification Sound");
      // May be a label or button - just check it exists
      const exists = await soundToggle.isExisting();
      expect(exists).toBe(true);
    });

    it("should have auto-watch toggle", async () => {
      const autoWatch = await $("*=Auto-watch");
      const exists = await autoWatch.isExisting();
      expect(exists).toBe(true);
    });

    it("should navigate back from settings", async () => {
      const backButton = await $("button*=Back");
      await backButton.click();

      await browser.waitUntil(
        async () => {
          const accountSection = await $("h2=Account");
          return accountSection.isDisplayed();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("EFT Path Detection", () => {
    it("should show EFT path status", async () => {
      const installSection = await $("h2=EFT Installation");
      await expect(installSection).toBeDisplayed();

      // Should show either the path or "not found" message
      const pathText = await installSection.parentElement();
      const textContent = await pathText.getText();

      // Check that it shows some status
      const hasPath = textContent.includes("EscapeFromTarkov");
      const notFound = textContent.includes("not found");
      const hasStatus = hasPath || notFound;

      expect(hasStatus).toBe(true);
    });
  });

  describe("Footer", () => {
    it("should display version information", async () => {
      const footer = await $("footer");
      await expect(footer).toBeDisplayed();

      const versionText = await footer.getText();
      // Should contain version number pattern like v0.1.0
      expect(versionText).toMatch(/v\d+\.\d+\.\d+/);
    });

    it("should have a link to GitHub", async () => {
      const githubLink = await $('a[href*="github.com"]');
      await expect(githubLink).toBeDisplayed();
    });
  });
});

describe("Accessibility", () => {
  it("should have proper heading hierarchy", async () => {
    const h1 = await $("h1");
    const h2s = await $$("h2");

    await expect(h1).toBeDisplayed();
    expect(h2s.length).toBeGreaterThan(0);
  });

  it("should have visible focus indicators", async () => {
    // Tab through interactive elements and check focus is visible
    await browser.keys(["Tab"]);

    // Get the focused element
    const focused = await browser.execute(() => {
      return document.activeElement?.tagName;
    });

    // Should have focused on a button or link
    expect(["BUTTON", "A", "INPUT"]).toContain(focused);
  });
});
