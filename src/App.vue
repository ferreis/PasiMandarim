<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import ComparisonTrainer from './components/ComparisonTrainer.vue'

const FlashcardHub = defineAsyncComponent(() => import('./components/FlashcardHub.vue'))
const RadicalsExplorer = defineAsyncComponent(() => import('./components/RadicalsExplorer.vue'))

type AppTab = 'comparison' | 'flashcards' | 'radicals'
type FlashcardCategory = 'comparison' | 'tones' | 'sentences' | 'pronunciation'

type RouteState = {
  tab: AppTab
  flashcardCategory: FlashcardCategory
}

function routeFromHash(): RouteState {
  const hash = window.location.hash

  if (hash === '#/radicals') return { tab: 'radicals', flashcardCategory: 'comparison' }

  if (hash === '#/flashcards/tones' || hash === '#/tones') {
    return { tab: 'flashcards', flashcardCategory: 'tones' }
  }
  if (hash === '#/flashcards/sentences' || hash === '#/sentences') {
    return { tab: 'flashcards', flashcardCategory: 'sentences' }
  }
  if (hash === '#/flashcards/pronunciation' || hash === '#/pronunciation') {
    return { tab: 'flashcards', flashcardCategory: 'pronunciation' }
  }
  if (hash === '#/flashcards' || hash === '#/flashcards/comparison') {
    return { tab: 'flashcards', flashcardCategory: 'comparison' }
  }

  return { tab: 'comparison', flashcardCategory: 'comparison' }
}

const initialRoute = typeof window === 'undefined'
  ? { tab: 'comparison' as AppTab, flashcardCategory: 'comparison' as FlashcardCategory }
  : routeFromHash()

const activeTab = ref<AppTab>(initialRoute.tab)
const activeFlashcardCategory = ref<FlashcardCategory>(initialRoute.flashcardCategory)

function syncRouteWithHash(): void {
  const route = routeFromHash()
  activeTab.value = route.tab
  activeFlashcardCategory.value = route.flashcardCategory
}

onMounted(() => window.addEventListener('hashchange', syncRouteWithHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncRouteWithHash))

const heroTitle = computed(() => {
  if (activeTab.value === 'flashcards') return 'Flashcards auditivos'
  if (activeTab.value === 'radicals') return 'Radicais chineses'
  return 'Treino auditivo de Pinyin'
})

const heroCopy = computed(() => {
  if (activeTab.value === 'flashcards') {
    return 'Escolha o tipo de treino e gere uma sessão de flashcards para praticar comparação de iniciais, tons, frases ou pronúncia.'
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
    <FlashcardHub v-else-if="activeTab === 'flashcards'" :active-category="activeFlashcardCategory" />
    <RadicalsExplorer v-else />
  </main>

  <AppFooter />
</template>
