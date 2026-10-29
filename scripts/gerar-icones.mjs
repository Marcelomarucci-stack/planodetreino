// Gera os ícones PNG do PWA a partir de public/favicon.svg usando o Chromium do Playwright.
// Uso: npm run icons
import { createRequire } from 'node:module'

// Playwright pode estar instalado globalmente; createRequire respeita NODE_PATH.
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFile } from 'node:fs/promises'

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const alvos = [
  { arquivo: 'icon-192.png', tamanho: 192, maskable: false },
  { arquivo: 'icon-512.png', tamanho: 512, maskable: false },
  { arquivo: 'apple-touch-icon.png', tamanho: 180, maskable: true },
  { arquivo: 'icon-maskable-512.png', tamanho: 512, maskable: true },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { arquivo, tamanho, maskable } of alvos) {
  // Ícones "maskable" precisam de fundo cheio (sem cantos transparentes).
  const conteudo = maskable ? svg.replace('rx="112"', 'rx="0"') : svg
  await page.setViewportSize({ width: tamanho, height: tamanho })
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${conteudo.replace('<svg ', `<svg width="${tamanho}" height="${tamanho}" `)}</body></html>`,
  )
  await page.screenshot({ path: new URL(`../public/${arquivo}`, import.meta.url).pathname, omitBackground: true })
}
await browser.close()
console.log('Ícones gerados em public/')
