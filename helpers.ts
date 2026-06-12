import { test, expect, type Page } from '@playwright/test'

const DEV_EMAIL    = process.env.E2E_EMAIL ?? 'david.baquero@consultoriaalpha.com'
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? ''

export async function login(page: Page) {
  test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(DEV_EMAIL)
  await page.locator('input[autocomplete="current-password"]').fill(DEV_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/login/, { timeout: 10_000 })
}

export async function selectEngagement(page: Page) {
  await page.evaluate(() => {
    const engagement = { id: 'd7a9e4b2-2f6a-4b1e-8c9a-3b7e5d2c1b4f', name: 'Proyecto Demo' }
    localStorage.setItem('goby-active-engagement', JSON.stringify(engagement))
  })
}