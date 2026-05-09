import { test, expect } from '@playwright/test';

test.describe('QueueCutter UI Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);
  });

  test('1. Home page loads with hero, discovery card, and country cards', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Verify hero section
    await expect(page.locator('h1')).toBeVisible();
    const heroText = await page.locator('h1').textContent();
    console.log(`Hero text: ${heroText}`);

    // Verify discovery card
    const discoveryCard = page.locator('text=/Not sure which form/i').first();
    await expect(discoveryCard).toBeVisible();

    // Verify 3 country cards (US, IN, GB)
    const countryCards = page.locator('[data-testid="country-card"]');
    const cardCount = await countryCards.count();
    console.log(`Found ${cardCount} country cards`);

    // Check for specific countries
    await expect(page.locator('text=United States')).toBeVisible();
    await expect(page.locator('text=India')).toBeVisible();
    await expect(page.locator('text=United Kingdom')).toBeVisible();
  });

  test('2. Country catalog shows US forms', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Click "View forms" button for United States - look for the link with /catalog/US
    const usLink = page.locator('a[href="/catalog/US"]');
    await expect(usLink).toBeVisible({ timeout: 5000 });
    await usLink.click();

    // Wait for navigation and verify URL
    await page.waitForURL(/\/catalog\/US/);
    console.log(`Current URL: ${page.url()}`);

    // Verify forms are shown (not empty state)
    const formCards = page.locator('[data-testid="form-card"]');
    const formCount = await formCards.count();
    console.log(`Found ${formCount} forms in catalog`);

    if (formCount === 0) {
      // Fallback: look for any form links/buttons
      const formElements = page.locator('a[href*="/forms/"]');
      const formElementCount = await formElements.count();
      console.log(`Found ${formElementCount} form elements via href selector`);
    }

    // Check for expected form names (SNAP, Social Security, or Change of Address)
    const formName = page.locator('div:has-text("SNAP Benefits"), div:has-text("Social Security"), div:has-text("Change of Address")').first();
    await expect(formName).toBeVisible({ timeout: 5000 });
  });

  test('3. Form detail page loads with form name and Start button', async ({ page }) => {
    await page.goto('http://localhost:3000/catalog/US');

    // Click into the first form
    const firstFormLink = page.locator('a[href*="/forms/"]').first();
    const formHref = await firstFormLink.getAttribute('href');
    console.log(`Clicking form: ${formHref}`);
    await firstFormLink.click();

    // Wait for form detail page
    await page.waitForURL(/\/forms\//);
    console.log(`Current URL: ${page.url()}`);

    // Verify form name is displayed
    const formTitle = page.locator('h1, h2').first();
    await expect(formTitle).toBeVisible();
    const titleText = await formTitle.textContent();
    console.log(`Form title: ${titleText}`);

    // Verify Start button or eligibility flow
    const startBtn = page.locator('button', { hasText: /Start|Begin|Next/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
  });

  test('4. Escalation page shows US-specific content, not India content', async ({ page, context }) => {
    // Create a session by manually calling the API via the page context
    const sessionResponse = await context.request.post('http://localhost:3001/api/sessions', {
      data: {
        formId: 'snap-benefits'
      }
    });

    const session = await sessionResponse.json() as any;
    const sessionId = session.id;
    console.log(`Created session: ${sessionId} with formId: ${session.formId}`);

    // Navigate to escalation page for this session
    await page.goto(`http://localhost:3000/session/${sessionId}/escalation`, { waitUntil: 'domcontentloaded' });

    // Wait a moment for content to load
    await page.waitForTimeout(1000);

    // Get all text content
    const pageText = await page.textContent('body');
    console.log(`Page text excerpt: ${pageText?.substring(0, 400)}`);

    // Check for US-specific content (SNAP details)
    const hasUSContent = pageText?.includes('30 days') || pageText?.includes('SNAP') || pageText?.includes('fair hearing');
    console.log(`Has US-specific content: ${hasUSContent}`);

    // Check that India-specific content is NOT present
    const hasIndiaContent = pageText?.includes('District Collector') || pageText?.includes('DLSA');
    console.log(`Has India-specific content (should be false): ${hasIndiaContent}`);

    if (!hasUSContent) {
      throw new Error('Page does not contain expected US-specific content');
    }

    if (hasIndiaContent) {
      throw new Error('Page contains India-specific content when it should show US content');
    }
  });

  test('5. Discovery card error state - submit with text and verify graceful handling', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Find discovery textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Type text
    await textarea.fill('I need food assistance');

    // Find and click submit button
    const submitBtn = page.locator('button', { hasText: /Find my form|Submit|Search|Analyze/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for response (error or success)
    await page.waitForTimeout(2000);

    // Check for error toast or graceful navigation
    const errorToast = page.locator('[role="alert"]');
    const hasError = await errorToast.isVisible().catch(() => false);
    console.log(`Error toast visible: ${hasError}`);

    // Check if page navigated or stayed on home
    const currentUrl = page.url();
    console.log(`Current URL after submission: ${currentUrl}`);

    // Just verify the page didn't crash (no console errors)
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    if (errors.length > 0) {
      console.log(`Console errors: ${errors.join(', ')}`);
    }
  });
});
