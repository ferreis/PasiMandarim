import type { MandarinTone, PlayableAudioSample } from '../types/audio'
import type { ComparisonSide } from './comparisonAudioFeedback'

export type ComparisonCandidate = {
  final: string
  tone: MandarinTone
  sampleA: PlayableAudioSample
  sampleB: PlayableAudioSample
  sameSpeaker: boolean
}

export type ComparisonQuestion = ComparisonCandidate & {
  targetSide: ComparisonSide
  answerOrder: ComparisonSide[]
}

type Random = () => number

function secureRandom(): number {
  const value = new Uint32Array(1)
  globalThis.crypto.getRandomValues(value)
  return value[0] / 0x100000000
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function buildBalancedSides(count: number, random: Random): ComparisonSide[] {
  let remainingA = Math.floor(count / 2)
  let remainingB = Math.floor(count / 2)
  if (count % 2) {
    if (random() < 0.5) remainingA += 1
    else remainingB += 1
  }

  let next: ComparisonSide = random() < 0.5 ? 'a' : 'b'
  const sides: ComparisonSide[] = []

  while (remainingA || remainingB) {
    if (next === 'a' && !remainingA) next = 'b'
    if (next === 'b' && !remainingB) next = 'a'

    sides.push(next)
    if (next === 'a') remainingA -= 1
    else remainingB -= 1
    next = next === 'a' ? 'b' : 'a'
  }

  return sides
}

/**
 * Produces a balanced sequence from real, playable shared combinations.
 * Each side gets a shuffled cycle of every final/tone combination before that
 * side repeats one. Within those cycles, less-used finals and tones are chosen
 * first whenever an alternative exists.
 */
export function buildComparisonQuestions(
  candidates: readonly ComparisonCandidate[],
  count: number,
  random: Random = secureRandom,
): ComparisonQuestion[] {
  if (!candidates.length || count <= 0) return []

  const remaining: Record<ComparisonSide, ComparisonCandidate[]> = { a: [], b: [] }
  const finalUses = new Map<string, number>()
  const toneUses = new Map<MandarinTone, number>()
  let previous: ComparisonQuestion | undefined

  function refill(side: ComparisonSide): void {
    remaining[side] = shuffle(candidates, random)
  }

  function takeCandidate(side: ComparisonSide): ComparisonCandidate {
    if (!remaining[side].length) refill(side)

    const options = remaining[side]
    const distinctFinalAndTone = options.filter((candidate) =>
      !previous || (candidate.final !== previous.final && candidate.tone !== previous.tone),
    )
    const distinctCombination = options.filter((candidate) =>
      !previous || candidate.final !== previous.final || candidate.tone !== previous.tone,
    )
    const eligible = distinctFinalAndTone.length
      ? distinctFinalAndTone
      : distinctCombination.length
        ? distinctCombination
        : options

    const score = (candidate: ComparisonCandidate) =>
      (finalUses.get(candidate.final) ?? 0) * 4 + (toneUses.get(candidate.tone) ?? 0)
    const lowestScore = Math.min(...eligible.map(score))
    const best = eligible.filter((candidate) => score(candidate) === lowestScore)
    const selected = best[Math.floor(random() * best.length)]
    const index = options.indexOf(selected)
    options.splice(index, 1)
    finalUses.set(selected.final, (finalUses.get(selected.final) ?? 0) + 1)
    toneUses.set(selected.tone, (toneUses.get(selected.tone) ?? 0) + 1)
    return selected
  }

  return buildBalancedSides(count, random).map((targetSide) => {
    const candidate = takeCandidate(targetSide)
    const question: ComparisonQuestion = {
      ...candidate,
      targetSide,
      answerOrder: shuffle<ComparisonSide>(['a', 'b'], random),
    }
    previous = question
    return question
  })
}
