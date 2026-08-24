<script setup lang="ts">
import { computed, ref } from 'vue'

type Contrast = {
  left: string
  right: string
  description: string
}

const contrasts: Contrast[] = [
  { left: 'b', right: 'p', description: 'Contraste de aspiração' },
  { left: 'd', right: 't', description: 'Contraste de aspiração' },
  { left: 'g', right: 'k', description: 'Contraste de aspiração' },
  { left: 'j', right: 'q', description: 'Contraste de aspiração' },
  { left: 'z', right: 'c', description: 'Contraste de aspiração' },
  { left: 'zh', right: 'ch', description: 'Contraste de aspiração' },
]

const toneLabels = ['1º tom', '2º tom', '3º tom', '4º tom']
const toneForms: Record<number, [string, string]> = {
  1: ['bā', 'pā'],
  2: ['bá', 'pá'],
  3: ['bǎ', 'pǎ'],
  4: ['bà', 'pà'],
}

const selectedContrast = ref(contrasts[0])
const selectedTone = ref(1)
const selectedFinal = ref('a')

const currentExample = computed(() => {
  if (selectedContrast.value.left === 'b' && selectedContrast.value.right === 'p' && selectedFinal.value === 'a') {
    return toneForms[selectedTone.value]
  }

  return [
    `${selectedContrast.value.left}${selectedFinal.value}${selectedTone.value}`,
    `${selectedContrast.value.right}${selectedFinal.value}${selectedTone.value}`,
  ]
})
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
      <div class="field-group">
        <span class="field-label">Contraste</span>
        <div class="contrast-grid">
          <button
            v-for="contrast in contrasts"
            :key="`${contrast.left}-${contrast.right}`"
            class="choice-button"
            :class="{ active: selectedContrast === contrast }"
            @click="selectedContrast = contrast"
          >
            <strong>{{ contrast.left }} × {{ contrast.right }}</strong>
            <small>{{ contrast.description }}</small>
          </button>
        </div>
      </div>

      <div class="controls-row">
        <label>
          <span class="field-label">Final</span>
          <select v-model="selectedFinal">
            <option value="a">a</option>
          </select>
        </label>

        <label>
          <span class="field-label">Tom</span>
          <select v-model.number="selectedTone">
            <option v-for="(label, index) in toneLabels" :key="label" :value="index + 1">
              {{ label }}
            </option>
          </select>
        </label>
      </div>

      <div class="comparison">
        <article class="sound-card">
          <span class="sound-label">Som A</span>
          <strong>{{ currentExample[0] }}</strong>
          <button disabled title="O áudio humano será integrado na próxima etapa">Ouvir</button>
        </article>

        <span class="versus">×</span>

        <article class="sound-card">
          <span class="sound-label">Som B</span>
          <strong>{{ currentExample[1] }}</strong>
          <button disabled title="O áudio humano será integrado na próxima etapa">Ouvir</button>
        </article>
      </div>

      <p class="audio-notice">
        Os botões de áudio permanecem desativados até que uma gravação humana licenciada seja vinculada. O projeto não usará TTS como referência.
      </p>
    </section>
  </main>
</template>
