const { test, expect } = require('@playwright/test');

test('booking flow showcase', async ({ page }) => {
  // 1. Go to Login page
  await page.goto('/');
  await expect(page.locator('text=Stop hunting for rooms')).toBeVisible();

  // 2. Login
  await page.click('text=Sign In');
  
  // 3. Verify Dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Good morning, Asha!')).toBeVisible();

  // 4. Navigate to Book Room
  await page.click('text=Book Room');
  await expect(page.locator('text=Meeting Details')).toBeVisible();

  // 5. Try to book (trigger clash)
  await page.click('button:has-text("Find the Perfect Room")');
  
  // 6. Verify clash and alternatives
  await expect(page.locator('text=CLASH DETECTED')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Smart Alternatives')).toBeVisible();

  // 7. Pick an alternative
  await page.click('button:has-text("Book Orion")');

  // 8. Verify success screen
  await expect(page.locator('text=Meeting Confirmed!')).toBeVisible({ timeout: 10000 });
});
