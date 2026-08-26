import { expect, test } from '@playwright/test'

test('atualiza a explicação e o diagrama quando a inicial muda', async ({ page }) => {
  await page.goto('/#/comparison')

  const initialA = page.getByLabel('Inicial A')
  const initialB = page.getByLabel('Inicial B')

  await expect(page.getByRole('heading', { name: 'Como produzir as iniciais selecionadas' })).toBeVisible()
  await expect(page.locator('[data-initial="b"]')).toContainText('[p]')
  await expect(page.locator('[data-initial="p"]')).toContainText('[pʰ]')
  await expect(page.locator('[data-initial="p"]')).toContainText('ar forte')

  await initialA.selectOption('j')
  await initialB.selectOption('q')

  const guideJ = page.locator('[data-initial="j"]')
  const guideQ = page.locator('[data-initial="q"]')

  await expect(guideJ).toContainText('Alveolopalatal')
  await expect(guideJ).toContainText('[tɕ]')
  await expect(guideQ).toContainText('[tɕʰ]')
  await expect(guideJ.getByRole('img', { name: /palato duro/i })).toBeVisible()
  await expect(guideQ).toContainText('Rajada de ar')
})

test('mostra o contraste retroflexo sem reutilizar HTML do deck Anki', async ({ page }) => {
  await page.goto('/#/comparison')

  await page.getByLabel('Inicial A').selectOption('zh')
  await page.getByLabel('Inicial B').selectOption('ch')

  await expect(page.locator('[data-initial="zh"]')).toContainText('Não aspirada')
  await expect(page.locator('[data-initial="ch"]')).toContainText('Aspirada')
  await expect(page.locator('[data-initial="zh"]')).toContainText('pós-alveolar')
})

test('explica os termos fonéticos usados nos guias', async ({ page }) => {
  await page.goto('/#/comparison')

  await expect(page.getByRole('heading', { name: 'O que significam os termos?' })).toBeVisible()

  const aspiration = page.getByText('Aspiração', { exact: true }).first()
  await aspiration.click()
  await expect(page.getByText(/pares como b\/p, d\/t, g\/k/i)).toBeVisible()
  await expect(page.getByText(/folha de papel diante da boca/i)).toBeVisible()

  const place = page.getByText('Lugar de articulação', { exact: true }).first()
  await place.click()
  await expect(page.getByText(/região da boca onde o ar é bloqueado/i)).toBeVisible()
})
