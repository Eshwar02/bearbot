import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByPlaceholder("Email address")).toBeVisible();

    await expect(page.getByPlaceholder("Password")).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Sign in",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("shows google login button", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("button", {
        name: /sign in with google/i,
      }),
    ).toBeVisible();
  });

  test("navigates to forgot password page", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("link", {
        name: /forgot password/i,
      })
      .click();

    await expect(page).toHaveURL(/forgot-password/);
  });

  test("navigates to signup page", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("link", {
        name: /create account/i,
      })
      .click();

    await expect(page).toHaveURL(/signup/);
  });
});
