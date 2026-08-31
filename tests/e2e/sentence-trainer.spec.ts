import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __sentencePlayCount: number }).__sentencePlayCount = 0
    HTMLMediaElement.prototype.play = async function () {
      const state = window as unknown as { __sentencePlayCount: number }
      state.__sentencePlayCount += 1
      window.setTimeout(() => this.dispatchEvent(new Event('ended')), 0)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {}
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

test('abre o treino de frases com os três modos', async ({ page }) => {
  await page.goto('/#/sentences')

  await expect(page.getByRole('heading', { name: 'Flashcards', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Frases' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('button', { name: 'Iniciais' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Finais' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tons' })).toBeVisible()
  await expect(page.getByText('Tatoeba — frases em mandarim')).toBeVisible()
})

test('reproduz automaticamente três vezes e permite revelar sem pontuar', async ({ page }) => {
  await mockAudio(page)
  await useSettings(page, { quantity: 10, autoRepeat: true, studyMode: false, repeatDelayMs: 0 })
  await page.goto('/#/sentences')

  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByRole('button', { name: '▶ Ouvir novamente' })).toBeEnabled()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __sentencePlayCount: number }).__sentencePlayCount)).toBe(3)

  await page.getByRole('button', { name: 'Mostrar resposta' }).click()
  await expect(page.getByText('Resposta revelada.', { exact: true })).toBeVisible()
  await expect(page.locator('.sentence-result-table article').first()).toContainText('Correto')
  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:sentence-attempts:v1'))
  expect(stored).toBeNull()
})

test('muda para iniciais e cria uma resposta para cada sílaba', async ({ page }) => {
  await mockAudio(page)
  await useSettings(page, { quantity: 5, autoRepeat: true, studyMode: false, repeatDelayMs: 0 })
  await page.goto('/#/sentences')

  await page.getByRole('button', { name: 'Iniciais' }).click()
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByRole('button', { name: '▶ Ouvir novamente' })).toBeEnabled()

  const selectors = page.locator('.sentence-answer-grid select')
  expect(await selectors.count()).toBeGreaterThanOrEqual(3)
  await expect(selectors.first()).toContainText('∅ — sem inicial')
})

test('não exibe quantidade nem opções gerais duplicadas na tela de frases', async ({ page }) => {
  await page.goto('/#/flashcards/sentences')

  const generalControls = page.locator('.sentence-controls > label')
  await expect(generalControls).toHaveCount(3)
  await expect(generalControls.nth(0)).toBeHidden()
  await expect(generalControls.nth(1)).toBeHidden()
  await expect(generalControls.nth(2)).toBeHidden()
})

test('modo estudo automático usa a configuração global e avança sem registrar desempenho', async ({ page }) => {
  test.setTimeout(12_000)
  await mockAudio(page)
  await useSettings(page, { quantity: 5, autoRepeat: true, studyMode: true, repeatDelayMs: 0 })
  await page.goto('/#/sentences')

  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByRole('button', { name: 'Parar modo automático' })).toBeVisible()
  await expect(page.getByText('Resposta revelada.', { exact: true })).toBeVisible({ timeout: 4_000 })
  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:sentence-attempts:v1'))
  expect(stored).toBeNull()
})