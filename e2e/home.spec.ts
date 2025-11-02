import { test, expect } from '@playwright/test'

test('homepage has title and hero', async ({ page, baseURL }) => {
  await page.goto(baseURL || '/')
  await expect(page).toHaveTitle(/RE-Novate|RE-Novate - Entrepreneurial Skills Platform/)
  const hero = await page.getByRole('region', { name: /Hero section with main call-to-action/i })
  await expect(hero).toBeVisible()
})
