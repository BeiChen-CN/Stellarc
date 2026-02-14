import { test, expect } from '@playwright/test'

test('home and settings core controls visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Stellarc')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始抽选' })).toBeVisible()

  await page.getByRole('button', { name: '系统设置' }).click()
  await expect(page.getByText('设置')).toBeVisible()
  await expect(page.getByText('数据管理')).toBeVisible()
})
