import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const matrixPath = path.join(root, 'data', 'pinyin-matrix.json')
const generatedCatalogPath = path.join(root, 'src', 'data', 'generatedAudioCatalog.ts')
const audioRoot = path.join(root, 'public', 'audio', 'shtooka')
const publicCatalogPath = path.join(audioRoot, 'catalog.json')
const force = process.argv.includes('--force')
const audioDownloadConcurrency = 1
const audioDownloadIntervalMilliseconds = 1_500
const maximumDownloadAttempts = 8

let lastAudioDownloadStartedAt = 0

const userAgent = 'LearningMandarin/0.1 (+https://github.com/ferreis/learning_Mandarin)'
const commonsApi = 'https://commons.wikimedia.org/w/api.php'

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
          pinyin: applyToneMark(base, tone),
        })
      }
    }
  }
  return combos
}

async function discoverRecordings(combos) {
  const resolved = new Map()
  const patterns = [
    (pinyin) => `File:Zh-${pinyin}.ogg`,
    (pinyin) => `File:Zh-${pinyin}.oga`,
    (pinyin) => `File:Cmn-${pinyin}.ogg`,
    (pinyin) => `File:Cmn-${pinyin}.oga`,
  ]

  for (const pattern of patterns) {
    const unresolved = combos.filter((combo) => !resolved.has(combo.key))
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

async function waitForAudioDownloadSlot() {
  const earliestNextDownloadAt = lastAudioDownloadStartedAt + audioDownloadIntervalMilliseconds
  const remainingDelay = earliestNextDownloadAt - Date.now()

  if (remainingDelay > 0) {
    await wait(remainingDelay)
  }

  lastAudioDownloadStartedAt = Date.now()
}

async function downloadAudio(url) {
  for (let attempt = 0; attempt < maximumDownloadAttempts; attempt += 1) {
    await waitForAudioDownloadSlot()
    const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
    if (response.ok) return response

    const isTemporaryFailure = response.status === 429 || response.status >= 500
    const hasMoreAttempts = attempt < maximumDownloadAttempts - 1
    if (!isTemporaryFailure || !hasMoreAttempts) {
      throw new Error(`HTTP ${response.status} ao baixar ${url}`)
    }

    const delay = retryDelayMilliseconds(response, attempt)
    console.warn(`HTTP ${response.status}; tentando novamente em ${Math.ceil(delay / 1000)}s.`)
    await wait(delay)
  }

  throw new Error(`Não foi possível baixar ${url}`)
}

async function downloadRecording(recording) {
  const { combo, page, imageInfo, metadata, speaker, license } = recording
  const extension = path.extname(new URL(imageInfo.url).pathname) || '.ogg'
  const fileName = `${combo.base.replaceAll('ü', 'v')}${combo.tone}${extension}`
  const speakerDirectory = path.join(audioRoot, speaker.id)
  const filePath = path.join(speakerDirectory, fileName)

  await mkdir(speakerDirectory, { recursive: true })

  if (force || !(await exists(filePath))) {
    const response = await downloadAudio(imageInfo.url)
    await writeFile(filePath, Buffer.from(await response.arrayBuffer()))
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

  console.log(`Consultando ${combos.length} combinações de sílaba/tom no Wikimedia Commons...`)
  const recordings = await discoverRecordings(combos)
  console.log(`${recordings.length} gravações Shtooka humanas verificáveis encontradas.`)

  await mkdir(audioRoot, { recursive: true })
  const samples = await mapWithConcurrency(recordings, audioDownloadConcurrency, downloadRecording)
  samples.sort((a, b) => a.key.localeCompare(b.key))

  const generatedSource = `import type { HumanAudioSample } from '../types/audio'\n\nexport const generatedAudioSamples: HumanAudioSample[] = ${JSON.stringify(samples, null, 2)}\n`
  await writeFile(generatedCatalogPath, generatedSource)
  await writeFile(publicCatalogPath, `${JSON.stringify(samples, null, 2)}\n`)

  const bySpeaker = Object.groupBy(samples, (sample) => sample.speaker)
  for (const [speaker, entries] of Object.entries(bySpeaker)) {
    console.log(`${speaker}: ${entries?.length ?? 0} arquivos`)
  }

  console.log(`Catálogo gravado em ${path.relative(root, generatedCatalogPath)}.`)
  console.log(`Áudios gravados em ${path.relative(root, audioRoot)}/.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
