<script setup lang="ts">
import { ref } from 'vue'

type AppTab = 'comparison' | 'flashcards'

defineProps<{
  activeTab: AppTab
}>()

const menuOpen = ref(false)

function closeMenu(): void {
  menuOpen.value = false
}
</script>

<template>
  <header class="app-header">
    <a class="brand" href="#/comparison" aria-label="Voltar para a tela inicial" @click="closeMenu">
      <svg class="brand-mark" viewBox="0 0 64 64" role="img" aria-label="Logo Learning Mandarin">
        <rect x="3" y="3" width="58" height="58" rx="18" fill="currentColor" />
        <path d="M17 24h12" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M36 27l10-7" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M17 39c4-7 8-7 12 0" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M36 36l10 8" stroke="white" stroke-width="4" stroke-linecap="round" />
      </svg>
      <span>Learning Mandarin</span>
    </a>

    <div class="menu-shell">
      <button
        class="menu-trigger"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="main-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="menu-icon" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        Menu
      </button>

      <nav v-if="menuOpen" id="main-menu" class="main-menu" aria-label="Menu principal">
        <a
          href="#/comparison"
          :class="{ active: activeTab === 'comparison' }"
          @click="closeMenu"
        >
          <span>Comparação</span>
          <small>Compare iniciais mantendo final e tom iguais.</small>
        </a>
        <a
          href="#/flashcards"
          :class="{ active: activeTab === 'flashcards' }"
          @click="closeMenu"
        >
          <span>Flashcards</span>
          <small>Treino auditivo com histórico de acertos e erros.</small>
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 42px;
}

.brand {
  display: inline-grid;
  justify-items: center;
  gap: 8px;
  min-width: 118px;
  color: #17202a;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  text-decoration: none;
}

.brand-mark {
  width: 54px;
  height: 54px;
  color: #17202a;
  transition: transform 160ms ease;
}

.brand:hover .brand-mark,
.brand:focus-visible .brand-mark {
  transform: translateY(-2px);
}

.brand:focus-visible,
.menu-trigger:focus-visible,
.main-menu a:focus-visible {
  outline: 3px solid rgba(23, 32, 42, 0.22);
  outline-offset: 4px;
}

.menu-shell {
  position: relative;
}

.menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #d9e0e7;
  border-radius: 12px;
  background: #fff;
  color: #17202a;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(23, 32, 42, 0.06);
}

.menu-icon {
  display: grid;
  gap: 3px;
}

.menu-icon i {
  display: block;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.main-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  display: grid;
  gap: 6px;
  width: min(330px, calc(100vw - 32px));
  padding: 8px;
  border: 1px solid #d9e0e7;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 22px 55px rgba(23, 32, 42, 0.16);
}

.main-menu a {
  display: grid;
  gap: 4px;
  padding: 13px 14px;
  border-radius: 11px;
  color: #52606d;
  text-decoration: none;
}

.main-menu a:hover,
.main-menu a.active {
  background: #f1f4f7;
  color: #17202a;
}

.main-menu a.active {
  box-shadow: inset 3px 0 0 #17202a;
}

.main-menu span {
  font-weight: 900;
}

.main-menu small {
  color: #687784;
  font-size: 0.77rem;
  line-height: 1.4;
}

@media (max-width: 620px) {
  .app-header {
    align-items: center;
    margin-bottom: 30px;
  }

  .brand {
    min-width: 96px;
    font-size: 0.76rem;
  }

  .brand-mark {
    width: 46px;
    height: 46px;
  }

  .menu-trigger {
    min-height: 42px;
  }
}
</style>
