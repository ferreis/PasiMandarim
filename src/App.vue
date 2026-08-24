<script setup lang="ts">
import { computed, ref } from 'vue'
import { verifiedAudioPairs } from './data/audioCatalog'
import { playHumanAudio } from './services/audioPlayer'
import type { HumanAudioSample, MandarinTone } from './types/audio'

type Contrast = {
  id: string
  left: string
  right: string
  description: string
}

const contrasts: Contrast[] = [
  { id: 'b-p', left: 'b', right: 'p', description: 'Contraste de aspiração' },
  { id: 'd-t', left: 'd', right: 't', description: 'Contraste de aspiração' },
  { id: 'g-k', left: 'g', right: 'k', description: 'Contraste de aspiração' },
  { id: 'j-q', left: 'j', right: 'q', description: 'Contraste de aspiração' },
  { id: 'z-c', left: 'z', right: 'c', description: 'Contraste de aspiração' },
  { id: 'zh-ch', left: 'zh', right: 'ch', description: 'Contraste de aspiração' },
]

const toneLabels: Record<MandarinTone, string> = {
  1: '1º tom',
  2: '2º tom',
  3: '3º tom',
  4: '4º tom',
  5: 'Tom neutro',
}

const selectedContrastId = ref('b-p')
const selectedFinal = ref('ian')
const selectedTone = ref<MandarinTone>(1)
const audioError = ref('')
const loadingSide = ref<'left' | 'right' | null>(null)

const availablePairsForContrast = computed(() =>
  verifiedAudioPairs.filter((pair) => pair.contrast === selectedContrastId.value && pair.verified),
)

const finalOptions = computed(() => [
  ...new Set(availablePairsForContrast.value.map((pair) => pair.final)),
])

const toneOptions = computed(() => [
  ...new Set(
    availablePairsForContrast.value
      .filter((pair) => pair.final === selectedFinal.value)
      .map((pair) => pair.tone),
  ),
])

const currentPair = computed(() =>
  availablePairsForContrast.value.find(
    (pair) => pair.final === selectedFinal.value && pair.tone === selectedTone.value,
  ),
)

function hasVerifiedAudio(contrastId: string): boolean {
  return verifiedAudioPairs.some((pair) => pair.contrast === contrastId && pair.verified)
}

function selectContrast(contrastId: string): void {
  const firstPair = verifiedAudioPairs.find(
    (pair) => pair.contrast === contrastId && pair.verified,
  )

  if (!firstPair) {
    return
  }

  selectedContrastId.value = contrastId
  selectedFinal.value = firstPair.final
  selectedTone.value = firstPair.tone
}

async function listen(sample: HumanAudioSample, side: 'left' | 'right'): Promise<void> {
  audioError.value = ''
  loadingSide.value = side

  try {
    await playHumanAudio(sample)
  } catch {
    audioError.value = 'Não foi possível reproduzir o áudio do Wikimedia Commons.'
  } finally {
    loadingSide.value = null
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Learning Mandarin</p>
      <h1>Treino auditivo de Pinyin</h1>
      <p class="hero-copy">
        Compare sons mantendo a final e o tom iguais. A única diferença deve ser o elemento que você está treinando.
      </p>
    </section>

    <section class="trainer-card">
      <div class="catalog-status" role="status">
        <strong>{{ verifiedAudioPairs.length }} par humano verificado</strong>
        <span>Somente gravações com falante, origem e licença confirmados ficam disponíveis.</span>
      </div>

      <div class="field-group">
        <span class="field-label">Contraste</span>
        <div class="contrast-grid">
          <button
            v-for="contrast in contrasts"
            :key="contrast.id"
            class="choice-button"
            :class="{ active: selectedContrastId === contrast.id }"
            :disabled="!hasVerifiedAudio(contrast.id)"
            @click="selectContrast(contrast.id)"
          >
            <strong>{{ contrast.left }} × {{ contrast.right }}</strong>
            <small>
              {{ hasVerifiedAudio(contrast.id) ? contrast.description : 'Em catalogação' }}
            </small>
          </button>
        </div>
      </div>

      <div class="controls-row">
        <label>
          <span class="field-label">Final</span>
          <select v-model="selectedFinal">
            <option v-for="final in finalOptions" :key="final" :value="final">
              {{ final }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Tom</span>
          <select v-model.number="selectedTone">
            <option v-for="tone in toneOptions" :key="tone" :value="tone">
              {{ toneLabels[tone] }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="currentPair" class="comparison">
        <article class="sound-card">
          <span class="sound-label">Som A</span>
          <strong>{{ currentPair.left.pinyin }}</strong>
          <span class="hanzi">{{ currentPair.left.hanzi }}</span>
          <button type="button" @click="listen(currentPair.left, 'left')">
            {{ loadingSide === 'left' ? 'Carregando…' : 'Ouvir' }}
          </button>
          <a :href="currentPair.left.sourcePage" target="_blank" rel="noreferrer">
            Ver fonte do áudio
          </a>
        </article>

        <span class="versus">×</span>

        <article class="sound-card">
          <span class="sound-label">Som B</span>
          <strong>{{ currentPair.right.pinyin }}</strong>
          <span class="hanzi">{{ currentPair.right.hanzi }}</span>
          <button type="button" @click="listen(currentPair.right, 'right')">
            {{ loadingSide === 'right' ? 'Carregando…' : 'Ouvir' }}
          </button>
          <a :href="currentPair.right.sourcePage" target="_blank" rel="noreferrer">
            Ver fonte do áudio
          </a>
        </article>
      </div>

      <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>

      <section v-if="currentPair" class="audio-metadata" aria-label="Origem das gravações">
        <div class="verified-badge">Gravações humanas verificadas</div>
        <dl>
          <div>
            <dt>Falante</dt>
            <dd>{{ currentPair.left.speaker }}</dd>
          </div>
          <div>
            <dt>Origem</dt>
            <dd>{{ currentPair.left.speakerOrigin }}</dd>
          </div>
          <div>
            <dt>Acervo</dt>
            <dd>{{ currentPair.left.source }}</dd>
          </div>
          <div>
            <dt>Créditos</dt>
            <dd>{{ currentPair.left.credits }}</dd>
          </div>
          <div>
            <dt>Licença</dt>
            <dd>
              <a :href="currentPair.left.license.url" target="_blank" rel="noreferrer">
                {{ currentPair.left.license.name }}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <p class="audio-notice">
        Nenhuma voz sintética é usada como referência. Novos pares só são habilitados quando os dois áudios têm origem humana e metadados verificáveis.
      </p>
    </section>
  </main>
</template>
