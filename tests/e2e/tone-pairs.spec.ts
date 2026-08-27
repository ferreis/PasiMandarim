import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = async function () {
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
}

test('treina um par tonal selecionado e salva o resultado no navegador', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  await expect(page.getByRole('heading', { name: 'Identificação de pares tonais' })).toBeVisible()

  const setupGroups = page.locator('.tone-selector-grid fieldset')
  const firstToneChecks = setupGroups.nth(0).locator('input[type="checkbox"]')
  const secondToneChecks = setupGroups.nth(1).locator('input[type="checkbox"]')

  for (let index = 1; index < 4; index += 1) await firstToneChecks.nth(index).uncheck()
  for (let index = 1; index < 5; index += 1) await secondToneChecks.nth(index).uncheck()

  await expect(page.locator('.tone-selection-summary')).toContainText('1')
  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await page.getByRole('button', { name: '▶ Ouvir palavra' }).click()

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '1º' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '1º' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.getByText('Correto.', { exact: true })).toBeVisible()
  await expect(page.locator('.tone-result')).toContainText('1–1')

  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:tone-pair-attempts:v1'))
  expect(stored).toContain('1-1')
})

test('explica o sandhi quando o par lexical é 3–3', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  const setupGroups = page.locator('.tone-selector-grid fieldset')
  const firstToneChecks = setupGroups.nth(0).locator('input[type="checkbox"]')
  const secondToneChecks = setupGroups.nth(1).locator('input[type="checkbox"]')

  await firstToneChecks.nth(0).uncheck()
  await firstToneChecks.nth(1).uncheck()
  await firstToneChecks.nth(3).uncheck()
  await secondToneChecks.nth(0).uncheck()
  await secondToneChecks.nth(1).uncheck()
  await secondToneChecks.nth(3).uncheck()
  await secondToneChecks.nth(4).uncheck()

  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await page.getByRole('button', { name: '▶ Ouvir palavra' }).click()

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '3º' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '3º' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.locator('.sandhi-note')).toContainText('Regra especial 3–3')
})
