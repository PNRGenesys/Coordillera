import { expect, test } from '@playwright/test'

test('la portada carga y muestra la navegacion principal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Cordillera' })).toBeVisible()
  await expect(page.getByRole('link', { name: /tienda|shop/i })).toBeVisible()
})
