import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'public', 'audio', 'tatoeba')
const CATALOG_PATH = path.join(ROOT, 'src', 'data', 'generatedSentenceCatalog.ts')
const TARGET_SENTENCES = 30
const MAX_AUDIO_BYTES = 5 * 1024 * 1024
const MAX_EXPORT_BYTES = 25 * 1024 * 1024
const MAX_DECOMPRESSED_BYTES = 128 * 1024 * 1024
const FETCH_ATTEMPTS = 3
const FETCH_TIMEOUT_MS = 60_000
const DOWNLOAD_CONCURRENCY = 4
const EXPORT_HOST = 'downloads.tatoeba.org'
const ALLOWED_AUDIO_HOSTS = new Set(['tatoeba.org', 'www.tatoeba.org', 'audio.tatoeba.org'])

const EXPORT_URLS = {
  cmnSentences: 'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2',
  cmnSentencesCc0: 'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences_CC0.tsv.bz2',
  cmnAudio: 'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences_with_audio.tsv.bz2',
  cmnTranscriptions: 'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_transcriptions.tsv.bz2',
  cmnPortugueseLinks: 'https://downloads.tatoeba.org/exports/per_language/cmn/cmn-por_links.tsv.bz2',
  portugueseSentences: 'https://downloads.tatoeba.org/exports/per_language/por/por_sentences.tsv.bz2',
}

const VALID_FINALS = new Set([
  'a','o','e','ai','ei','ao','ou','an','en','ang','eng','er','i','ia','iao','ie','iu','ian','in','iang','ing','iong',
  'u','ua','uo','uai','ui','uan','un','uang','ueng','ong','ü','üe','üan','ün',
])
const INITIALS = ['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s']
const ZERO_INITIAL_MAP = [
  ['yong','iong'],['ying','ing'],['yang','iang'],['yuan','üan'],['yue','üe'],['you','iu'],['yao','iao'],['yan','ian'],['yin','in'],['yun','ün'],['ye','ie'],['yi','i'],['yu','ü'],['ya','ia'],
  ['weng','ueng'],['wang','uang'],['wen','un'],['wei','ui'],['wai','uai'],['wan','uan'],['wu','u'],['wo','uo'],['wa','ua'],
]

const TONE_VOWELS = {
  a: ['a','ā','á','ǎ','à'], e: ['e','ē','é','ě','è'], i: ['i','ī','í','ǐ','ì'],
  o: ['o','ō','ó','ǒ','ò'], u: ['u','ū','ú','ǔ','ù'], ü: ['ü','ǖ','ǘ','ǚ','ǜ'],
}

function reusableLicense(license = '') {
  const normalized = String(license).trim().toUpperCase()
  return normalized.startsWith('CC0') || normalized.startsWith('CC ')
}

function normalizeNumberedSyllable(value) {
  return value.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü')
}

function splitPinyin(baseInput) {
  const base = normalizeNumberedSyllable(baseInput)
  for (const [spelling, final] of ZERO_INITIAL_MAP) {
    if (base === spelling) return { initial: '', final }
  }
  for (const initial of INITIALS) {
    if (!base.startsWith(initial)) continue
    let final = base.slice(initial.length)
    if (['j','q','x'].includes(initial) && final.startsWith('u')) final = `ü${final.slice(1)}`
    if (VALID_FINALS.has(final)) return { initial, final }
  }
  if (VALID_FINALS.has(base)) return { initial: '', final: base }
  return null
}

function toneMarked(baseInput, tone) {
  const base = normalizeNumberedSyllable(baseInput)
  if (tone === 5) return base
  let index = base.indexOf('a')
  if (index < 0) index = base.indexOf('e')
  if (index < 0 && base.includes('ou')) index = base.indexOf('o')
  if (index < 0) {
    for (let i = base.length - 1; i >= 0; i -= 1) {
      if ('aeiouü'.includes(base[i])) { index = i; break }
    }
  }
  if (index < 0) return base
  const vowel = base[index]
  const marked = TONE_VOWELS[vowel]?.[tone] ?? vowel
  return `${base.slice(0, index)}${marked}${base.slice(index + 1)}`
}

function parsePinyinText(text = '') {
  const matches = String(text).match(/[A-Za-zÜüVv:]+[1-5]/g) ?? []
  return matches.map((token) => {
    const tone = Number(token.at(-1))
    const base = normalizeNumberedSyllable(token.slice(0, -1))
    const split = splitPinyin(base)
    if (!split || tone < 1 || tone > 5) return null
    return { base, tone, marked: toneMarked(base, tone), ...split }
  }).filter(Boolean)
}

function chineseCharacters(text) {
  return [...text].filter((char) => /\p{Script=Han}/u.test(char))
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function fetchWithRetry(url, options = {}, label = 'Recurso remoto') {
  let lastError = null

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const retryableStatus = response.status === 429 || response.status >= 500
      if (response.ok || !retryableStatus) return response
      await response.body?.cancel()
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < FETCH_ATTEMPTS) await wait(attempt * 1_500)
  }

  const reason = lastError instanceof Error ? lastError.message : 'erro de rede desconhecido'
  throw new Error(`${label}: falha após ${FETCH_ATTEMPTS} tentativas (${reason}).`)
}

async function downloadExport(url, label) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.hostname !== EXPORT_HOST) {
    throw new Error(`${label}: origem de export não permitida.`)
  }

  const response = await fetchWithRetry(url, {
    redirect: 'error',
    headers: { Accept: 'application/octet-stream', 'User-Agent': 'learning-mandarin-static-sync/2.0' },
  }, label)
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`)

  const declaredSize = Number(response.headers.get('content-length') ?? 0)
  if (declaredSize > MAX_EXPORT_BYTES) throw new Error(`${label}: arquivo remoto excede o limite permitido.`)

  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > MAX_EXPORT_BYTES) {
    throw new Error(`${label}: tamanho inválido (${buffer.length}).`)
  }
  return buffer
}

function decompressBzip2(buffer, label) {
  const result = spawnSync('bzip2', ['-dc'], {
    input: buffer,
    encoding: 'utf8',
    maxBuffer: MAX_DECOMPRESSED_BYTES,
  })
  if (result.error?.code === 'ENOENT') {
    throw new Error(`${label}: o comando bzip2 não está instalado.`)
  }
  if (result.error) throw new Error(`${label}: falha ao descompactar (${result.error.message}).`)
  if (result.status !== 0) throw new Error(`${label}: bzip2 terminou com código ${result.status}.`)
  return result.stdout
}

async function loadExport(url, label) {
  return decompressBzip2(await downloadExport(url, label), label)
}

function rows(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => line.split('\t'))
}

function parseSentenceMap(text, wantedIds = null) {
  const result = new Map()
  for (const columns of rows(text)) {
    const id = Number(columns[0])
    if (!Number.isSafeInteger(id) || (wantedIds && !wantedIds.has(id))) continue
    const sentence = columns.slice(2).join('\t').trim()
    if (sentence) result.set(id, sentence)
  }
  return result
}

function parseCc0Ids(text) {
  const ids = new Set()
  for (const columns of rows(text)) {
    const id = Number(columns[0])
    if (Number.isSafeInteger(id)) ids.add(id)
  }
  return ids
}

function parseAudioMap(text) {
  const result = new Map()
  for (const columns of rows(text)) {
    const sentenceId = Number(columns[0])
    const audioId = Number(columns[1])
    const author = String(columns[2] ?? '').trim()
    const license = String(columns[3] ?? '').trim()
    const attributionUrl = String(columns.slice(4).join('\t') ?? '').trim()
    if (!Number.isSafeInteger(sentenceId) || !Number.isSafeInteger(audioId) || !author || !reusableLicense(license)) continue
    if (!result.has(sentenceId)) result.set(sentenceId, { id: audioId, author, license, attributionUrl })
  }
  return result
}

function parseTranscriptionMap(text) {
  const result = new Map()
  for (const columns of rows(text)) {
    const sentenceId = Number(columns[0])
    const lang = String(columns[1] ?? '').trim()
    const script = String(columns[2] ?? '').trim()
    const transcription = String(columns.slice(4).join('\t') ?? '').trim()
    if (!Number.isSafeInteger(sentenceId) || lang !== 'cmn' || !/[1-5]/.test(transcription)) continue
    const score = /Latn|Pinyin/i.test(script) ? 2 : 1
    const previous = result.get(sentenceId)
    if (!previous || score > previous.score) result.set(sentenceId, { text: transcription, score })
  }
  return new Map([...result].map(([id, value]) => [id, value.text]))
}

function parsePortugueseLinks(text) {
  const result = new Map()
  const wantedPortugueseIds = new Set()
  for (const columns of rows(text)) {
    const mandarinId = Number(columns[0])
    const portugueseId = Number(columns[1])
    if (!Number.isSafeInteger(mandarinId) || !Number.isSafeInteger(portugueseId)) continue
    if (!result.has(mandarinId)) result.set(mandarinId, portugueseId)
    wantedPortugueseIds.add(portugueseId)
  }
  return { links: result, wantedPortugueseIds }
}

async function collectSentences() {
  const [cmnText, cc0Text, audioText, transcriptionText, linksText] = await Promise.all([
    loadExport(EXPORT_URLS.cmnSentences, 'Frases em mandarim'),
    loadExport(EXPORT_URLS.cmnSentencesCc0, 'Licenças CC0 em mandarim'),
    loadExport(EXPORT_URLS.cmnAudio, 'Metadados de áudio em mandarim'),
    loadExport(EXPORT_URLS.cmnTranscriptions, 'Transcrições em Pinyin'),
    loadExport(EXPORT_URLS.cmnPortugueseLinks, 'Links mandarim-português'),
  ])

  const audioBySentence = parseAudioMap(audioText)
  const transcriptionBySentence = parseTranscriptionMap(transcriptionText)
  const cc0Ids = parseCc0Ids(cc0Text)
  const { links, wantedPortugueseIds } = parsePortugueseLinks(linksText)
  const portugueseText = await loadExport(EXPORT_URLS.portugueseSentences, 'Frases em português')
  const portugueseById = parseSentenceMap(portugueseText, wantedPortugueseIds)

  const candidates = []
  const rejected = { fetched: 0, translation: 0, transcription: 0, length: 0, final: 0, audio: 0 }

  for (const columns of rows(cmnText)) {
    const sentenceId = Number(columns[0])
    if (!Number.isSafeInteger(sentenceId)) continue
    const text = columns.slice(2).join('\t').trim()
    if (!text) continue
    rejected.fetched += 1

    const audio = audioBySentence.get(sentenceId)
    if (!audio) { rejected.audio += 1; continue }

    const portugueseId = links.get(sentenceId)
    const translationPt = portugueseId ? portugueseById.get(portugueseId) ?? '' : ''
    if (!translationPt) { rejected.translation += 1; continue }

    const transcription = transcriptionBySentence.get(sentenceId) ?? ''
    const parsed = parsePinyinText(transcription)
    if (!parsed.length) { rejected.transcription += 1; continue }

    const hanzi = chineseCharacters(text)
    if (parsed.length < 3 || parsed.length > 8 || parsed.length !== hanzi.length) { rejected.length += 1; continue }

    const syllables = parsed.map((item, index) => ({
      hanzi: hanzi[index],
      pinyin: item.marked,
      numbered: `${item.base}${item.tone}`,
      initial: item.initial,
      final: item.final,
      tone: item.tone,
    }))
    if (syllables.some((item) => !VALID_FINALS.has(item.final))) { rejected.final += 1; continue }

    candidates.push({
      id: sentenceId,
      text,
      translationPt,
      pinyin: syllables.map((item) => item.pinyin).join(' '),
      syllables,
      audio: {
        id: audio.id,
        path: `/audio/tatoeba/${audio.id}.mp3`,
        author: audio.author,
        license: audio.license,
        attributionUrl: audio.attributionUrl || `https://tatoeba.org/users/profile/${encodeURIComponent(audio.author)}`,
      },
      sourceUrl: `https://tatoeba.org/pt-br/sentences/show/${sentenceId}`,
      textLicense: cc0Ids.has(sentenceId) ? 'CC0 1.0' : 'CC BY 2.0 FR',
    })
  }

  candidates.sort((left, right) => left.syllables.length - right.syllables.length || left.id - right.id)
  const accepted = candidates.slice(0, TARGET_SENTENCES)
  console.log(`Triagem dos exports Tatoeba: ${JSON.stringify(rejected)}; elegíveis=${candidates.length}; selecionadas=${accepted.length}.`)
  return accepted
}

async function downloadAudio(item) {
  const destination = path.join(OUTPUT_DIR, `${item.audio.id}.mp3`)
  if (existsSync(destination)) return

  const url = `https://tatoeba.org/audio/download/${item.audio.id}`
  const response = await fetchWithRetry(url, {
    redirect: 'follow',
    credentials: 'omit',
    headers: { 'User-Agent': 'learning-mandarin-static-sync/2.0' },
  }, `Áudio ${item.audio.id}`)
  if (!response.ok) throw new Error(`Áudio ${item.audio.id}: HTTP ${response.status}`)

  const finalUrl = new URL(response.url)
  if (finalUrl.protocol !== 'https:' || !ALLOWED_AUDIO_HOSTS.has(finalUrl.hostname)) {
    throw new Error(`Áudio ${item.audio.id}: redirecionamento não permitido para ${finalUrl.hostname}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('audio/') && !contentType.includes('octet-stream')) {
    throw new Error(`Áudio ${item.audio.id}: tipo inesperado ${contentType}`)
  }
  const declaredSize = Number(response.headers.get('content-length') ?? 0)
  if (declaredSize > MAX_AUDIO_BYTES) throw new Error(`Áudio ${item.audio.id}: arquivo excede o limite permitido.`)

  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) throw new Error(`Áudio ${item.audio.id}: tamanho inválido (${buffer.length}).`)
  await writeFile(destination, buffer, { mode: 0o644 })
}

async function downloadAudios(items) {
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      await downloadAudio(item)
    }
  }
  const workers = Math.min(DOWNLOAD_CONCURRENCY, items.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))
}

function catalogSource(items) {
  return `// Arquivo gerado por scripts/sync-sentence-audio.mjs a partir dos exports semanais do Tatoeba. Não edite manualmente.\n\nexport type SentenceSyllable = {\n  hanzi: string\n  pinyin: string\n  numbered: string\n  initial: string\n  final: string\n  tone: number\n}\n\nexport type SentencePracticeItem = {\n  id: number\n  text: string\n  translationPt: string\n  pinyin: string\n  syllables: SentenceSyllable[]\n  audio: { id: number; path: string; author: string; license: string; attributionUrl: string }\n  sourceUrl: string\n  textLicense: string\n}\n\nexport const sentencePracticeCatalog: SentencePracticeItem[] = ${JSON.stringify(items, null, 2)}\n`
}

await mkdir(OUTPUT_DIR, { recursive: true })
const items = await collectSentences()
if (items.length < 10) throw new Error(`Catálogo de frases insuficiente: apenas ${items.length} frases elegíveis encontradas.`)
await downloadAudios(items)
await writeFile(CATALOG_PATH, catalogSource(items), 'utf8')
console.log(`Frases humanas: ${items.length}. Sílabas: ${items.reduce((sum, item) => sum + item.syllables.length, 0)}.`)
console.log(`Falantes: ${new Set(items.map((item) => item.audio.author)).size}. Fonte: exports semanais do Tatoeba.`)
