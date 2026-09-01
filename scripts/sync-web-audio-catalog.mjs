import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const matrixPath = path.join(root, 'data', 'pinyin-matrix.json')
const outputPath = path.join(root, 'src', 'data', 'webAudioCatalog.ts')

const repository = 'hugolpz/audio-cmn'
const branch = 'master'
const directory = '64k/syllabs'
const treeUrl = `https://api.github.com/repos/${repository}/git/trees/${branch}?recursive=1`
const rawBaseUrl = `https://raw.githubusercontent.com/${repository}/${branch}/${directory}`
const sourceBaseUrl = `https://github.com/${repository}/blob/${branch}/${directory}`

const zeroInitialSpellings = {
  i: 'yi', ia: 'ya', iao: 'yao', ie: 'ye', iu: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei', uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng',
  ü: 'yu', üe: 'yue', üan: 'yuan', ün: 'yun',
}

const toneMarks = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

function buildPinyinBase(initial, final) {
  if (!initial) return zeroInitialSpellings[final] ?? final
  if (['j', 'q', 'x'].includes(initial) && final.startsWith('ü')) {
    return `${initial}${final.replace('ü', 'u')}`
  }
  return `${initial}${final}`
}

function applyToneMark(base, tone) {
  if (tone === 5) return base

  let index = base.indexOf('a')
  if (index < 0) index = base.indexOf('e')
  if (index < 0 && base.includes('ou')) index = base.indexOf('o')

  if (index < 0) {
    for (let cursor = base.length - 1; cursor >= 0; cursor -= 1) {
      if (toneMarks[base[cursor]]) {
        index = cursor
        break
      }
    }
  }

  if (index < 0) return base
  const marked = toneMarks[base[index]]?.[tone - 1]
  if (!marked) return base
  return `${base.slice(0, index)}${marked}${base.slice(index + 1)}`
}

function candidateNames(base, tone) {
  const normalized = base.replaceAll('ü', 'v').toLowerCase()
  const candidates = [`cmn-${normalized}${tone}.mp3`]

  if (base.includes('ü')) candidates.push(`cmn-${base.toLowerCase()}${tone}.mp3`)
  return candidates
}

async function fetchTree() {
  const response = await fetch(treeUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pasi-mandarim-static-catalog',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub respondeu HTTP ${response.status} ao consultar ${treeUrl}`)
  }

  const payload = await response.json()
  if (payload.truncated) {
    throw new Error('A árvore do audio-cmn veio truncada; o catálogo não será gerado parcialmente.')
  }

  return new Set(
    (payload.tree ?? [])
      .filter((entry) => entry.type === 'blob' && entry.path?.startsWith(`${directory}/cmn-`) && entry.path.endsWith('.mp3'))
      .map((entry) => entry.path.slice(`${directory}/`.length)),
  )
}

function renderCatalog(samples) {
  return `import type { HumanAudioSample } from '../types/audio'\n\n// Arquivo gerado por scripts/sync-web-audio-catalog.mjs. Não edite manualmente.\nexport const webAudioSamples: HumanAudioSample[] = ${JSON.stringify(samples, null, 2)}\n`
}

async function main() {
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'))
  const availableFiles = await fetchTree()
  const samples = []

  for (const initial of matrix.initials) {
    for (const final of initial.finals) {
      const base = buildPinyinBase(initial.value, final)

      for (const tone of [1, 2, 3, 4, 5]) {
        const fileName = candidateNames(base, tone).find((candidate) => availableFiles.has(candidate))
        if (!fileName) continue

        samples.push({
          key: `${initial.value}|${final}|${tone}`,
          pinyin: applyToneMark(base, tone),
          initial: initial.value,
          final,
          tone,
          audioUrl: `${rawBaseUrl}/${encodeURIComponent(fileName)}`,
          originalAudioUrl: `${rawBaseUrl}/${encodeURIComponent(fileName)}`,
          sourcePage: `${sourceBaseUrl}/${encodeURIComponent(fileName)}`,
          speakerId: 'chen-wang',
          speaker: 'Chen Wang',
          speakerOrigin: 'Acervo audio-cmn',
          source: 'audio-cmn / Shtooka',
          credits: 'Chen Wang e colaboradores do projeto audio-cmn',
          license: {
            name: 'CC BY-SA (conforme acervo original)',
            url: 'https://github.com/hugolpz/audio-cmn#readme',
          },
          localFile: false,
          verifiedHuman: true,
        })
      }
    }
  }

  samples.sort((left, right) => left.key.localeCompare(right.key))
  await writeFile(outputPath, renderCatalog(samples), 'utf8')

  console.log(`Catálogo web gerado com ${samples.length} sílabas humanas de Chen Wang.`)
  console.log(`Arquivos MP3 disponíveis no acervo: ${availableFiles.size}.`)

  if (!samples.length) throw new Error('Nenhuma sílaba da matriz foi encontrada no acervo audio-cmn.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
