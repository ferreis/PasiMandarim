import type { MandarinTone } from '../types/audio'

const zeroInitialSpellings: Record<string, string> = {
  i: 'yi', ia: 'ya', iao: 'yao', ie: 'ye', iu: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei', uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng',
  ü: 'yu', üe: 'yue', üan: 'yuan', ün: 'yun',
}

const toneMarks: Record<string, [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

export function buildPinyinBase(initial: string, final: string): string {
  if (!initial) {
    return zeroInitialSpellings[final] ?? final
  }

  if (['j', 'q', 'x'].includes(initial) && final.startsWith('ü')) {
    return `${initial}${final.replace('ü', 'u')}`
  }

  return `${initial}${final}`
}

export function applyToneMark(base: string, tone: MandarinTone): string {
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

  const vowel = base[index]
  const marked = toneMarks[vowel]?.[tone - 1]
  if (!marked) return base

  return `${base.slice(0, index)}${marked}${base.slice(index + 1)}`
}

export function buildToneMarkedPinyin(initial: string, final: string, tone: MandarinTone): string {
  return applyToneMark(buildPinyinBase(initial, final), tone)
}

export function buildToneNumberKey(initial: string, final: string, tone: MandarinTone): string {
  return `${buildPinyinBase(initial, final).replaceAll('ü', 'v')}${tone}`
}
