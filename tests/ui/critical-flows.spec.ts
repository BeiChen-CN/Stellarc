import { expect, test } from '@playwright/test'

test('settings exposes advanced selection toggles', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '系统设置' }).click()

  await expect(page.getByText('显示临时禁选')).toBeVisible()
  await expect(page.getByText('显示连抽')).toBeVisible()
  await expect(page.getByText('显示抽选解释')).toBeVisible()
})

test('home keeps core controls visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '开始点名' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
})
