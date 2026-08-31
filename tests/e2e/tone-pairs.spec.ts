import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __tonePlayCount: number }).__tonePlayCount = 0
    HTMLMediaElement.prototype.play = async function () {
      const state = window as unknown as { __tonePlayCount: number }
      state.__tonePlayCount += 1
      window.setTimeout(() => this.dispatchEvent(new Event('ended')), 0)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
  })
}

async function useDeterministicRandom(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, 'getRandomValues', {
      configurable: true,
      value(array: Uint32Array) {
        array.fill(0)
        return array
      },
    })
  })
}

async function useSettings(
  page: import('@playwright/test').Page,
  settings: { quantity: number; autoRepeat: boolean; studyMode: boolean; repeatDelayMs: number },
) {
  await page.addInitScript((value) => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify(value))
  }, settings)
}

async function keepOnlyFirstTone(page: import('@playwright/test').Page, selectedTone: number) {
  const group = page.locator('.tone-selector-grid fieldset').nth(0)
  for (const tone of [1, 2, 3, 4]) {
    if (tone !== selectedTone) await group.locator('label').nth(tone - 1).click()
  }
}

async function keepOnlySecondTone(page: import('@playwright/test').Page, selectedTone: number) {
  const group = page.locator('.tone-selector-grid fieldset').nth(1)
  for (const tone of [1, 2, 3, 4, 5]) {
    if (tone !== selectedTone) await group.locator('label').nth(tone - 1).click()
  }
}

async function expectSingleTonePair(page: import('@playwright/test').Page) {
  const summary = page.locator('.tone-selection-summary')
  await expect(summary.locator('strong')).toHaveText('1')
  await expect(summary.locator('span')).toContainText('pares selecionados')
}

async function startAndWaitForAudio(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await expect(page.getByRole('button', { name: '▶ Ouvir novamente' })).toBeEnabled()
}

test('mostra os símbolos e números dos cinco tons', async ({ page }) => {
  await page.goto('/#/tones')

  const secondToneGroup = page.locator('.tone-selector-grid fieldset').nth(1)
  await expect(secondToneGroup.locator('.tone-symbol')).toHaveText(['ˉ', 'ˊ', 'ˇ', 'ˋ', '·'])
  await expect(secondToneGroup.locator('.tone-number')).toHaveText(['1', '2', '3', '4', '5'])
  await expect(secondToneGroup).toContainText('Neutro')
})

test('mostra como respostas somente os tons escolhidos', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  const firstToneGroup = page.locator('.tone-selector-grid fieldset').nth(0)
  await firstToneGroup.locator('label').nth(1).click()
  await firstToneGroup.locator('label').nth(2).click()

  const secondToneGroup = page.locator('.tone-selector-grid fieldset').nth(1)
  await secondToneGroup.locator('label').nth(1).click()
  await secondToneGroup.locator('label').nth(3).click()

  await startAndWaitForAudio(page)

  const firstAnswers = page.locator('.tone-answer-grid fieldset').nth(0).getByRole('button')
  await expect(firstAnswers).toHaveCount(2)
  await expect(firstAnswers.nth(0)).toHaveAttribute('aria-label', '1º tom')
  await expect(firstAnswers.nth(1)).toHaveAttribute('aria-label', '4º tom')

  const secondAnswers = page.locator('.tone-answer-grid fieldset').nth(1).getByRole('button')
  await expect(secondAnswers).toHaveCount(3)
  await expect(secondAnswers.nth(0)).toHaveAttribute('aria-label', '1º tom')
  await expect(secondAnswers.nth(1)).toHaveAttribute('aria-label', '3º tom')
  await expect(secondAnswers.nth(2)).toHaveAttribute('aria-label', 'Tom neutro')
})

test('reproduz a palavra três vezes automaticamente ao iniciar', async ({ page }) => {
  await mockAudio(page)
  await useSettings(page, { quantity: 10, autoRepeat: true, studyMode: false, repeatDelayMs: 0 })
  await page.goto('/#/tones')

  await startAndWaitForAudio(page)

  await expect.poll(() => page.evaluate(() => (window as unknown as { __tonePlayCount: number }).__tonePlayCount)).toBe(3)
  const size = await page.locator('.tone-answer-number').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
  expect(size).toBeGreaterThanOrEqual(30)
})

test('não exibe configurações gerais duplicadas na tela de tons', async ({ page }) => {
  await page.goto('/#/flashcards/tones')
  await expect(page.locator('.tone-study-options')).toBeHidden()
  await expect(page.locator('.tone-session-row > label')).toBeHidden()
  await expect(page.getByText('Configuração', { exact: true })).toBeHidden()
})

test('treina um par tonal selecionado e salva o resultado no navegador', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  await expect(page.getByRole('heading', { name: 'Flashcards', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Tons' })).toHaveAttribute('aria-current', 'page')

  await keepOnlyFirstTone(page, 1)
  await keepOnlySecondTone(page, 1)
  await expectSingleTonePair(page)
  await startAndWaitForAudio(page)

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '1º tom' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '1º tom' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.getByText('Correto.', { exact: true })).toBeVisible()
  await expect(page.locator('.tone-result')).toContainText('1–1')
  await expect(page.locator('.tone-result')).toContainText('ˉ 1º tom')
  await expect(page.locator('.tone-answer-comparison')).toContainText('Sua resposta')
  await expect(page.locator('.tone-answer-comparison')).toContainText('Resposta correta')
  await expect(page.locator('.tone-result-boxes').nth(0).locator('span')).toHaveText(['1', '1'])
  await expect(page.locator('.tone-result-boxes').nth(1).locator('span')).toHaveText(['1', '1'])

  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:tone-pair-attempts:v1'))
  expect(stored).toContain('1-1')
  expect(stored).toContain('"tone1Correct":true')
  expect(stored).toContain('"tone2Correct":true')
})

test('dá feedback parcial e colore separadamente as duas sílabas', async ({ page }) => {
  await mockAudio(page)
  await useDeterministicRandom(page)
  await page.goto('/#/tones')

  await keepOnlyFirstTone(page, 1)
  const secondToneGroup = page.locator('.tone-selector-grid fieldset').nth(1)
  await secondToneGroup.locator('label').nth(2).click()
  await secondToneGroup.locator('label').nth(3).click()
  await secondToneGroup.locator('label').nth(4).click()

  await startAndWaitForAudio(page)

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '1º tom' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '2º tom' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.getByText('Parcialmente correto.', { exact: true })).toBeVisible()
  await expect(page.getByText('Você acertou o tom da 1ª sílaba.', { exact: true })).toBeVisible()
  await expect(answerGroups.nth(0)).toHaveClass(/syllable-correct/)
  await expect(answerGroups.nth(1)).toHaveClass(/syllable-wrong/)
  await expect(page.locator('.tone-result-boxes').nth(0).locator('span').nth(0)).toHaveClass(/correct/)
  await expect(page.locator('.tone-result-boxes').nth(0).locator('span').nth(1)).toHaveClass(/wrong/)
  await expect(page.locator('.tone-dashboard')).toContainText('1parciais')
  await expect(page.locator('.syllable-performance-list')).toContainText('2ª sílaba')
  await expect(page.locator('.syllable-performance-list')).toContainText('1 erros em 1')

  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:tone-pair-attempts:v1'))
  expect(stored).toContain('"tone1Correct":true')
  expect(stored).toContain('"tone2Correct":false')
  expect(stored).toContain('"answerTone2":2')
})

test('permite mostrar a resposta sem contaminar o histórico de desempenho', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  await keepOnlyFirstTone(page, 1)
  await keepOnlySecondTone(page, 1)
  await startAndWaitForAudio(page)
  await page.getByRole('button', { name: 'Mostrar resposta' }).click()

  await expect(page.getByText('Resposta revelada.', { exact: true })).toBeVisible()
  await expect(page.locator('.tone-result-boxes').nth(0).locator('span')).toHaveText(['—', '—'])
  await expect(page.locator('.tone-result-boxes').nth(1).locator('span')).toHaveText(['1', '1'])
  await expect(page.locator('.tone-dashboard')).toContainText('1apenas estudadas')
  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:tone-pair-attempts:v1'))
  expect(stored).toBeNull()
})

test('modo estudo automático usa a configuração global e revela sem exigir resposta', async ({ page }) => {
  test.setTimeout(12_000)
  await mockAudio(page)
  await useSettings(page, { quantity: 5, autoRepeat: true, studyMode: true, repeatDelayMs: 0 })
  await page.goto('/#/tones')

  await page.getByRole('button', { name: 'Iniciar treino' }).click()

  await expect(page.getByRole('button', { name: 'Parar modo automático' })).toBeVisible()
  await expect(page.getByText('Resposta revelada.', { exact: true })).toBeVisible({ timeout: 4_000 })
  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:tone-pair-attempts:v1'))
  expect(stored).toBeNull()
})

test('explica o sandhi quando o par lexical é 3–3', async ({ page }) => {
  await mockAudio(page)
  await page.goto('/#/tones')

  await keepOnlyFirstTone(page, 3)
  await keepOnlySecondTone(page, 3)
  await expectSingleTonePair(page)
  await startAndWaitForAudio(page)

  const answerGroups = page.locator('.tone-answer-grid fieldset')
  await answerGroups.nth(0).getByRole('button', { name: '3º tom' }).click()
  await answerGroups.nth(1).getByRole('button', { name: '3º tom' }).click()
  await page.getByRole('button', { name: 'Confirmar resposta' }).click()

  await expect(page.locator('.sandhi-note')).toContainText('Regra especial 3–3')
})