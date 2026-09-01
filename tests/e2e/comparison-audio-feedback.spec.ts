import { expect, test } from '@playwright/test'

async function useControlledAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const calls: string[] = []
    let active = 0
    let maxActive = 0

    class MockAudio extends EventTarget {
      currentTime = 0
      preload = ''
      src = ''
      private timer: number | undefined

      constructor(src = '') {
        super()
        this.src = src
        calls.push(src)
      }

      async play() {
        active += 1
        maxActive = Math.max(maxActive, active)
        this.timer = window.setTimeout(() => {
          active -= 1
          this.dispatchEvent(new Event('ended'))
        }, 90)
      }

      pause() {
        if (this.timer !== undefined) {
          window.clearTimeout(this.timer)
          this.timer = undefined
          active = Math.max(0, active - 1)
        }
      }
    }

    Object.defineProperties(window, {
      __comparisonAudioCalls: { value: calls, configurable: true },
      __comparisonMaxActiveAudio: { get: () => maxActive, configurable: true },
      Audio: { value: MockAudio, configurable: true },
    })
  })
}

test('não revela a pergunta e destaca apenas o feedback após responder', async ({ page }) => {
  await useControlledAudio(page)
  await page.addInitScript(() => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify({
      quantity: 5,
      autoRepeat: false,
      studyMode: false,
      repeatDelayMs: 0,
    }))
  })
  await page.goto('/#/flashcards/comparison')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()

  await page.getByRole('button', { name: '▶ Ouvir áudio' }).click()
  await expect(page.locator('.flashcard-choice.is-active')).toHaveCount(0)
  await expect(page.locator('.flashcard-choice.is-dimmed')).toHaveCount(0)
  await expect(page.locator('.flashcard-choice')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '▶ Ouvir novamente' })).toBeVisible()

  await page.locator('.flashcard-choice-answer').first().click()
  await expect(page.locator('.flashcard-result')).toBeVisible()
  await expect(page.locator('.flashcard-choice-audio')).toHaveCount(2)
  await expect(page.locator('.flashcard-choice-audio svg')).toHaveCount(2)

  // The automatic post-answer contrast starts on A and then moves to B.
  await expect(page.locator('.flashcard-choice.is-active')).toHaveCount(1)
  await expect.poll(async () => page.evaluate(() => window.__comparisonAudioCalls.length)).toBeGreaterThanOrEqual(3)

  const firstReplay = page.locator('.flashcard-choice-audio').first()
  await firstReplay.click()
  await expect(firstReplay).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.flashcard-choice.is-dimmed')).toHaveCount(1)
  await expect(firstReplay).toHaveAttribute('aria-pressed', 'false')

  // A second click while playback is active replaces it instead of overlapping it.
  await firstReplay.click()
  await page.locator('.flashcard-choice-audio').nth(1).click()
  await expect.poll(async () => page.evaluate(() => window.__comparisonMaxActiveAudio)).toBe(1)
})
