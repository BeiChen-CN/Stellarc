import { test, expect } from '@playwright/test'
import { installElectronApiMock } from './electronApiMock'

test.beforeEach(async ({ page }) => {
  await installElectronApiMock(page)
})

test('home, settings, and statistics core controls visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Stellarc' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开始点名' })).toBeVisible()

  await page.getByRole('button', { name: '系统设置' }).click()
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()
  await page.getByRole('button', { name: '数据与系统' }).click()
  await expect(page.getByRole('heading', { name: '数据管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: /恢复数据/ })).toBeVisible()

  await page.getByRole('button', { name: '数据统计' }).click()
  await expect(page.getByRole('heading', { name: '数据统计' })).toBeVisible()
})
