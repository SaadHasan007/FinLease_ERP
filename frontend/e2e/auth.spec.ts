import { expect, test } from '@playwright/test';

test.describe('FinLease browser smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    for (const endpoint of ['accounting/trial-balance', 'assets/']) {
      await page.route(`**/api/v1/${endpoint}**`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });
    }
    await page.route('**/api/v1/customers/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'customer-1', company_name: 'Northstar Logistics', customer_type: 'CORPORATE', email: 'ops@northstar.example', status: 'ACTIVE', risk_category: 'MEDIUM' }]) });
    });
    await page.route('**/api/v1/applications/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'application-1', customer_id: 'customer-1', requested_amount: '50000', tenure_months: 36, status: 'APPROVED' }]) });
    });
    await page.route('**/api/v1/contracts/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'contract-1', application_id: 'application-1', principal_amount: '50000', status: 'ACTIVE' }]) });
    });
    await page.route('**/api/v1/collections/cases**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'case-1', contract_id: 'contract-1', status: 'ESCALATED', outstanding_amount: '12500', created_at: '2026-09-14T09:00:00Z' }]) });
    });
    await page.route('**/api/v1/auth/login', async (route) => {
      const body = route.request().postDataJSON() as { email?: string; password?: string };
      if (body.email === 'admin@finlease.com' && body.password === 'Admin@123!') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { access_token: 'playwright-test-token' } }),
        });
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });
  });

    test('shows the login page', async ({ page }, testInfo) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to FinLease' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter workspace' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('login-page.png'), fullPage: true });
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('admin@finlease.com').fill('wrong@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword!');
    await page.getByRole('button', { name: 'Enter workspace' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  });

    test('logs in and reaches the protected dashboard', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Load demo credentials' }).click();
    await page.getByRole('button', { name: 'Enter workspace' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Good morning, Alex' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  });

  test('shows an escalated collection case in the dashboard work queue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await page.getByRole('button', { name: 'Load demo credentials' }).click();
    await page.getByRole('button', { name: 'Enter workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Cases needing attention' })).toBeVisible();
    await expect(page.getByText('Northstar Logistics', { exact: true })).toBeVisible();
    await expect(page.getByText('ESCALATED')).toBeVisible();
    await expect(page.getByText('$12,500', { exact: true }).last()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open collections workspace' })).toHaveAttribute('href', '/collections');
  });
});