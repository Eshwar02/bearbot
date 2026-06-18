import { test, expect } from "@playwright/test";

test.describe("Signup Page", () => {
  test("renders signup form", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByPlaceholder("Full name")).toBeVisible();

    await expect(page.getByPlaceholder("Email address")).toBeVisible();

    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();

    await expect(
      page.locator('input[placeholder="Confirm password"]'),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: /create account/i,
      }),
    ).toBeVisible();
  });

  test("shows password mismatch validation", async ({ page }) => {
    await page.goto("/signup");

    await page.getByPlaceholder("Full name").fill("Test User");

    await page.getByPlaceholder("Email address").fill("test@example.com");

    await page.locator('input[placeholder="Password"]').fill("password123");

    await page
      .locator('input[placeholder="Confirm password"]')
      .fill("different123");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("shows minimum password length validation", async ({ page }) => {
    await page.goto("/signup");

    await page.getByPlaceholder("Full name").fill("Test User");

    await page.getByPlaceholder("Email address").fill("test@example.com");

    await page.locator('input[placeholder="Password"]').fill("123");

    await page.locator('input[placeholder="Confirm password"]').fill("123");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText("Password must be at least 6 characters."),
    ).toBeVisible();
  });

  test("shows google signup button", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("button", {
        name: /sign up with google/i,
      }),
    ).toBeVisible();
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/signup");

    await page
      .getByRole("link", {
        name: /sign in/i,
      })
      .click();

    await expect(page).toHaveURL(/login/);
  });
});
