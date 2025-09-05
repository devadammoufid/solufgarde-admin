import { test, expect, Page } from '@playwright/test';

function makeJwt(expiresInSeconds: number = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })
  ).toString('base64');
  return `${header}.${payload}.signature`;
}

async function mockAuthRoutes(page: Page) {
  const accessToken = makeJwt(3600);
  const refreshToken = makeJwt(24 * 3600);
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
      body: JSON.stringify({ accessToken, refreshToken, user }),
    });
  });

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  // Optionally handle refresh
  await page.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: makeJwt(3600), refreshToken: makeJwt(24 * 3600), user }),
    });
  });
}

test.describe('Authentication', () => {
  test('unauthenticated user sees Access Denied on root', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });

  test('can log in and see dashboard', async ({ page }) => {
    await mockAuthRoutes(page);
    await page.goto('/login');

    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Mot de passe').fill('password123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Expect to navigate away from login and show dashboard shell
    await expect(page).toHaveURL(/\/?($|\?)/);
    await expect(page.getByText('Tableau de bord')).toBeVisible();
  });
});

