import { expect, test } from '@playwright/test'

type GeneratedQuestion = { initial: string; final: string; tone: number }

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    class MockAudio extends EventTarget {
      currentTime = 0
      preload = ''
      src = ''
      constructor(src = '') { super(); this.src = src }
      async play() { queueMicrotask(() => this.dispatchEvent(new Event('ended'))) }
      pause() {}
    }
    Object.defineProperty(window, 'Audio', { value: MockAudio, configurable: true })
  })
}

async function generateSession(
  page: import('@playwright/test').Page,
  quantity: number,
): Promise<GeneratedQuestion[]> {
  await page.addInitScript((value) => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify({
      quantity: value,
      autoRepeat: false,
      studyMode: false,
      repeatDelayMs: 0,
    }))
  }, quantity)
  await page.goto('/#/flashcards/comparison')
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()

  const questions: GeneratedQuestion[] = []
  for (let index = 0; index < quantity; index += 1) {
    await page.getByRole('button', { name: /Ouvir áudio|Ouvir novamente/ }).click()
    await expect(page.locator('.flashcard-choice-answer').first()).toBeEnabled()
    await page.locator('.flashcard-choice-answer').first().click()

    const result = await page.locator('.flashcard-result').innerText()
    const match = result.match(/Você ouviu\s+(\S+).*?Final:\s+(\S+)\s+· tom\s+(\d+)/s)
    expect(match, `resultado legível da questão ${index + 1}`).not.toBeNull()
    questions.push({ initial: match![1], final: match![2], tone: Number(match![3]) })

    if (index < quantity - 1) await page.getByRole('button', { name: 'Próximo flashcard' }).click()
  }

  return questions
}

function assertDiversity(questions: GeneratedQuestion[]) {
  const initialCounts = new Map<string, number>()
  const finals = new Set<string>()
  const tones = new Set<number>()
  const combinations = questions.map((question) => `${question.initial}|${question.final}|${question.tone}`)

  for (const question of questions) {
    initialCounts.set(question.initial, (initialCounts.get(question.initial) ?? 0) + 1)
    finals.add(question.final)
    tones.add(question.tone)
  }

  const counts = [...initialCounts.values()]
  expect(Math.abs(counts[0] - counts[1])).toBeLessThanOrEqual(1)
  expect(new Set(combinations).size).toBe(questions.length)
  expect(tones.size).toBe(4)
  expect(finals.size).toBeGreaterThanOrEqual(Math.min(8, questions.length - 1))
  for (let index = 1; index < combinations.length; index += 1) {
    expect(combinations[index]).not.toBe(combinations[index - 1])
  }

  return { initialCounts, finals, tones, combinations }
}

test('gera 10 cards variados e equilibrados para qualquer par com áudio compartilhado', async ({ page }) => {
  await mockAudio(page)
  const questions = await generateSession(page, 10)
  const summary = assertDiversity(questions)

  expect(summary.initialCounts.size).toBe(2)
  expect(summary.finals.size).toBeGreaterThanOrEqual(8)
})

test('gera 50 cards sem reciclar combinações, com finais e tons distribuídos', async ({ page }) => {
  test.setTimeout(30_000)
  await mockAudio(page)
  const questions = await generateSession(page, 50)
  const summary = assertDiversity(questions)

  expect(summary.initialCounts.size).toBe(2)
  expect(summary.finals.size).toBeGreaterThanOrEqual(12)
})
