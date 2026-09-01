import { createWriteStream } from 'node:fs'
import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const matrixPath = path.join(root, 'data', 'pinyin-matrix.json')
const generatedCatalogPath = path.join(root, 'src', 'data', 'generatedAudioCatalog.ts')
const audioRoot = path.join(root, 'public', 'audio', 'shtooka')
const publicCatalogPath = path.join(audioRoot, 'catalog.json')
const cacheRoot = path.join(root, '.cache', 'shtooka')
const force = process.argv.includes('--force')
const audioDownloadConcurrency = 1
const audioDownloadIntervalMilliseconds = 1_500
const maximumDownloadAttempts = 8

let lastAudioDownloadStartedAt = 0

const userAgent = 'PasiMandarim/0.2 (+https://github.com/ferreis/learning_Mandarin)'
const commonsApi = 'https://commons.wikimedia.org/w/api.php'
const yojikBase = 'https://fsi-languages.yojik.eu/audiocollections'

const speakers = [
  {
    id: 'wei-gao',
    matcher: /Wei Gao/i,
    name: 'Wei Gao',
    origin: 'Pequim, China',
    credits: 'Wei Gao e Vion Nicolas',
    defaultLicense: {
      name: 'CC BY 2.0 FR',
      url: 'https://creativecommons.org/licenses/by/2.0/fr/',
    },
  },
  {
    id: 'yue-tan',
    matcher: /Yue Tan|\(c\) 2009 Yue Tan/i,
    name: 'Yue Tan',
    origin: 'Liaoning, China',
    credits: 'Yue Tan',
    defaultLicense: {
      name: 'CC BY-SA 3.0 US',
      url: 'https://creativecommons.org/licenses/by-sa/3.0/us/',
    },
  },
]

// A coleção maior é processada primeiro para maximizar a chance de os dois lados
// de um contraste usarem a mesma falante.
const archiveCollections = [
  {
    id: 'cmn-caen-tan',
    archiveUrl: `${yojikBase}/archives/cmn-caen-tan_flac.tar.xz`,
    sourcePage: `${yojikBase}/detailled/cmn-caen-tan/readme.txt`,
    source: 'University of Caen / Shtooka Project (Yojik mirror)',
    speaker: speakers[1],
  },
  {
    id: 'cmn-balm-hsk1',
    archiveUrl: `${yojikBase}/archives/cmn-balm-hsk1_flac.tar.xz`,
    sourcePage: `${yojikBase}/detailled/cmn-balm-hsk1/readme.txt`,
    source: 'Shtooka Project (Yojik mirror)',
    speaker: speakers[0],
  },
]

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

const toneCharacterMap = new Map()
for (const [plain, marks] of Object.entries(toneMarks)) {
  marks.forEach((marked, index) => toneCharacterMap.set(marked, { plain, tone: index + 1 }))
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

function numericPinyin(base, tone) {
  return `${base.replaceAll('ü', 'v')}${tone}`.toLowerCase()
}

function normalizeArchivePronunciation(value) {
  let raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('u:', 'v')
    .replaceAll('ü', 'v')
    .replace(/[’']/g, '')
    .replace(/\s+/g, '')

  if (!raw) return null

  const numericMatches = raw.match(/[1-5]/g) ?? []
  if (numericMatches.length === 1 && /[1-5]$/.test(raw)) {
    return raw.replace(/[^a-zv1-5]/g, '')
  }
  if (numericMatches.length > 0) return null

  let detectedTone = 5
  let markedVowels = 0
  let plain = ''

  for (const character of raw) {
    const marked = toneCharacterMap.get(character)
    if (marked) {
      markedVowels += 1
      detectedTone = marked.tone
      plain += marked.plain === 'ü' ? 'v' : marked.plain
    } else if (/[a-zv]/.test(character)) {
      plain += character
    } else {
      return null
    }
  }

  if (markedVowels > 1 || !plain) return null
  return `${plain}${detectedTone}`
}

function stripHtml(value) {
  const rawText = Array.isArray(value)
    ? value.map((entry) => stripHtml(entry)).join(' ')
    : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : ''

  return rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function metadataText(metadata) {
  return Object.values(metadata ?? {})
    .map((entry) => stripHtml(entry?.value ?? ''))
    .join(' ')
}

function extractHanzi(metadata) {
  const description = stripHtml(metadata?.ImageDescription?.value ?? '')
  return description.match(/[\p{Script=Han}]+/u)?.[0]
}

function resolveSpeaker(metadata) {
  const text = metadataText(metadata)
  if (!/Shtooka/i.test(text)) return null
  return speakers.find((speaker) => speaker.matcher.test(text)) ?? null
}

function resolveLicense(metadata, speaker) {
  const text = metadataText(metadata)
  if (!/Creative Commons|CC BY/i.test(text)) return null

  return {
    name: stripHtml(metadata?.LicenseShortName?.value ?? metadata?.UsageTerms?.value ?? speaker.defaultLicense.name),
    url: stripHtml(metadata?.LicenseUrl?.value ?? speaker.defaultLicense.url),
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
  if (!response.ok) throw new Error(`HTTP ${response.status} ao consultar ${url}`)
  return response.json()
}

async function queryTitles(titles) {
  const result = new Map()

  for (let offset = 0; offset < titles.length; offset += 40) {
    const batch = titles.slice(offset, offset + 40)
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      titles: batch.join('|'),
      maxlag: '5',
    })

    const payload = await fetchJson(`${commonsApi}?${params}`)
    for (const page of payload?.query?.pages ?? []) result.set(page.title, page)
  }

  return result
}

function buildCombos(matrix) {
  const combos = []
  for (const initial of matrix.initials) {
    for (const final of initial.finals) {
      for (const tone of [1, 2, 3, 4, 5]) {
        const base = buildPinyinBase(initial.value, final)
        combos.push({
          key: `${initial.value}|${final}|${tone}`,
          initial: initial.value,
          final,
          tone,
          base,
          numeric: numericPinyin(base, tone),
          pinyin: applyToneMark(base, tone),
        })
      }
    }
  }
  return combos
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function retryDelayMilliseconds(response, attempt) {
  const retryAfterSeconds = Number(response.headers.get('retry-after'))
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000
  }

  return Math.min(2_000 * 2 ** attempt, 60_000)
}

async function downloadWithRetry(url, destination, { throttle = false } = {}) {
  for (let attempt = 0; attempt < maximumDownloadAttempts; attempt += 1) {
    if (throttle) {
      const earliestNextDownloadAt = lastAudioDownloadStartedAt + audioDownloadIntervalMilliseconds
      const remainingDelay = earliestNextDownloadAt - Date.now()
      if (remainingDelay > 0) await wait(remainingDelay)
      lastAudioDownloadStartedAt = Date.now()
    }

    const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
    if (response.ok && response.body) {
      await mkdir(path.dirname(destination), { recursive: true })
      await pipeline(Readable.fromWeb(response.body), createWriteStream(destination))
      return
    }

    const temporary = response.status === 429 || response.status >= 500
    if (!temporary || attempt === maximumDownloadAttempts - 1) {
      throw new Error(`HTTP ${response.status} ao baixar ${url}`)
    }

    const delay = retryDelayMilliseconds(response, attempt)
    console.warn(`HTTP ${response.status}; tentando novamente em ${Math.ceil(delay / 1000)}s.`)
    await wait(delay)
  }
}

async function findFileRecursive(directory, targetName) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isFile() && entry.name === targetName) return fullPath
    if (entry.isDirectory()) {
      const found = await findFileRecursive(fullPath, targetName)
      if (found) return found
    }
  }
  return null
}

function parseSwacIndex(text) {
  const entries = []
  let current = null

  for (const rawLine of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith(';')) continue

    const section = line.match(/^\[(.+)]$/)
    if (section) {
      if (current) entries.push(current)
      current = { file: section[1] }
      continue
    }

    if (!current) continue
    const separator = line.indexOf('=')
    if (separator < 0) continue
    current[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }

  if (current) entries.push(current)
  return entries
}

async function prepareArchive(collection) {
  const archivePath = path.join(cacheRoot, `${collection.id}.tar.xz`)
  const extractedPath = path.join(cacheRoot, collection.id)

  if (force || !(await exists(archivePath))) {
    console.log(`Baixando pacote completo ${collection.id}...`)
    await downloadWithRetry(collection.archiveUrl, archivePath)
  }

  if (force) await rm(extractedPath, { recursive: true, force: true })
  if (!(await exists(extractedPath))) {
    console.log(`Extraindo ${collection.id}...`)
    await mkdir(extractedPath, { recursive: true })
    try {
      await execFileAsync('tar', ['-xJf', archivePath, '-C', extractedPath])
    } catch (error) {
      throw new Error(`Falha ao extrair ${collection.id}. É necessário ter 'tar' com suporte a xz instalado. ${error.message}`)
    }
  }

  return extractedPath
}

async function discoverArchiveSamples(combos) {
  const comboByNumeric = new Map(combos.map((combo) => [combo.numeric, combo]))
  const samplesByKey = new Map()

  for (const collection of archiveCollections) {
    try {
      const extractedPath = await prepareArchive(collection)
      const indexPath = await findFileRecursive(extractedPath, 'index.tags.txt')
      if (!indexPath) throw new Error('index.tags.txt não encontrado no pacote')

      const indexDirectory = path.dirname(indexPath)
      const entries = parseSwacIndex(await readFile(indexPath, 'utf8'))
      let accepted = 0

      for (const entry of entries) {
        const normalized = normalizeArchivePronunciation(entry.SWAC_PRON_PHON)
        const combo = normalized ? comboByNumeric.get(normalized) : null
        if (!combo || samplesByKey.has(combo.key)) continue

        const sourceAudioPath = path.resolve(indexDirectory, entry.file)
        if (!(await exists(sourceAudioPath))) continue

        const fileName = `${combo.base.replaceAll('ü', 'v')}${combo.tone}.flac`
        const destinationDirectory = path.join(audioRoot, collection.speaker.id)
        const destinationPath = path.join(destinationDirectory, fileName)
        await mkdir(destinationDirectory, { recursive: true })
        if (force || !(await exists(destinationPath))) await copyFile(sourceAudioPath, destinationPath)

        samplesByKey.set(combo.key, {
          key: combo.key,
          pinyin: combo.pinyin,
          ...(entry.SWAC_TEXT ? { hanzi: entry.SWAC_TEXT } : {}),
          initial: combo.initial,
          final: combo.final,
          tone: combo.tone,
          audioUrl: `/audio/shtooka/${collection.speaker.id}/${fileName}`,
          originalAudioUrl: collection.archiveUrl,
          sourcePage: collection.sourcePage,
          speakerId: collection.speaker.id,
          speaker: collection.speaker.name,
          speakerOrigin: collection.speaker.origin,
          source: collection.source,
          credits: collection.speaker.credits,
          license: collection.speaker.defaultLicense,
          localFile: true,
          verifiedHuman: true,
        })
        accepted += 1
      }

      console.log(`${collection.id}: ${accepted} sílabas isoladas aproveitadas do pacote completo.`)
    } catch (error) {
      console.warn(`Não foi possível usar o pacote ${collection.id}: ${error.message}`)
    }
  }

  return samplesByKey
}

async function discoverCommonsRecordings(combos, alreadyResolved) {
  const resolved = new Map()
  const patterns = [
    (pinyin) => `File:Zh-${pinyin}.ogg`,
    (pinyin) => `File:Zh-${pinyin}.oga`,
    (pinyin) => `File:Cmn-${pinyin}.ogg`,
    (pinyin) => `File:Cmn-${pinyin}.oga`,
  ]

  for (const pattern of patterns) {
    const unresolved = combos.filter(
      (combo) => !alreadyResolved.has(combo.key) && !resolved.has(combo.key),
    )
    if (!unresolved.length) break

    const titleToCombo = new Map(unresolved.map((combo) => [pattern(combo.pinyin), combo]))
    const pages = await queryTitles([...titleToCombo.keys()])

    for (const [title, combo] of titleToCombo) {
      const page = pages.get(title)
      if (!page || page.missing || !page.imageinfo?.[0]) continue

      const imageInfo = page.imageinfo[0]
      const metadata = imageInfo.extmetadata ?? {}
      const speaker = resolveSpeaker(metadata)
      if (!speaker) continue

      const license = resolveLicense(metadata, speaker)
      if (!license) continue

      resolved.set(combo.key, { combo, page, imageInfo, metadata, speaker, license })
    }
  }

  return [...resolved.values()]
}

async function downloadCommonsRecording(recording) {
  const { combo, page, imageInfo, metadata, speaker, license } = recording
  const extension = path.extname(new URL(imageInfo.url).pathname) || '.ogg'
  const fileName = `${combo.base.replaceAll('ü', 'v')}${combo.tone}${extension}`
  const speakerDirectory = path.join(audioRoot, speaker.id)
  const filePath = path.join(speakerDirectory, fileName)

  await mkdir(speakerDirectory, { recursive: true })
  if (force || !(await exists(filePath))) {
    await downloadWithRetry(imageInfo.url, filePath, { throttle: true })
  }

  return {
    key: combo.key,
    pinyin: combo.pinyin,
    ...(extractHanzi(metadata) ? { hanzi: extractHanzi(metadata) } : {}),
    initial: combo.initial,
    final: combo.final,
    tone: combo.tone,
    audioUrl: `/audio/shtooka/${speaker.id}/${fileName}`,
    originalAudioUrl: imageInfo.url,
    sourcePage: `https://commons.wikimedia.org/wiki/${encodeURI(page.title.replaceAll(' ', '_'))}`,
    speakerId: speaker.id,
    speaker: speaker.name,
    speakerOrigin: speaker.origin,
    source: 'Shtooka Project / Wikimedia Commons',
    credits: speaker.credits,
    license,
    localFile: true,
    verifiedHuman: true,
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const output = new Array(items.length)
  let cursor = 0

  async function run() {
    while (cursor < items.length) {
      const current = cursor
      cursor += 1
      output[current] = await worker(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
  return output
}

async function main() {
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'))
  const combos = buildCombos(matrix)
  await mkdir(audioRoot, { recursive: true })
  await mkdir(cacheRoot, { recursive: true })

  console.log(`Analisando ${combos.length} combinações da matriz de Pinyin...`)
  const samplesByKey = await discoverArchiveSamples(combos)

  console.log(`Pacotes completos cobriram ${samplesByKey.size} combinações. Consultando o Commons apenas para lacunas...`)
  const commonsRecordings = await discoverCommonsRecordings(combos, samplesByKey)
  const commonsSamples = await mapWithConcurrency(
    commonsRecordings,
    audioDownloadConcurrency,
    downloadCommonsRecording,
  )

  for (const sample of commonsSamples) {
    if (!samplesByKey.has(sample.key)) samplesByKey.set(sample.key, sample)
  }

  const samples = [...samplesByKey.values()].sort((a, b) => a.key.localeCompare(b.key))
  const missing = combos.length - samples.length
  const coverage = ((samples.length / combos.length) * 100).toFixed(1)

  const generatedSource = `import type { HumanAudioSample } from '../types/audio'\n\nexport const generatedAudioSamples: HumanAudioSample[] = ${JSON.stringify(samples, null, 2)}\n`
  await writeFile(generatedCatalogPath, generatedSource)
  await writeFile(publicCatalogPath, `${JSON.stringify(samples, null, 2)}\n`)

  const bySpeaker = Object.groupBy(samples, (sample) => sample.speaker)
  for (const [speaker, entries] of Object.entries(bySpeaker)) {
    console.log(`${speaker}: ${entries?.length ?? 0} arquivos`)
  }

  console.log(`Cobertura: ${samples.length}/${combos.length} (${coverage}%).`)
  console.log(`${missing} combinações da matriz continuam sem gravação isolada.`)
  console.log('Observação: nem toda combinação teórica de sílaba + tom corresponde a uma palavra real do mandarim.')
  console.log(`Catálogo gravado em ${path.relative(root, generatedCatalogPath)}.`)
  console.log(`Áudios gravados em ${path.relative(root, audioRoot)}/.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
