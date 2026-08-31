import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'public', 'audio', 'tatoeba')
const CATALOG_PATH = path.join(ROOT, 'src', 'data', 'generatedSentenceCatalog.ts')
const TARGET_SENTENCES = 30
const MAX_PAGES = 8
const MAX_AUDIO_BYTES = 5 * 1024 * 1024
const FETCH_ATTEMPTS = 3
const FETCH_TIMEOUT_MS = 30_000
const ALLOWED_AUDIO_HOSTS = new Set(['api.tatoeba.org', 'tatoeba.org', 'www.tatoeba.org', 'audio.tatoeba.org'])
const VALID_FINALS = new Set([
  'a','o','e','ai','ei','ao','ou','an','en','ang','eng','er','i','ia','iao','ie','iu','ian','in','iang','ing','iong',
  'u','ua','uo','uai','ui','uan','un','uang','ueng','ong','ü','üe','üan','ün',
])
const INITIALS = ['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s']
const ZERO_INITIAL_MAP = [
  ['yong','iong'],['ying','ing'],['yang','iang'],['yuan','üan'],['yue','üe'],['you','iu'],['yao','iao'],['yan','ian'],['yin','in'],['yun','ün'],['ye','ie'],['yi','i'],['yu','ü'],['ya','ia'],
  ['weng','ueng'],['wang','uang'],['wen','un'],['wei','ui'],['wai','uai'],['wan','uan'],['wu','u'],['wo','uo'],['wa','ua'],
]

function audioLicense(audio) {
  return String(audio?.license ?? audio?.licence ?? '').trim()
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

const TONE_VOWELS = {
  a: ['a','ā','á','ǎ','à'], e: ['e','ē','é','ě','è'], i: ['i','ī','í','ǐ','ì'],
  o: ['o','ō','ó','ǒ','ò'], u: ['u','ū','ú','ǔ','ù'], ü: ['ü','ǖ','ǘ','ǚ','ǜ'],
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

function parsePinyin(transcriptions = []) {
  const candidate = transcriptions.find((item) => item?.type === 'transcription' && item?.script === 'Latn' && /[1-5]/.test(item.text ?? ''))
    ?? transcriptions.find((item) => /[1-5]/.test(item?.text ?? ''))
  if (!candidate) return []
  const matches = String(candidate.text).match(/[A-Za-zÜüVv:]+[1-5]/g) ?? []
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

function pickPortugueseTranslation(translations = []) {
  const matches = translations.filter((item) => item?.lang === 'por' && typeof item.text === 'string' && item.text.trim())
  return (matches.find((item) => item.is_direct) ?? matches[0])?.text?.trim() ?? ''
}

function pickAudio(audios = []) {
  return audios.find((audio) => audio?.id && reusableLicense(audioLicense(audio))) ?? null
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

    if (attempt < FETCH_ATTEMPTS) await wait(attempt * 1_000)
  }

  const reason = lastError instanceof Error ? lastError.message : 'erro de rede desconhecido'
  throw new Error(`${label}: falha após ${FETCH_ATTEMPTS} tentativas (${reason}).`)
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'learning-mandarin-static-sync/1.0' },
  }, 'Tatoeba API')
  if (!response.ok) throw new Error(`Tatoeba API ${response.status}: ${url}`)
  return response.json()
}

async function downloadAudio(audioId, destination) {
  if (existsSync(destination)) return
  const url = `https://api.tatoeba.org/v1/audios/${audioId}/file`
  const response = await fetchWithRetry(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'learning-mandarin-static-sync/1.0' },
  }, `Áudio ${audioId}`)
  if (!response.ok) throw new Error(`Áudio ${audioId}: HTTP ${response.status}`)
  const finalUrl = new URL(response.url)
  if (finalUrl.protocol !== 'https:' || !ALLOWED_AUDIO_HOSTS.has(finalUrl.hostname)) {
    throw new Error(`Áudio ${audioId}: redirecionamento não permitido para ${finalUrl.hostname}`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('audio/') && !contentType.includes('octet-stream')) {
    throw new Error(`Áudio ${audioId}: tipo inesperado ${contentType}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) throw new Error(`Áudio ${audioId}: tamanho inválido (${buffer.length})`)
  await writeFile(destination, buffer, { mode: 0o644 })
}

function makeSearchUrl(after = '') {
  const url = new URL('https://api.tatoeba.org/v1/sentences')
  url.searchParams.set('lang', 'cmn')
  url.searchParams.set('has_audio', 'yes')
  url.searchParams.set('is_unapproved', 'no')
  url.searchParams.set('is_orphan', 'no')
  url.searchParams.set('word_count', '3-10')
  url.searchParams.set('trans:lang', 'por')
  url.searchParams.set('showtrans:lang', 'por')
  url.searchParams.set('showtrans:is_unapproved', 'no')
  url.searchParams.set('include', 'audios,transcriptions')
  url.searchParams.set('sort', 'words')
  url.searchParams.set('limit', '100')
  if (after) url.searchParams.set('after', after)
  return url
}

function extractAfter(nextUrl) {
  if (!nextUrl) return ''
  try { return new URL(nextUrl).searchParams.get('after') ?? '' } catch { return '' }
}

async function collectSentences() {
  const accepted = []
  const seenSentenceIds = new Set()
  const rejected = { fetched: 0, translation: 0, transcription: 0, length: 0, final: 0, audio: 0 }
  let after = ''

  for (let page = 0; page < MAX_PAGES && accepted.length < TARGET_SENTENCES; page += 1) {
    const payload = await fetchJson(makeSearchUrl(after))

    for (const sentence of payload.data ?? []) {
      if (accepted.length >= TARGET_SENTENCES) break
      if (!sentence?.id || seenSentenceIds.has(sentence.id)) continue
      seenSentenceIds.add(sentence.id)
      rejected.fetched += 1

      const translationPt = pickPortugueseTranslation(sentence.translations)
      if (!translationPt) { rejected.translation += 1; continue }

      const parsed = parsePinyin(sentence.transcriptions)
      if (!parsed.length) { rejected.transcription += 1; continue }

      const hanzi = chineseCharacters(sentence.text ?? '')
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

      const audio = pickAudio(sentence.audios)
      if (!audio) { rejected.audio += 1; continue }
      const license = audioLicense(audio)

      accepted.push({
        id: sentence.id,
        text: sentence.text,
        translationPt,
        pinyin: syllables.map((item) => item.pinyin).join(' '),
        syllables,
        audio: {
          id: audio.id,
          path: `/audio/tatoeba/${audio.id}.mp3`,
          author: audio.author,
          license,
          attributionUrl: audio.attribution_url || audio.author_url || `https://tatoeba.org/users/profile/${encodeURIComponent(audio.author)}`,
        },
        sourceUrl: `https://tatoeba.org/pt-br/sentences/show/${sentence.id}`,
        textLicense: sentence.license,
      })
    }

    if (!payload.paging?.has_next) break
    after = extractAfter(payload.paging.next)
    if (!after) break
  }
  console.log(`Triagem Tatoeba: ${JSON.stringify(rejected)}; aceitas=${accepted.length}.`)
  return accepted
}

function catalogSource(items) {
  return `// Arquivo gerado por scripts/sync-sentence-audio.mjs. Não edite manualmente.\n\nexport type SentenceSyllable = {\n  hanzi: string\n  pinyin: string\n  numbered: string\n  initial: string\n  final: string\n  tone: number\n}\n\nexport type SentencePracticeItem = {\n  id: number\n  text: string\n  translationPt: string\n  pinyin: string\n  syllables: SentenceSyllable[]\n  audio: { id: number; path: string; author: string; license: string; attributionUrl: string }\n  sourceUrl: string\n  textLicense: string\n}\n\nexport const sentencePracticeCatalog: SentencePracticeItem[] = ${JSON.stringify(items, null, 2)}\n`
}

await mkdir(OUTPUT_DIR, { recursive: true })
const items = await collectSentences()
if (items.length < 10) throw new Error(`Catálogo de frases insuficiente: apenas ${items.length} frases elegíveis encontradas.`)

for (const item of items) {
  const destination = path.join(OUTPUT_DIR, `${item.audio.id}.mp3`)
  await downloadAudio(item.audio.id, destination)
}

await writeFile(CATALOG_PATH, catalogSource(items), 'utf8')
console.log(`Frases humanas: ${items.length}. Sílabas: ${items.reduce((sum, item) => sum + item.syllables.length, 0)}.`)
console.log(`Falantes: ${new Set(items.map((item) => item.audio.author)).size}. Fonte: Tatoeba.`)
