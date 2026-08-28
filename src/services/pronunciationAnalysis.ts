export type PronunciationSegmentStatus = 'ok' | 'adjust'

export type PronunciationSegmentResult = {
  label: 'Início' | 'Meio' | 'Final'
  score: number
  status: PronunciationSegmentStatus
  referenceMovement: string
  userMovement: string
  message: string
}

export type PronunciationReport = {
  overallScore: number
  toneScore: number
  durationScore: number
  signalScore: number
  status: 'correct' | 'close' | 'adjust'
  referenceDuration: number
  userDuration: number
  referenceContour: number[]
  userContour: number[]
  segments: PronunciationSegmentResult[]
}

type PitchPoint = { time: number; hz: number }
type PitchAnalysis = { points: PitchPoint[]; duration: number; frameCount: number }

const ANALYSIS_RATE = 8000
const FRAME_SIZE = 320
const HOP_SIZE = 120
const CONTOUR_POINTS = 9

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function rms(values: Float32Array): number {
  let total = 0
  for (const value of values) total += value * value
  return Math.sqrt(total / Math.max(values.length, 1))
}

function monoSignal(buffer: AudioBuffer): Float32Array {
  const output = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < output.length; index += 1) output[index] += data[index] / buffer.numberOfChannels
  }
  return output
}

function resample(signal: Float32Array, sourceRate: number, targetRate = ANALYSIS_RATE): Float32Array {
  if (sourceRate === targetRate) return signal
  const ratio = sourceRate / targetRate
  const length = Math.max(1, Math.floor(signal.length / ratio))
  const output = new Float32Array(length)
  for (let index = 0; index < length; index += 1) {
    const sourceIndex = index * ratio
    const left = Math.floor(sourceIndex)
    const right = Math.min(signal.length - 1, left + 1)
    const mix = sourceIndex - left
    output[index] = signal[left] * (1 - mix) + signal[right] * mix
  }
  return output
}

function estimatePitch(frame: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / 450)
  const maxLag = Math.min(Math.floor(sampleRate / 70), frame.length - 2)
  let bestLag = 0
  let bestCorrelation = 0

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let cross = 0
    let energyA = 0
    let energyB = 0
    const count = frame.length - lag
    for (let index = 0; index < count; index += 1) {
      const a = frame[index]
      const b = frame[index + lag]
      cross += a * b
      energyA += a * a
      energyB += b * b
    }
    const denominator = Math.sqrt(energyA * energyB)
    if (!denominator) continue
    const correlation = cross / denominator
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestLag = lag
    }
  }

  if (bestCorrelation < 0.55 || !bestLag) return null
  return sampleRate / bestLag
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function smoothPitch(points: PitchPoint[]): PitchPoint[] {
  if (points.length < 3) return points
  return points.map((point, index) => {
    const nearby = points.slice(Math.max(0, index - 1), Math.min(points.length, index + 2)).map((item) => item.hz)
    return { ...point, hz: median(nearby) }
  })
}

function extractPitch(buffer: AudioBuffer): PitchAnalysis {
  const signal = resample(monoSignal(buffer), buffer.sampleRate)
  const globalRms = rms(signal)
  const threshold = Math.max(0.006, globalRms * 0.28)
  const points: PitchPoint[] = []
  let frameCount = 0

  for (let offset = 0; offset + FRAME_SIZE <= signal.length; offset += HOP_SIZE) {
    frameCount += 1
    const frame = signal.subarray(offset, offset + FRAME_SIZE)
    if (rms(frame) < threshold) continue
    const hz = estimatePitch(frame, ANALYSIS_RATE)
    if (hz) points.push({ time: offset / ANALYSIS_RATE, hz })
  }

  const smoothed = smoothPitch(points)
  const duration = smoothed.length > 1 ? smoothed.at(-1)!.time - smoothed[0].time + FRAME_SIZE / ANALYSIS_RATE : 0
  return { points: smoothed, duration, frameCount }
}

function contour(points: PitchPoint[], count = CONTOUR_POINTS): number[] {
  if (points.length < 3) throw new Error('Não foi possível detectar uma curva tonal suficiente nesta gravação.')
  const frequencies = points.map((point) => point.hz)
  const center = median(frequencies)
  const semitones = frequencies.map((hz) => 12 * Math.log2(hz / center))
  const output: number[] = []

  for (let index = 0; index < count; index += 1) {
    const position = index * (semitones.length - 1) / Math.max(count - 1, 1)
    const left = Math.floor(position)
    const right = Math.min(semitones.length - 1, left + 1)
    const mix = position - left
    output.push(semitones[left] * (1 - mix) + semitones[right] * mix)
  }
  return output
}

function rmse(left: number[], right: number[]): number {
  const count = Math.min(left.length, right.length)
  let total = 0
  for (let index = 0; index < count; index += 1) total += (left[index] - right[index]) ** 2
  return Math.sqrt(total / Math.max(count, 1))
}

function movement(values: number[]): string {
  const slope = values.at(-1)! - values[0]
  if (slope > 0.8) return 'subindo'
  if (slope < -0.8) return 'descendo'
  return 'estável'
}

function segmentResults(reference: number[], user: number[]): PronunciationSegmentResult[] {
  const labels: PronunciationSegmentResult['label'][] = ['Início', 'Meio', 'Final']
  return labels.map((label, index) => {
    const start = index * 3
    const referenceSlice = reference.slice(start, start + 3)
    const userSlice = user.slice(start, start + 3)
    const error = rmse(referenceSlice, userSlice)
    const score = Math.round(clamp(100 - error * 22))
    const referenceMovement = movement(referenceSlice)
    const userMovement = movement(userSlice)
    const status: PronunciationSegmentStatus = score >= 72 ? 'ok' : 'adjust'
    return {
      label,
      score,
      status,
      referenceMovement,
      userMovement,
      message: status === 'ok'
        ? 'Seu contorno ficou próximo da gravação de referência nesta parte.'
        : referenceMovement === userMovement
          ? 'A direção está correta, mas a intensidade da mudança tonal ainda difere da referência.'
          : `A referência está ${referenceMovement}, enquanto sua curva ficou ${userMovement}.`,
    }
  })
}

async function decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
  const context = new AudioContext()
  try {
    return await context.decodeAudioData(data.slice(0))
  } finally {
    await context.close()
  }
}

export async function comparePronunciation(referenceData: ArrayBuffer, userData: ArrayBuffer): Promise<PronunciationReport> {
  const [referenceBuffer, userBuffer] = await Promise.all([decodeAudio(referenceData), decodeAudio(userData)])
  const reference = extractPitch(referenceBuffer)
  const user = extractPitch(userBuffer)

  if (reference.points.length < 3) throw new Error('A gravação de referência não pôde ser analisada.')
  if (user.points.length < 3) throw new Error('Não detectei voz tonal suficiente. Tente falar um pouco mais perto do microfone.')

  const referenceContour = contour(reference.points)
  const userContour = contour(user.points)
  const contourError = rmse(referenceContour, userContour)
  const toneScore = Math.round(clamp(100 - contourError * 20))
  const durationRatio = Math.max(reference.duration, user.duration) / Math.max(0.05, Math.min(reference.duration, user.duration))
  const durationScore = Math.round(clamp(100 - Math.abs(Math.log2(durationRatio)) * 35))
  const signalScore = Math.round(clamp(user.points.length / Math.max(user.frameCount * 0.45, 1) * 100))
  const overallScore = Math.round(toneScore * 0.78 + durationScore * 0.14 + signalScore * 0.08)

  return {
    overallScore,
    toneScore,
    durationScore,
    signalScore,
    status: overallScore >= 80 ? 'correct' : overallScore >= 62 ? 'close' : 'adjust',
    referenceDuration: reference.duration,
    userDuration: user.duration,
    referenceContour,
    userContour,
    segments: segmentResults(referenceContour, userContour),
  }
}
