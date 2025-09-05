import { test, expect, Page } from '@playwright/test';

async function mockBasicAuth(page: Page) {
  // Minimal auth mocks for navigation after login
  const user = {
    id: 'u_admin_1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
  };
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'a.b.c', refreshToken: 'r.s.t', user }),
    });
  });
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
  });
}

test('protected admin page shows auth required when unauthenticated', async ({ page }) => {
  await page.goto('/garderies');
  await expect(page.getByText('Authentification requise')).toBeVisible();
});

test('navigate to Garderies after login', async ({ page }) => {
  await mockBasicAuth(page);

  await page.goto('/login');
  await page.getByLabel('Email Address').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('password123');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Sidebar link to Garderies
  await page.getByRole('link', { name: 'Garderies' }).click();
  await expect(page).toHaveURL(/\/garderies/);
  // Page heading should contain Garderies / Daycare centers
  await expect(page.getByText(/Garderies|Daycare Centers/)).toBeVisible();
});

