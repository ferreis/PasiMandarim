import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = path.join(root, 'data', 'tone-pairs.json')
const outputDir = path.join(root, 'public', 'audio', 'tone-pairs', 'sinosplice')
const sourceBase = 'https://www.sinosplice.com/wp-content/uploads/tone-pair-drills/'
const sourceOrigin = new URL(sourceBase).origin
const userAgent = 'LearningMandarin/0.5 (+https://github.com/ferreis/learning_Mandarin)'
const maxFileBytes = 5 * 1024 * 1024
const force = process.argv.includes('--force')

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new Error('Entrada inválida no catálogo de pares tonais.')
  if (!/^[a-z]+[1-4][a-z]+[0-4]$/.test(entry.slug)) {
    throw new Error(`Slug de áudio inválido: ${String(entry.slug)}`)
  }
  if (![1, 2, 3, 4].includes(entry.tone1) || ![1, 2, 3, 4, 5].includes(entry.tone2)) {
    throw new Error(`Par tonal inválido em ${entry.slug}.`)
  }
  if (typeof entry.hanzi !== 'string' || !entry.hanzi.trim()) {
    throw new Error(`Palavra ausente em ${entry.slug}.`)
  }
}

async function download(entry) {
  validateEntry(entry)
  const destination = path.join(outputDir, `${entry.slug}.mp3`)
  if (!force && await exists(destination)) return 'cached'

  const url = new URL(`${entry.slug}.mp3`, sourceBase)
  if (url.protocol !== 'https:' || url.origin !== sourceOrigin) {
    throw new Error(`Origem de áudio não permitida: ${url.href}`)
  }

  const response = await fetch(url, {
    redirect: 'error',
    headers: { 'User-Agent': userAgent },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar ${url.href}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('audio')) {
    throw new Error(`Conteúdo inesperado para ${entry.slug}: ${contentType || 'sem Content-Type'}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > maxFileBytes) {
    throw new Error(`Tamanho de áudio inválido para ${entry.slug}: ${buffer.length} bytes`)
  }

  await writeFile(destination, buffer)
  return 'downloaded'
}

const entries = JSON.parse(await readFile(catalogPath, 'utf8'))
if (!Array.isArray(entries) || entries.length === 0) throw new Error('Catálogo de pares tonais vazio.')

await mkdir(outputDir, { recursive: true })

let downloaded = 0
let cached = 0
for (const entry of entries) {
  const result = await download(entry)
  if (result === 'downloaded') downloaded += 1
  else cached += 1
}

const pairKeys = new Set(entries.map((entry) => `${entry.tone1}-${entry.tone2}`))
const expectedPairs = new Set()
for (const first of [1, 2, 3, 4]) {
  for (const second of [1, 2, 3, 4, 5]) expectedPairs.add(`${first}-${second}`)
}

const missingPairs = [...expectedPairs].filter((pair) => !pairKeys.has(pair))
if (missingPairs.length) throw new Error(`Faltam pares tonais no catálogo: ${missingPairs.join(', ')}`)

console.log(`Pares tonais: ${entries.length} palavras humanas; ${downloaded} baixadas e ${cached} em cache.`)
console.log('Cobertura: 20/20 combinações tonais.')
