import { expect, test } from '@playwright/test'

test('agrupa os exercícios dentro da área de flashcards', async ({ page }) => {
  await page.goto('/#/flashcards')

  const mainNav = page.getByRole('navigation', { name: 'Menu principal' })
  await expect(mainNav.getByRole('link')).toHaveText(['Comparação', 'Flashcards', 'Radicais'])
  await expect(mainNav.getByRole('link', { name: 'Flashcards' })).toHaveAttribute('class', /active/)

  const categoryNav = page.getByRole('navigation', { name: 'Categorias de flashcards' })
  await expect(categoryNav.getByRole('link')).toHaveText([
    /Comparação/,
    /Tons/,
    /Frases/,
    /Pronúncia/,
  ])
  await expect(categoryNav.getByRole('link', { name: /Comparação/ })).toHaveAttribute('aria-current', 'page')
})

test('troca de categoria sem sair de flashcards', async ({ page }) => {
  await page.goto('/#/flashcards')

  const categoryNav = page.getByRole('navigation', { name: 'Categorias de flashcards' })
  await categoryNav.getByRole('link', { name: /Tons/ }).click()
  await expect(page).toHaveURL(/#\/flashcards\/tones$/)
  await expect(page.locator('.tone-selector-grid')).toBeVisible()

  await categoryNav.getByRole('link', { name: /Frases/ }).click()
  await expect(page).toHaveURL(/#\/flashcards\/sentences$/)
  await expect(page.getByRole('button', { name: 'Iniciar sessão' })).toBeVisible()

  await categoryNav.getByRole('link', { name: /Pronúncia/ }).click()
  await expect(page).toHaveURL(/#\/flashcards\/pronunciation$/)
  await expect(page.getByRole('button', { name: 'Gerar flashcards de pronúncia' })).toBeVisible()
})

test('mantém compatibilidade com as rotas antigas', async ({ page }) => {
  await page.goto('/#/tones')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: /Tons/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.tone-selector-grid')).toBeVisible()

  await page.goto('/#/sentences')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: /Frases/ })).toHaveAttribute('aria-current', 'page')

  await page.goto('/#/pronunciation')
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: /Pronúncia/ })).toHaveAttribute('aria-current', 'page')
})

test('gera a quantidade escolhida de flashcards de pronúncia', async ({ page }) => {
  await page.goto('/#/flashcards/pronunciation')

  const quantity = page.getByLabel('Quantidade')
  await quantity.selectOption('5')
  await page.getByRole('button', { name: 'Gerar flashcards de pronúncia' }).click()

  await expect(page.getByText('Flashcard 1 de 5')).toBeVisible()
  await expect(quantity).toBeDisabled()
  await expect(page.getByLabel('Inicial')).toBeDisabled()
  await expect(page.getByLabel('Final')).toBeDisabled()
  await expect(page.getByLabel('Tom')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Encerrar sessão' })).toBeVisible()
})
