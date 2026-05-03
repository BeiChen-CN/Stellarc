import { expect, test } from '@playwright/test'
import { installElectronApiMock } from './electronApiMock'

test.beforeEach(async ({ page }) => {
  await installElectronApiMock(page)
})

test('settings keeps redundant classroom and removed admin features hidden', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('课堂流程')).not.toBeVisible()
  await expect(page.getByText('课堂模板')).not.toBeVisible()

  await page.getByRole('button', { name: '系统设置' }).click()

  await expect(page.getByText('规则模板')).not.toBeVisible()
  await expect(page.getByText('课堂活动预设')).not.toBeVisible()
  await expect(page.getByText('课堂流程')).not.toBeVisible()
  await expect(page.getByText('课堂模板')).not.toBeVisible()
  await expect(page.getByText('临时禁选')).not.toBeVisible()
  await expect(page.getByText('连续抽取')).not.toBeVisible()
  await expect(page.getByText('抽选解释')).not.toBeVisible()
  await expect(page.getByText('阶段公平轮次')).not.toBeVisible()
  await expect(page.getByText('插件策略')).not.toBeVisible()
  await expect(page.getByText('创建恢复点')).not.toBeVisible()
  await expect(page.getByText('多终端同步')).not.toBeVisible()
  await expect(page.getByText('检查同步状态')).not.toBeVisible()
  await expect(page.getByText('推送到目录')).not.toBeVisible()
  await expect(page.getByText('拉取到本机')).not.toBeVisible()

  const themeColorSection = page.locator(
    'xpath=//h4[normalize-space()="主题颜色"]/ancestor::div[contains(@class,"border-t")][1]'
  )
  const themeColorButtons = themeColorSection.getByTestId('theme-color-option')
  await expect(themeColorButtons).toHaveCount(29)
  await expect(themeColorButtons).toContainText(['克莱因蓝', '莫兰迪绿', '爱马仕橙'])
  await expect(themeColorSection.getByText('自定义', { exact: true })).toBeVisible()
  await expect(themeColorSection.locator('input[type="color"]')).toHaveCount(1)
  await expect(themeColorSection.getByRole('button', { name: '收起主题颜色' })).toBeVisible()

  await themeColorSection.getByRole('button', { name: '收起主题颜色' }).click()
  await expect(themeColorButtons).toHaveCount(9)
  await expect(
    themeColorSection.getByRole('button', { name: '展开全部 29 种配色' })
  ).toBeVisible()
  await expect(themeColorSection.getByText('自定义', { exact: true })).toBeVisible()

  const designStyleButtons = page.locator(
    'xpath=//h4[normalize-space()="设计风格"]/ancestor::div[contains(@class,"border-t")][1]//button'
  )
  await expect(designStyleButtons).toHaveCount(12)
  await expect(page.getByRole('button', { name: 'Cyber Grid' })).toBeVisible()
})

test('home keeps core controls visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '开始点名' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
})
