import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'src', 'data', 'generatedAudioCatalog.ts')
const catalogPath = path.join(root, 'src', 'data', 'ttsAudioCatalog.ts')
const outputRoot = path.join(root, 'public', 'audio', 'tts')
const voices = ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'zh-CN-XiaoyiNeural']
const limitOption = process.argv.indexOf('--limit')
const limit = limitOption >= 0 ? Number(process.argv[limitOption + 1]) : Number.POSITIVE_INFINITY
const keysOption = process.argv.indexOf('--keys')
const requestedKeys = keysOption >= 0 ? new Set(process.argv[keysOption + 1]?.split(',').filter(Boolean)) : null
const catalogOnly = process.argv.includes('--catalog-only')
const concurrency = 4

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} terminou com código ${code}`)))
  })
}

function slug(value) {
  return value.replaceAll('ü', 'v').replace(/[^a-zA-Z0-9|]/g, '-').replaceAll('|', '_') || 'zero'
}

function parseSource(text) {
  const match = text.match(/generatedAudioSamples:\s*HumanAudioSample\[\]\s*=\s*(\[[\s\S]*\])\s*$/)
  if (!match) throw new Error('Não foi possível ler generatedAudioSamples.')
  const source = JSON.parse(match[1])
  const unique = new Map()
  for (const item of source) if (item.hanzi && !unique.has(item.key)) unique.set(item.key, item)
  return [...unique.values()]
}

function makeCatalog(samples) {
  const records = voices.flatMap((voice) => samples.map((sample) => ({
    key: sample.key, pinyin: sample.pinyin, hanzi: sample.hanzi, initial: sample.initial,
    final: sample.final, tone: sample.tone, audioUrl: `/audio/tts/${voice}/${slug(sample.key)}.mp3`,
    voice, provider: 'edge-tts', localFile: true, generatedTts: true,
  })))
  return `// Gerado por scripts/sync-tts-audio.mjs. Não edite manualmente.\nimport type { TtsAudioSample } from '../types/audio'\n\nexport const ttsAudioSamples = JSON.parse(String.raw\`${JSON.stringify(records)}\`) as TtsAudioSample[]\n`
}

const source = await readFile(sourcePath, 'utf8')
const samples = parseSource(source)
await writeFile(catalogPath, makeCatalog(samples))

if (catalogOnly) {
  console.log(`Catálogo TTS criado com ${samples.length} sílabas e ${voices.length} vozes.`)
  process.exit(0)
}

if (limitOption >= 0 && (!Number.isFinite(limit) || limit < 1)) throw new Error('Use --limit com um número positivo.')
const selected = (requestedKeys ? samples.filter((sample) => requestedKeys.has(sample.key)) : samples).slice(0, limit)
if (!selected.length) throw new Error('Nenhuma sílaba TTS corresponde aos filtros solicitados.')
const jobs = voices.flatMap((voice) => selected.map((sample) => ({ voice, sample })))
let nextJob = 0

async function worker() {
  while (nextJob < jobs.length) {
    const job = jobs[nextJob]
    nextJob += 1
    const destination = path.join(outputRoot, job.voice)
    const target = path.join(destination, `${slug(job.sample.key)}.mp3`)
    const temporary = `${target}.source.mp3`
    await mkdir(destination, { recursive: true })
    await run('edge-tts', ['--voice', job.voice, '--text', job.sample.hanzi, '--write-media', temporary])
    // Acrescenta 250 ms de silêncio, sem fade, para preservar o contorno tonal até o fim.
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', temporary, '-af', 'apad=pad_dur=0.25', '-c:a', 'libmp3lame', '-q:a', '3', target])
    await rm(temporary, { force: true })
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker))
/*
 * Four workers keep a full static catalog practical in CI while avoiding an
 * uncontrolled burst to the public speech service.
 */
console.log(`TTS gerado: ${selected.length} sílabas × ${voices.length} vozes, com 250 ms de silêncio final.`)
