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

test('usa diagramas grandes e legíveis em desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#/comparison')

  const diagram = page.locator('[data-initial="b"] .tongue-diagram svg')
  await expect(diagram).toBeVisible()

  const box = await diagram.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width ?? 0).toBeGreaterThan(500)
  expect(box?.height ?? 0).toBeGreaterThan(275)
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

test('mostra os cinco tons na comparação sem inventar áudio neutro isolado', async ({ page }) => {
  await page.goto('/#/comparison')

  const toneSelect = page.getByLabel('Tom da comparação')
  await expect(toneSelect.locator('option')).toHaveCount(5)
  await expect(toneSelect.locator('option[value="1"]')).toContainText('ˉ 1º tom')
  await expect(toneSelect.locator('option[value="2"]')).toContainText('ˊ 2º tom')
  await expect(toneSelect.locator('option[value="3"]')).toContainText('ˇ 3º tom')
  await expect(toneSelect.locator('option[value="4"]')).toContainText('ˋ 4º tom')

  const neutral = toneSelect.locator('option[value="5"]')
  await expect(neutral).toContainText('· Tom neutro')
  await expect(neutral).toHaveAttribute('disabled', '')
  await expect(page.locator('.neutral-tone-note')).toContainText('contextual')
  await expect(page.locator('.neutral-tone-note')).toContainText('Tons')
})
