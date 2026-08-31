import { expect, test } from '@playwright/test'

test('abre o corretor com referência do catálogo web publicado', async ({ page }) => {
  await page.goto('/#/pronunciation')

  await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Categorias de flashcards' }).getByRole('link', { name: 'Pronúncia' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: 'Compare sua pronúncia com uma gravação humana' })).toBeVisible()
  await expect(page.getByText('Corretor local', { exact: true })).toBeHidden()
  await expect(page.getByText(/não é enviado ao GitHub nem salvo pelo projeto/i)).toBeVisible()
  await expect(page.getByRole('button', { name: '▶ Ouvir referência' })).toBeVisible()
  await expect(page.getByRole('button', { name: '● Gravar pronúncia' })).toBeEnabled()
  await expect(page.locator('.pronunciation-target')).toContainText('Chen Wang')
  await expect(page.locator('.pronunciation-target')).not.toContainText('Yue Tan')
  await expect(page.getByText(/ainda não classifica automaticamente se uma inicial/i)).not.toBeVisible()
})

test('trata negação da permissão do microfone sem enviar áudio', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException('negado', 'NotAllowedError')
        },
      },
    })
  })

  await page.goto('/#/pronunciation')
  await page.getByRole('button', { name: '● Gravar pronúncia' }).click()

  await expect(page.getByRole('alert')).toContainText('Permissão do microfone negada')
})