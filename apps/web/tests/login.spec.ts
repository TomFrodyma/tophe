import { expect, test } from "@playwright/test";

test.describe("login page", () => {
	test("should load and show all relevant login form components", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
		await expect(page.getByText("Please enter your credentials to sign in.")).toBeVisible();

		await expect(page.getByRole("tab", { name: "Magic link" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Password" })).toBeVisible();

		await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();

		// Switch to password mode so password-specific UI is visible
		await page.getByRole("tab", { name: "Password" }).click();

		const passwordInput = page.locator('input[autocomplete="current-password"]');
		await expect(passwordInput).toBeVisible();
		await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();

		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

		await expect(page.getByText("Or continue with")).toBeVisible();

		await expect(page.getByRole("button", { name: "Login with passkey" })).toBeVisible();

		await expect(page.getByRole("link", { name: /Create an account/ })).toBeVisible();
		await expect(page.getByText("Don't have an account yet?")).toBeVisible();
	});

	test("should switch between magic link and password auth modes", async ({ page }) => {
		await page.goto("/login");

		const passwordInput = page.locator('input[autocomplete="current-password"]');

		await page.getByRole("tab", { name: "Password" }).click();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
		await expect(passwordInput).toBeVisible();

		await page.getByRole("tab", { name: "Magic link" }).click();
		await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
		await expect(passwordInput).toBeHidden();

		await page.getByRole("tab", { name: "Password" }).click();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
		await expect(passwordInput).toBeVisible();
	});
});
