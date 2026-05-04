import { expect, test } from '@playwright/test'
import { installElectronApiMock } from './electronApiMock'

const classSeed = {
  classes: [
    {
      id: 'class-1',
      name: 'Class One',
      students: [
        { id: 's1', name: 'Alice', gender: 'female', status: 'active', weight: 1 },
        { id: 's2', name: 'Bob', gender: 'male', status: 'active', weight: 1 },
        { id: 's3', name: 'Cindy', gender: 'female', status: 'active', weight: 1 }
      ]
    }
  ],
  currentClassId: 'class-1'
}

test('immersive mode opens a compact bubble menu and returns from the top island', async ({
  page
}) => {
  await installElectronApiMock(page, {
    'classes.json': classSeed
  })

  await page.goto('/')

  await page.getByTestId('enter-immersive-mode').click()
  await expect(page.getByTestId('immersive-ball')).toBeVisible()
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const root = document.getElementById('root')
        return {
          htmlBackground: window.getComputedStyle(document.documentElement).backgroundColor,
          bodyBackground: window.getComputedStyle(document.body).backgroundColor,
          rootBackground: root ? window.getComputedStyle(root).backgroundColor : ''
        }
      })
    })
    .toEqual({
      htmlBackground: 'rgba(0, 0, 0, 0)',
      bodyBackground: 'rgba(0, 0, 0, 0)',
      rootBackground: 'rgba(0, 0, 0, 0)'
    })
  const ballPhaseSnapshot = await page.evaluate(() => {
    return (window as any).__electronApiMock
      .getImmersivePhaseSnapshots()
      .find((snapshot: { phase: string }) => snapshot.phase === 'ball')
  })
  expect(ballPhaseSnapshot).toMatchObject({
    htmlBackground: 'rgba(0, 0, 0, 0)',
    bodyBackground: 'rgba(0, 0, 0, 0)',
    rootBackground: 'rgba(0, 0, 0, 0)'
  })

  await page.getByTestId('immersive-ball').click()
  await expect(page.getByTestId('immersive-menu')).toBeVisible()
  await expect(page.getByTestId('immersive-menu-draw')).toBeVisible()
  await expect(page.getByTestId('immersive-menu-return')).toBeVisible()
  await expect(page.getByTestId('immersive-menu-expand')).toHaveCount(0)

  const drawBubble = await page.getByTestId('immersive-menu-draw').boundingBox()
  const returnBubble = await page.getByTestId('immersive-menu-return').boundingBox()
  expect(drawBubble?.width).toBeLessThanOrEqual(72)
  expect(drawBubble?.height).toBeLessThanOrEqual(72)
  expect(returnBubble?.width).toBeLessThanOrEqual(72)
  expect(returnBubble?.height).toBeLessThanOrEqual(72)

  await page.getByTestId('immersive-menu-return').click()
  await expect(page.getByTestId('enter-immersive-mode')).toBeVisible()

  await page.getByTestId('enter-immersive-mode').click()
  await page.getByTestId('immersive-ball').click()
  await page.getByTestId('immersive-menu-draw').click()

  await expect(page.getByTestId('immersive-island')).toBeVisible({ timeout: 3_000 })
  const island = await page.getByTestId('immersive-island').boundingBox()
  expect(island?.y).toBeLessThanOrEqual(12)
  await expect(page.getByTestId('immersive-ball')).toBeVisible({ timeout: 15_000 })

  const phases = await page.evaluate(() => (window as any).__electronApiMock.getImmersivePhases())
  expect(phases).toContain('ball')
  expect(phases).toContain('menu')
  expect(phases).toContain('island')
})

test('immersive draw animates candidates and reveals exactly one student', async ({ page }) => {
  await installElectronApiMock(page, {
    'settings.json': {
      onboardingCompleted: true,
      pickCount: 2,
      animationStyle: 'slot',
      animationSpeed: 'fast',
      animationDurationScale: 0.6,
      soundEnabled: false,
      confettiEnabled: false
    },
    'classes.json': classSeed
  })

  await page.goto('/')

  await page.getByTestId('enter-immersive-mode').click()
  await page.getByTestId('immersive-ball').click()
  await page.getByTestId('immersive-menu-draw').click()

  await expect(page.getByTestId('immersive-draw-animation')).toBeVisible({ timeout: 1_500 })
  await expect(page.getByTestId('immersive-draw-candidate').first()).toBeVisible({ timeout: 2_500 })
  await expect(page.getByTestId('immersive-result-name')).toHaveCount(1, { timeout: 10_000 })

  const resultNames = await page.getByTestId('immersive-result-name').allTextContents()
  expect(new Set(resultNames).size).toBe(1)
})

test('immersive island uses the selected style from settings', async ({ page }) => {
  await installElectronApiMock(page, {
    'settings.json': {
      onboardingCompleted: true,
      immersiveIslandStyle: 'slot',
      pickCount: 2,
      animationSpeed: 'fast',
      animationDurationScale: 0.6,
      soundEnabled: false,
      confettiEnabled: false
    },
    'classes.json': classSeed
  })

  await page.goto('/')

  await page.getByTestId('enter-immersive-mode').click()
  await page.getByTestId('immersive-ball').click()
  await page.getByTestId('immersive-menu-draw').click()

  await expect(page.getByTestId('immersive-island')).toHaveAttribute('data-island-style', 'slot')
  await expect(page.getByTestId('immersive-island-slot')).toBeVisible({ timeout: 2_500 })
  await expect(page.getByTestId('immersive-result-name')).toHaveCount(1, { timeout: 10_000 })
})

test('settings persist the selected immersive island style', async ({ page }) => {
  await installElectronApiMock(page)

  await page.goto('/')
  await page.getByRole('button', { name: '系统设置' }).click()

  await expect(page.getByTestId('immersive-island-style-section')).toBeVisible()
  await expect(page.getByTestId('immersive-island-style-thumb-classic')).toBeVisible()
  await expect(page.getByTestId('immersive-island-style-thumb-beam')).toBeVisible()
  await expect(page.getByTestId('immersive-island-style-thumb-slot')).toBeVisible()
  await expect(page.getByTestId('immersive-island-style-thumb-pulse')).toBeVisible()

  const thumbnailText = await page
    .locator('[data-testid^="immersive-island-style-thumb-"]')
    .allTextContents()
  expect(thumbnailText.join('')).not.toMatch(/\b[ABCD]\b/)

  await page.getByTestId('immersive-island-style-pulse').click()

  const settings = await page.evaluate(() => {
    return (window as any).__electronApiMock.getJson('settings.json') as Record<string, unknown>
  })
  expect(settings.immersiveIslandStyle).toBe('pulse')
})

const transparentIslandStyles = [
  { id: 'beam', testId: 'immersive-island-beam', forbiddenTone: /cyan/i },
  { id: 'slot', testId: 'immersive-island-slot', forbiddenTone: /emerald/i },
  { id: 'pulse', testId: 'immersive-island-pulse', forbiddenTone: /rose/i }
] as const

for (const style of transparentIslandStyles) {
  test(`immersive island ${style.id} draw state uses neutral transparent visuals`, async ({
    page
  }) => {
    await installElectronApiMock(page, {
      'settings.json': {
        onboardingCompleted: true,
        immersiveIslandStyle: style.id,
        animationSpeed: 'fast',
        animationDurationScale: 0.6,
        soundEnabled: false,
        confettiEnabled: false
      },
      'classes.json': classSeed
    })

    await page.goto('/')

    await page.getByTestId('enter-immersive-mode').click()
    await page.getByTestId('immersive-ball').click()
    await page.getByTestId('immersive-menu-draw').click()

    const island = page.getByTestId(style.testId)
    await expect(island).toBeVisible({ timeout: 2_500 })
    await expect(island).toHaveAttribute('data-visual-tone', 'transparent')

    const renderedMarkup = await island.evaluate((element) => element.outerHTML)
    expect(renderedMarkup).not.toMatch(style.forbiddenTone)
  })
}

test('immersive island preview shows selectable visual directions', async ({ page }) => {
  await page.goto('/?preview=immersive-island')

  await expect(page.getByTestId('immersive-island-preview')).toBeVisible()
  await expect(page.getByTestId('island-variant-card')).toHaveCount(4)
  await expect(page.getByTestId('island-variant-classic')).toBeVisible()
  await expect(page.getByTestId('island-variant-beam')).toBeVisible()
  await expect(page.getByTestId('island-variant-slot')).toBeVisible()
  await expect(page.getByTestId('island-variant-pulse')).toBeVisible()
  await expect(page.getByTestId('island-preview-spinning')).toHaveCount(4)
  await expect(page.getByTestId('island-preview-reveal')).toHaveCount(4)
  await expect(page.getByTestId('island-variant-thumb-classic')).toBeVisible()
  await expect(page.getByTestId('island-variant-thumb-beam')).toBeVisible()
  await expect(page.getByTestId('island-variant-thumb-slot')).toBeVisible()
  await expect(page.getByTestId('island-variant-thumb-pulse')).toBeVisible()

  const previewThumbnailText = await page
    .locator('[data-testid^="island-variant-thumb-"]')
    .allTextContents()
  expect(previewThumbnailText.join('')).not.toMatch(/\b[ABCD]\b/)

  await page.getByTestId('island-variant-slot').click()
  await expect(page.getByTestId('selected-island-variant')).toContainText('Capsule Slot')
})
