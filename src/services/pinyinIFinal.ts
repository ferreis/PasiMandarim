export const iFinalModeOptions = [
  {
    value: 'both',
    label: 'Ambos os tipos',
    description: 'Inclui o i vocálico e o grupo especial escrito com i.',
  },
  {
    value: 'vocalic',
    label: 'i vocálico',
    description: 'Como em yi, bi, pi, mi, di, ti, ni, li, ji, qi e xi.',
  },
  {
    value: 'special',
    label: 'i especial',
    description: 'Como em zi, ci, si, zhi, chi, shi e ri.',
  },
] as const

export type IFinalMode = typeof iFinalModeOptions[number]['value']
export type IFinalKind = Exclude<IFinalMode, 'both'>

const specialIFinalInitials = new Set(['z', 'c', 's', 'zh', 'ch', 'sh', 'r'])

export function getIFinalKind(initial: string, final = 'i'): IFinalKind | null {
  if (final !== 'i') return null
  return specialIFinalInitials.has(initial) ? 'special' : 'vocalic'
}

export function matchesIFinalMode(
  initialA: string,
  initialB: string,
  final: string,
  mode: IFinalMode,
): boolean {
  if (final !== 'i' || mode === 'both') return true
  return getIFinalKind(initialA, final) === mode && getIFinalKind(initialB, final) === mode
}

export function describeIFinalKind(kind: IFinalKind | null): string {
  return kind === 'special' ? 'i especial' : 'i vocálico'
}
