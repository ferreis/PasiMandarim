import { expect, test } from '@playwright/test'

async function mockAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const audioCalls: string[] = []
    class MockAudio extends EventTarget {
      currentTime = 0
      preload = ''
      src = ''
      constructor(src = '') {
        super()
        this.src = src
        audioCalls.push(src)
      }
      async play() {
        queueMicrotask(() => this.dispatchEvent(new Event('ended')))
      }
      pause() {}
    }
    Object.defineProperty(window, '__audioCalls', { value: audioCalls, configurable: true })
    Object.defineProperty(window, 'Audio', { value: MockAudio, configurable: true })
  })
}

async function setSettings(
  page: import('@playwright/test').Page,
  settings: { quantity: number; autoRepeat: boolean; studyMode: boolean; repeatDelayMs: number },
) {
  await page.addInitScript((value) => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify(value))
  }, settings)
}

test('usa a quantidade global na comparação sem mostrar um controle local', async ({ page }) => {
  await mockAudio(page)
  await setSettings(page, { quantity: 5, autoRepeat: false, studyMode: false, repeatDelayMs: 500 })
  await page.goto('/#/flashcards/comparison')

  await expect(page.locator('.flashcard-setup-grid select')).toHaveCount(2)
  await expect(page.locator('.flashcard-setup-grid').getByText('Quantidade', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByText('Questão 1 de 5')).toBeVisible()
})

test('configura a fonte TTS e revela a escolha de voz somente quando aplicável', async ({ page }) => {
  await page.goto('/#/flashcards/settings')

  await expect(page.getByRole('radio', { name: 'Áudio humano', exact: true })).toBeChecked()
  await expect(page.getByLabel('Voz TTS')).toHaveCount(0)
  await page.getByRole('radio', { name: 'TTS', exact: true }).check()
  await expect(page.getByLabel('Voz TTS')).toBeVisible()
  await expect(page.getByLabel('Voz TTS')).toHaveValue('recommended')
  await page.getByLabel('Voz TTS').selectOption('zh-CN-YunxiNeural')

  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:flashcard-settings:v1'))
  expect(stored).toContain('"audioSource":"tts"')
  expect(stored).toContain('"ttsVoice":"zh-CN-YunxiNeural"')
})

test('usa a quantidade global em tons sem mostrar controles gerais duplicados', async ({ page }) => {
  await mockAudio(page)
  await setSettings(page, { quantity: 5, autoRepeat: false, studyMode: false, repeatDelayMs: 1000 })
  await page.goto('/#/flashcards/tones')

  await expect(page.locator('.tone-study-options')).toBeHidden()
  await expect(page.locator('.tone-session-row > label')).toBeHidden()
  await page.getByRole('button', { name: 'Iniciar treino' }).click()
  await expect(page.getByText('Questão 1 de 5')).toBeVisible()
})

test('usa a quantidade global em frases sem mostrar controles gerais duplicados', async ({ page }) => {
  await mockAudio(page)
  await setSettings(page, { quantity: 5, autoRepeat: false, studyMode: false, repeatDelayMs: 500 })
  await page.goto('/#/flashcards/sentences')

  await expect(page.locator('.sentence-controls > label')).toHaveCount(3)
  await expect(page.locator('.sentence-controls > label').first()).toBeHidden()
  await expect(page.locator('.sentence-controls > label').nth(1)).toBeHidden()
  await expect(page.locator('.sentence-controls > label').nth(2)).toBeHidden()
  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByText('Frase 1 de 5')).toBeVisible()
})

test('ativa o modo estudo da comparação pela aba de configurações sem perder a sessão', async ({ page }) => {
  test.setTimeout(12_000)
  await mockAudio(page)
  await setSettings(page, { quantity: 5, autoRepeat: false, studyMode: false, repeatDelayMs: 0 })
  await page.goto('/#/flashcards/comparison')

  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByText('Questão 1 de 5')).toBeVisible()

  await page.getByRole('navigation', { name: 'Categorias de flashcards' })
    .getByRole('link', { name: 'Configurações' })
    .click()
  await page.getByLabel('Modo estudo automático').check()

  await page.getByRole('navigation', { name: 'Categorias de flashcards' })
    .getByRole('link', { name: 'Comparação' })
    .click()

  await expect(page.getByText('Questão 1 de 5')).toBeVisible()
  await expect(page.getByText('Resposta revelada.', { exact: true })).toBeVisible({ timeout: 4_000 })
  const stored = await page.evaluate(() => localStorage.getItem('learning-mandarin:flashcard-attempts:v1'))
  expect(stored).toBeNull()
})

test('reproduz a comparação dos dois lados quando a resposta da comparação está errada', async ({ page }) => {
  await mockAudio(page)
  await setSettings(page, { quantity: 5, autoRepeat: false, studyMode: false, repeatDelayMs: 0 })
  await page.goto('/#/flashcards/comparison')

  await page.getByRole('button', { name: 'Iniciar sessão' }).click()
  await expect(page.getByText('Questão 1 de 5')).toBeVisible()
  await page.evaluate(() => { window.__audioCalls.length = 0 })

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const buttons = page.locator('.flashcard-choices button')
    const count = await buttons.count()
    if (count === 0) break
    await buttons.nth(0).click()
    const resultText = await page.locator('.flashcard-result strong').textContent().catch(() => '')
    if (resultText?.includes('Incorreto')) {
      const audioCalls = await page.evaluate(() => window.__audioCalls.length)
      expect(audioCalls).toBeGreaterThanOrEqual(2)
      return
    }
    await page.getByRole('button', { name: 'Próximo flashcard' }).click()
  }

  throw new Error('Não foi possível gerar uma resposta errada para validar o playback de contraste.')
})

test('remove os textos substituídos da área de flashcards', async ({ page }) => {
  await page.goto('/#/flashcards/comparison')

  await expect(page.getByRole('heading', { name: 'Flashcards', exact: true })).toBeVisible()
  await expect(page.getByText('Flashcards auditivos', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Você pode trocar de categoria a qualquer momento. As configurações gerais e os históricos ficam salvos somente neste navegador.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Identifique qual das duas iniciais foi pronunciada.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Escolha as duas iniciais que deseja comparar', { exact: true })).toBeVisible()
})
