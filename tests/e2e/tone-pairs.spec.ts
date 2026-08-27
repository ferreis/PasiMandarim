import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = async function () {
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
}

async function keepOnlyFirstTone(page: import('@playwright/test').Page, selectedTone: number) {
  const group = page.locator('.tone-selector-grid fieldset').nth(0)
  for (const tone of [1, 2, 3, 4]) {
    if (tone !== selectedTone) {
      await group.getByText(`${tone}º`, { exact: true }).click()
    }
  }
}

async function keepOnlySecondTone(page: import('@playwright/test').Page, selectedTone: number) {
  const group = page.locator('.tone-selector-grid fieldset').nth(1)
  for (const tone of [1, 2, 3, 4, 5]) {
    if (tone === selectedTone) continue
    await group.getByText(tone === 5 ? 'Tom neutro' : `${tone}º tom`, { exact: true }).click()
  }
}

async function expectSingleTonePair(page: import('@playwright/test').Page) {
  const summary = page.locator('.tone-selection-summary')
  await expect(summary.locator('strong')).toHaveText('1')
  await expect(summary.locator('span')).toContainText('pares selecionados')
}

test('treina um par tonal selecionado e salva o resultado no navegador', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  await expect(page.getByRole('heading', { name: 'Identificação de pares tonais' })).toBeVisible()

  await keepOnlyFirstTone(page, 1)
  await keepOnlySecondTone(page, 1)
  await expectSingleTonePair(page)

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

  await keepOnlyFirstTone(page, 3)
  await keepOnlySecondTone(page, 3)
  await expectSingleTonePair(page)

  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await page.getByRole('button', { name: '▶ Ouvir palavra' }).click()

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '3º' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '3º' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.locator('.sandhi-note')).toContainText('Regra especial 3–3')
})
