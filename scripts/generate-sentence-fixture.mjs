import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const catalogPath = path.join(process.cwd(), 'src', 'data', 'generatedSentenceCatalog.ts')

const items = [
  {
    id: -1,
    text: '你好朋友',
    translationPt: 'Olá, amigo.',
    pinyin: 'nǐ hǎo péng you',
    syllables: [
      { hanzi: '你', pinyin: 'nǐ', numbered: 'ni3', initial: 'n', final: 'i', tone: 3 },
      { hanzi: '好', pinyin: 'hǎo', numbered: 'hao3', initial: 'h', final: 'ao', tone: 3 },
      { hanzi: '朋', pinyin: 'péng', numbered: 'peng2', initial: 'p', final: 'eng', tone: 2 },
      { hanzi: '友', pinyin: 'you', numbered: 'you5', initial: '', final: 'iu', tone: 5 },
    ],
    audio: { id: -1, path: '/audio/test/frase-1.mp3', author: 'Fixture de teste', license: 'CC0-1.0', attributionUrl: 'https://tatoeba.org/' },
    sourceUrl: 'https://tatoeba.org/',
    textLicense: 'CC0-1.0',
  },
  {
    id: -2,
    text: '我爱中文',
    translationPt: 'Eu amo chinês.',
    pinyin: 'wǒ ài zhōng wén',
    syllables: [
      { hanzi: '我', pinyin: 'wǒ', numbered: 'wo3', initial: '', final: 'uo', tone: 3 },
      { hanzi: '爱', pinyin: 'ài', numbered: 'ai4', initial: '', final: 'ai', tone: 4 },
      { hanzi: '中', pinyin: 'zhōng', numbered: 'zhong1', initial: 'zh', final: 'ong', tone: 1 },
      { hanzi: '文', pinyin: 'wén', numbered: 'wen2', initial: '', final: 'un', tone: 2 },
    ],
    audio: { id: -2, path: '/audio/test/frase-2.mp3', author: 'Fixture de teste', license: 'CC0-1.0', attributionUrl: 'https://tatoeba.org/' },
    sourceUrl: 'https://tatoeba.org/',
    textLicense: 'CC0-1.0',
  },
  {
    id: -3,
    text: '学习中文',
    translationPt: 'Estudar chinês.',
    pinyin: 'xué xí zhōng wén',
    syllables: [
      { hanzi: '学', pinyin: 'xué', numbered: 'xue2', initial: 'x', final: 'üe', tone: 2 },
      { hanzi: '习', pinyin: 'xí', numbered: 'xi2', initial: 'x', final: 'i', tone: 2 },
      { hanzi: '中', pinyin: 'zhōng', numbered: 'zhong1', initial: 'zh', final: 'ong', tone: 1 },
      { hanzi: '文', pinyin: 'wén', numbered: 'wen2', initial: '', final: 'un', tone: 2 },
    ],
    audio: { id: -3, path: '/audio/test/frase-3.mp3', author: 'Fixture de teste', license: 'CC0-1.0', attributionUrl: 'https://tatoeba.org/' },
    sourceUrl: 'https://tatoeba.org/',
    textLicense: 'CC0-1.0',
  },
  {
    id: -4,
    text: '他是老师',
    translationPt: 'Ele é professor.',
    pinyin: 'tā shì lǎo shī',
    syllables: [
      { hanzi: '他', pinyin: 'tā', numbered: 'ta1', initial: 't', final: 'a', tone: 1 },
      { hanzi: '是', pinyin: 'shì', numbered: 'shi4', initial: 'sh', final: 'i', tone: 4 },
      { hanzi: '老', pinyin: 'lǎo', numbered: 'lao3', initial: 'l', final: 'ao', tone: 3 },
      { hanzi: '师', pinyin: 'shī', numbered: 'shi1', initial: 'sh', final: 'i', tone: 1 },
    ],
    audio: { id: -4, path: '/audio/test/frase-4.mp3', author: 'Fixture de teste', license: 'CC0-1.0', attributionUrl: 'https://tatoeba.org/' },
    sourceUrl: 'https://tatoeba.org/',
    textLicense: 'CC0-1.0',
  },
]

const source = `// Catálogo determinístico usado somente em validação automatizada.\n// O deploy de produção substitui este conteúdo pelo catálogo humano do Tatoeba.\n\nexport type SentenceSyllable = {\n  hanzi: string\n  pinyin: string\n  numbered: string\n  initial: string\n  final: string\n  tone: number\n}\n\nexport type SentencePracticeItem = {\n  id: number\n  text: string\n  translationPt: string\n  pinyin: string\n  syllables: SentenceSyllable[]\n  audio: { id: number; path: string; author: string; license: string; attributionUrl: string }\n  sourceUrl: string\n  textLicense: string\n}\n\nexport const sentencePracticeCatalog: SentencePracticeItem[] = ${JSON.stringify(items, null, 2)}\n`

await writeFile(catalogPath, source, 'utf8')
console.log(`Fixture de frases gerada com ${items.length} registros para validação local/CI.`)
