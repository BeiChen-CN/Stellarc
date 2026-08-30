const { chromium } = require('@playwright/test')
;(async () => {
  const app = await chromium.connectOverCDP('http://127.0.0.1:9222')
  const page = app.contexts()[0].pages()[0]
  await page.waitForTimeout(1000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: '沉浸模式' }).click()
  await page.waitForTimeout(1200)
  // 球放到屏幕中央偏左的空白处，醒目位置
  await page.evaluate(() => {
    void window.electronAPI.setImmersiveWindowPhase('ball', { anchor: { x: 1100, y: 620 } })
  })
  await page.waitForTimeout(900)
  const check = await page.evaluate(() => ({
    ball: !!document.querySelector('[data-testid="immersive-ball"]'),
    htmlBg: getComputedStyle(document.documentElement).backgroundColor
  }))
  console.log('STATE:', JSON.stringify(check))
  process.exit(0)
})().catch((e) => { console.error('ERR:', e.message); process.exit(1) })
