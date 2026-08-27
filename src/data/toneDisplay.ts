import type { MandarinTone } from '../types/audio'

export type ToneDisplayInfo = {
  symbol: string
  label: string
  shortLabel: string
  explanation: string
}

export const toneDisplay: Record<MandarinTone, ToneDisplayInfo> = {
  1: {
    symbol: 'ˉ',
    label: '1º tom',
    shortLabel: '1º',
    explanation: 'alto e nivelado',
  },
  2: {
    symbol: 'ˊ',
    label: '2º tom',
    shortLabel: '2º',
    explanation: 'ascendente',
  },
  3: {
    symbol: 'ˇ',
    label: '3º tom',
    shortLabel: '3º',
    explanation: 'baixo, com queda e possível subida',
  },
  4: {
    symbol: 'ˋ',
    label: '4º tom',
    shortLabel: '4º',
    explanation: 'descendente e forte',
  },
  5: {
    symbol: '·',
    label: 'Tom neutro',
    shortLabel: 'Neutro',
    explanation: 'curto e sem contorno lexical fixo; depende do contexto',
  },
}

export const mandarinTones = [1, 2, 3, 4, 5] as const satisfies readonly MandarinTone[]

export function toneText(tone: MandarinTone): string {
  const info = toneDisplay[tone]
  return `${info.symbol} ${info.label}`
}
