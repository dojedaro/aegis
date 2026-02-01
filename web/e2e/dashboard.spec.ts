import { test, expect } from "@playwright/test";

test.describe("Aegis Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the header with Aegis branding", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("AEGIS");
    await expect(page.locator(".header-subtitle")).toContainText("Compliance Operations Platform");
  });

  test("should show system operational status", async ({ page }) => {
    await expect(page.locator(".header-status")).toContainText("System Operational");
  });

  test("should display navigation buttons", async ({ page }) => {
    await expect(page.locator('[data-view="overview"]')).toBeVisible();
    await expect(page.locator('[data-view="audit"]')).toBeVisible();
    await expect(page.locator('[data-view="risk"]')).toBeVisible();
    await expect(page.locator('[data-view="credentials"]')).toBeVisible();
    await expect(page.locator('[data-view="regulations"]')).toBeVisible();
    await expect(page.locator('[data-view="about"]')).toBeVisible();
  });

  test("should navigate between views", async ({ page }) => {
    // Click Audit Trail
    await page.click('[data-view="audit"]');
    await expect(page.locator("#audit-view")).toBeVisible();
    await expect(page.locator("#audit-view h2")).toContainText("Audit Trail");

    // Click Risk Matrix
    await page.click('[data-view="risk"]');
    await expect(page.locator("#risk-view")).toBeVisible();
    await expect(page.locator("#risk-view h2")).toContainText("Risk Matrix");

    // Click Credentials
    await page.click('[data-view="credentials"]');
    await expect(page.locator("#credentials-view")).toBeVisible();

    // Click Regulations
    await page.click('[data-view="regulations"]');
    await expect(page.locator("#regulations-view")).toBeVisible();

    // Back to Overview
    await page.click('[data-view="overview"]');
    await expect(page.locator("#overview-view")).toBeVisible();
  });
});

test.describe("Compliance Status", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display compliance gauge", async ({ page }) => {
    await expect(page.locator("#compliance-status-widget")).toBeVisible();
    await expect(page.locator(".widget-title")).toContainText("Compliance Status");
  });

  test("should show framework compliance bars", async ({ page }) => {
    await expect(page.locator(".framework-item")).toHaveCount(4); // GDPR, eIDAS, AML, EU AI Act
  });

  test("should display quick stats", async ({ page }) => {
    await expect(page.locator("#stats-widget")).toBeVisible();
    await expect(page.locator("#stat-checks")).toBeVisible();
    await expect(page.locator("#stat-findings")).toBeVisible();
  });
});

test.describe("Regulations Library", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.click('[data-view="regulations"]');
  });

  test("should display regulations header", async ({ page }) => {
    await expect(page.locator("#regulations-view")).toBeVisible();
    await expect(page.locator("text=Regulatory Framework Library")).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    const searchInput = page.locator("#regulations-search-input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /Search across all regulations/);
  });

  test("should filter by framework", async ({ page }) => {
    // Click GDPR filter
    await page.click('button[data-framework="gdpr"]');

    // Should show GDPR articles
    await expect(page.locator(".framework-section h3")).toContainText("GDPR");
  });

  test("should search for regulations", async ({ page }) => {
    const searchInput = page.locator("#regulations-search-input");
    await searchInput.fill("consent");

    // Wait for debounced search
    await page.waitForTimeout(400);

    // Should show search results
    await expect(page.locator("text=Found")).toBeVisible();
  });
});

test.describe("Guided Tour", () => {
  test("should open demo overlay when clicking Take a Tour", async ({ page }) => {
    await page.goto("/");

    await page.click("#watch-demo-btn");

    await expect(page.locator("#demo-overlay")).toBeVisible();
    await expect(page.locator("text=Welcome to Aegis")).toBeVisible();
  });

  test("should navigate through demo steps", async ({ page }) => {
    await page.goto("/");
    await page.click("#watch-demo-btn");

    // Click Next
    await page.click("#demo-next");
    await expect(page.locator("text=Compliance Dashboard")).toBeVisible();

    // Click Previous
    await page.click("#demo-prev");
    await expect(page.locator("text=Welcome to Aegis")).toBeVisible();
  });

  test("should close demo on X button", async ({ page }) => {
    await page.goto("/");
    await page.click("#watch-demo-btn");

    await page.click("#demo-close");

    await expect(page.locator("#demo-overlay")).toHaveClass(/hidden/);
  });

  test("should close demo on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.click("#watch-demo-btn");

    await page.keyboard.press("Escape");

    await expect(page.locator("#demo-overlay")).toHaveClass(/hidden/);
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("AEGIS");
  });

  test("should have visible focus states", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
