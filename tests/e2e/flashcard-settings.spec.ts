import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    class MockAudio extends EventTarget {
      currentTime = 0
      preload = ''
      src = ''
      constructor(src = '') { super(); this.src = src }
      async play() {
        queueMicrotask(() => this.dispatchEvent(new Event('ended')))
      }
      pause() {}
    }
    Object.defineProperty(window, 'Audio', { value: MockAudio, configurable: true })
  })
}

test('a quantidade global é usada no treino de tons', async ({ page }) => {
  await mockAudio(page)
  await page.addInitScript(() => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify({
      quantity: 5,
      autoRepeat: false,
      studyMode: false,
      repeatDelayMs: 1000,
    }))
  })

  await page.goto('/#/flashcards/tones')
  const quantity = page.locator('.tone-session-row select')
  await expect(quantity).toHaveValue('5')
  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await expect(page.getByText('Questão 1 de 5')).toBeVisible()
})

test('a quantidade global é usada no treino de frases', async ({ page }) => {
  await mockAudio(page)
  await page.addInitScript(() => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify({
      quantity: 5,
      autoRepeat: false,
      studyMode: false,
      repeatDelayMs: 500,
    }))
  })

  await page.goto('/#/flashcards/sentences')
  const quantity = page.locator('.sentence-controls select').first()
  await expect(quantity).toHaveValue('5')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByText('Frase 1 de 5')).toBeVisible()
})
