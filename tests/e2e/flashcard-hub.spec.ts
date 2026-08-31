import { expect, test } from '@playwright/test'

test('agrupa os exercícios e configurações dentro da área de flashcards', async ({ page }) => {
  await page.goto('/#/flashcards')

  const mainNav = page.getByRole('navigation', { name: 'Menu principal' })
  await expect(mainNav.getByRole('link')).toHaveText(['Comparação', 'Flashcards', 'Radicais'])
  await expect(mainNav.getByRole('link', { name: 'Flashcards' })).toHaveAttribute('class', /active/)

  const categoryNav = page.getByRole('navigation', { name: 'Categorias de flashcards' })
  await expect(categoryNav.getByRole('link')).toHaveText([
    'Comparação',
    'Tons',
    'Frases',
    'Pronúncia',
    'Configurações',
  ])
  await expect(categoryNav.getByRole('link', { name: 'Comparação' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('Identifique qual das duas iniciais foi pronunciada.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Identifique os tons de palavras humanas de duas sílabas.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Treine iniciais, finais ou tons em cada sílaba de uma frase.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Gere alvos e compare sua voz com gravações humanas.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Defina quantidade, repetição automática, intervalo e modo estudo.', { exact: true })).toHaveCount(0)
})

test('troca de categoria sem sair de flashcards', async ({ page }) => {
  await page.goto('/#/flashcards')

  const categoryNav = page.getByRole('navigation', { name: 'Categorias de flashcards' })
  await categoryNav.getByRole('link', { name: 'Tons' }).click()
  await expect(page).toHaveURL(/#\/flashcards\/tones$/)
  await expect(page.locator('.tone-selector-grid')).toBeVisible()

  await categoryNav.getByRole('link', { name: 'Frases' }).click()
  await expect(page).toHaveURL(/#\/flashcards\/sentences$/)
  await expect(page.getByRole('button', { name: 'Iniciar sessão' })).toBeVisible()

  await categoryNav.getByRole('link', { name: 'Pronúncia' }).click()
  await expect(page).toHaveURL(/#\/flashcards\/pronunciation$/)
  await expect(page.getByRole('button', { name: 'Gerar flashcards de pronúncia' })).toBeVisible()

  await categoryNav.getByRole('link', { name: 'Configurações' }).click()
  await expect(page).toHaveURL(/#\/flashcards\/settings$/)
  await expect(page.getByRole('heading', { name: 'Preferências dos treinos' })).toBeVisible()
})

test('mantém compatibilidade com as rotas antigas', async ({ page }) => {
  await page.goto('/#/tones')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Tons' })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.tone-selector-grid')).toBeVisible()

  await page.goto('/#/sentences')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Frases' })).toHaveAttribute('aria-current', 'page')

  await page.goto('/#/pronunciation')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Pronúncia' })).toHaveAttribute('aria-current', 'page')
})

test('salva e reaplica as configurações gerais dos flashcards', async ({ page }) => {
  await page.goto('/#/flashcards/settings')

  const quantity = page.getByLabel('Quantidade padrão de flashcards')
  const repeat = page.getByLabel('Reproduzir 3 vezes automaticamente')
  const studyMode = page.getByLabel('Modo estudo automático')
  const delay = page.getByLabel('Tempo entre as repetições automáticas')

  await expect(quantity.locator('option')).toHaveText([
    '5 flashcards',
    '10 flashcards',
    '20 flashcards',
    '30 flashcards',
    '50 flashcards',
  ])
  await expect(repeat).toBeChecked()
  await expect(delay).toBeVisible()

  await repeat.uncheck()
  await expect(page.getByLabel('Tempo entre as repetições automáticas')).toHaveCount(0)

  await repeat.check()
  await page.getByLabel('Tempo entre as repetições automáticas').selectOption('1500')
  await quantity.selectOption('50')
  await studyMode.check()

  await expect.poll(async () => page.evaluate(() => localStorage.getItem('learning-mandarin:flashcard-settings:v1'))).toContain('"quantity":50')
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('learning-mandarin:flashcard-settings:v1'))).toContain('"repeatDelayMs":1500')

  await page.reload()
  await expect(page.getByLabel('Quantidade padrão de flashcards')).toHaveValue('50')
  await expect(page.getByLabel('Reproduzir 3 vezes automaticamente')).toBeChecked()
  await expect(page.getByLabel('Modo estudo automático')).toBeChecked()
  await expect(page.getByLabel('Tempo entre as repetições automáticas')).toHaveValue('1500')

  await page.goto('/#/flashcards/pronunciation')
  await expect(page.locator('.pronunciation-session-setup select')).toHaveValue('50')
})

test('descarta valores de configuração inválidos salvos no navegador', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('learning-mandarin:flashcard-settings:v1', JSON.stringify({
      quantity: 999,
      autoRepeat: 'sim',
      studyMode: 'não',
      repeatDelayMs: 999999,
    }))
  })
  await page.goto('/#/flashcards/settings')

  await expect(page.getByLabel('Quantidade padrão de flashcards')).toHaveValue('10')
  await expect(page.getByLabel('Reproduzir 3 vezes automaticamente')).toBeChecked()
  await expect(page.getByLabel('Modo estudo automático')).not.toBeChecked()
  await expect(page.getByLabel('Tempo entre as repetições automáticas')).toHaveValue('500')
})

test('gera a quantidade escolhida de flashcards de pronúncia', async ({ page }) => {
  await page.goto('/#/flashcards/settings')
  await page.getByLabel('Quantidade padrão de flashcards').selectOption('5')
  await page.goto('/#/flashcards/pronunciation')

  const quantity = page.locator('.pronunciation-session-setup select')
  await expect(quantity).toHaveValue('5')
  await page.getByRole('button', { name: 'Gerar flashcards de pronúncia' }).click()

  await expect(page.getByText('Flashcard 1 de 5')).toBeVisible()
  await expect(quantity).toBeDisabled()

  const pronunciationSelectors = page.locator('.pronunciation-selectors select')
  await expect(pronunciationSelectors).toHaveCount(3)
  await expect(pronunciationSelectors.nth(0)).toBeDisabled()
  await expect(pronunciationSelectors.nth(1)).toBeDisabled()
  await expect(pronunciationSelectors.nth(2)).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Encerrar sessão' })).toBeVisible()
})