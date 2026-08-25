<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import ComparisonTrainer from './components/ComparisonTrainer.vue'
import FlashcardTrainer from './components/FlashcardTrainer.vue'

const RadicalsExplorer = defineAsyncComponent(() => import('./components/RadicalsExplorer.vue'))

type AppTab = 'comparison' | 'flashcards' | 'radicals'

function tabFromHash(): AppTab {
  if (window.location.hash === '#/flashcards') return 'flashcards'
  if (window.location.hash === '#/radicals') return 'radicals'
  return 'comparison'
}

const activeTab = ref<AppTab>(typeof window === 'undefined' ? 'comparison' : tabFromHash())

function syncTabWithHash(): void {
  activeTab.value = tabFromHash()
}

onMounted(() => window.addEventListener('hashchange', syncTabWithHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncTabWithHash))

const heroTitle = computed(() => {
  if (activeTab.value === 'flashcards') return 'Flashcards auditivos'
  if (activeTab.value === 'radicals') return 'Radicais chineses'
  return 'Treino auditivo de Pinyin'
})

const heroCopy = computed(() => {
  if (activeTab.value === 'flashcards') {
    return 'Escolha duas iniciais e a quantidade de questões. O sistema sorteia finais e tons com áudio humano, embaralha cada rodada e acompanha seu desempenho.'
  }

  if (activeTab.value === 'radicals') {
    return 'Explore os 214 radicais Kangxi por símbolo, Pinyin, significado, número de traços, variantes e evidências históricas verificáveis.'
  }

  return 'Compare duas iniciais mantendo final e tom iguais para perceber com clareza as diferenças de pronúncia.'
})
</script>

<template>
  <AppHeader :active-tab="activeTab" />

  <main class="page-shell">
    <section class="hero">
      <h1>{{ heroTitle }}</h1>
      <p class="hero-copy">{{ heroCopy }}</p>
    </section>

    <ComparisonTrainer v-if="activeTab === 'comparison'" />
    <FlashcardTrainer v-else-if="activeTab === 'flashcards'" />
    <RadicalsExplorer v-else />
  </main>

  <AppFooter />
</template>
