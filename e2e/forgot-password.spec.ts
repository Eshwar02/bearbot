import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByRole("textbox")).toBeVisible();

    await expect(page.getByRole("button")).toBeVisible();
  });

  test("allows entering email", async ({ page }) => {
    await page.goto("/forgot-password");

    const emailInput = page.getByRole("textbox");

    await emailInput.fill("test@example.com");

    await expect(emailInput).toHaveValue("test@example.com");
  });
});
