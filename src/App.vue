<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import ComparisonTrainer from './components/ComparisonTrainer.vue'
import FlashcardTrainer from './components/FlashcardTrainer.vue'

type AppTab = 'comparison' | 'flashcards'

function tabFromHash(): AppTab {
  return window.location.hash === '#/flashcards' ? 'flashcards' : 'comparison'
}

const activeTab = ref<AppTab>(typeof window === 'undefined' ? 'comparison' : tabFromHash())

function syncTabWithHash(): void {
  activeTab.value = tabFromHash()
}

onMounted(() => window.addEventListener('hashchange', syncTabWithHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncTabWithHash))

const heroTitle = computed(() =>
  activeTab.value === 'flashcards' ? 'Flashcards auditivos' : 'Treino auditivo de Pinyin',
)
const heroCopy = computed(() =>
  activeTab.value === 'flashcards'
    ? 'Escolha duas iniciais e a quantidade de questões. O sistema sorteia finais e tons com áudio humano, embaralha cada rodada e acompanha seu desempenho.'
    : 'Compare duas iniciais mantendo final e tom iguais para perceber com clareza as diferenças de pronúncia.',
)
</script>

<template>
  <AppHeader :active-tab="activeTab" />

  <main class="page-shell">
    <section class="hero">
      <h1>{{ heroTitle }}</h1>
      <p class="hero-copy">{{ heroCopy }}</p>
    </section>

    <ComparisonTrainer v-if="activeTab === 'comparison'" />
    <FlashcardTrainer v-else />
  </main>

  <AppFooter />
</template>
