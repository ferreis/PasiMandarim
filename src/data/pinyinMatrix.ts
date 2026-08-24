import matrixData from '../../data/pinyin-matrix.json'

export type PinyinInitialOption = {
  value: string
  label: string
  finals: string[]
}

export const pinyinInitials = matrixData.initials as PinyinInitialOption[]

const finalsByInitial = new Map(
  pinyinInitials.map((initial) => [initial.value, initial.finals] as const),
)

export function getFinalsForInitial(initial: string): string[] {
  return finalsByInitial.get(initial) ?? []
}

export function getCommonFinals(initialA: string, initialB: string): string[] {
  const right = new Set(getFinalsForInitial(initialB))
  return getFinalsForInitial(initialA).filter((final) => right.has(final))
}

export function isValidPinyinCombination(initial: string, final: string): boolean {
  return getFinalsForInitial(initial).includes(final)
}
