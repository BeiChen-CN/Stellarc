import { expect, test } from '@playwright/test'

import { installElectronApiMock } from './electronApiMock'

test('onboarding can create a class, import students, and finish the setup flow', async ({
  page
}) => {
  await installElectronApiMock(page, {
    'settings.json': {
      onboardingCompleted: false
    },
    'classes.json': {
      classes: [],
      currentClassId: null
    }
  })

  await page.goto('/')

  await page.evaluate(() => {
    const mock = (window as any).__electronApiMock
    mock.setSelectFileResult('students.csv')
    mock.setTextFile(
      'students.csv',
      ['name,studentId,gender,weight,score,status', 'Alice,1001,female,2,5,active'].join('\n')
    )
  })

  const onboarding = page.getByRole('dialog', { name: '新手引导' })
  await expect(onboarding).toBeVisible()
  await expect(page.getByTestId('onboarding-next')).toBeDisabled()

  await page.getByTestId('onboarding-class-name').fill('三年级二班')
  await page.getByTestId('onboarding-create-class').click()
  await page.getByTestId('onboarding-student-name').fill('张三')
  await page.getByTestId('onboarding-add-student').click()
  await page.getByTestId('onboarding-import-students').click()
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByTestId('onboarding-next')).toBeEnabled()

  await page.getByTestId('onboarding-next').click()

  await page.getByTestId('onboarding-color-theme-rose').click()
  await page.getByTestId('onboarding-design-style-minimalism').click()
  await page.getByTestId('onboarding-next').click()

  await page.getByTestId('onboarding-animation-style-flip').click()
  await page.getByTestId('onboarding-animation-speed-fast').click()
  await page.getByTestId('onboarding-animation-duration').fill('1.2')
  await page.getByTestId('onboarding-finish').click()

  await expect(onboarding).toBeHidden()

  const settings = await page.evaluate(() => (window as any).__electronApiMock.getJson('settings.json'))
  const classes = await page.evaluate(() => (window as any).__electronApiMock.getJson('classes.json'))

  expect(settings).toMatchObject({
    onboardingCompleted: true,
    designStyle: 'minimalism',
    colorTheme: 'rose',
    animationStyle: 'flip',
    animationSpeed: 'fast',
    animationDurationScale: 1.2
  })
  expect(classes).toMatchObject({
    classes: [
      {
        name: '三年级二班',
        students: expect.arrayContaining([
          expect.objectContaining({ name: '张三' }),
          expect.objectContaining({ name: 'Alice', studentId: '1001' })
        ])
      }
    ]
  })
})
