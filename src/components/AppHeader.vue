<script setup lang="ts">
type AppTab = 'comparison' | 'flashcards' | 'tones' | 'pronunciation' | 'radicals'

defineProps<{
  activeTab: AppTab
}>()
</script>

<template>
  <header class="site-navbar">
    <div class="site-navbar-inner">
      <a class="site-brand" href="#/comparison" aria-label="Voltar para a tela inicial">
        <svg class="site-brand-mark" viewBox="0 0 64 64" role="img" aria-label="Logo Learning Mandarin">
          <rect x="3" y="3" width="58" height="58" rx="18" fill="currentColor" />
          <path d="M17 24h12" stroke="white" stroke-width="4" stroke-linecap="round" />
          <path d="M36 27l10-7" stroke="white" stroke-width="4" stroke-linecap="round" />
          <path d="M17 39c4-7 8-7 12 0" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" />
          <path d="M36 36l10 8" stroke="white" stroke-width="4" stroke-linecap="round" />
        </svg>
        <span>Learning Mandarin</span>
      </a>

      <nav class="site-nav-links" aria-label="Menu principal">
        <a href="#/comparison" :class="{ active: activeTab === 'comparison' }">Comparação</a>
        <a href="#/flashcards" :class="{ active: activeTab === 'flashcards' }">Flashcards</a>
        <a href="#/tones" :class="{ active: activeTab === 'tones' }">Tons</a>
        <a href="#/pronunciation" :class="{ active: activeTab === 'pronunciation' }">Pronúncia</a>
        <a href="#/radicals" :class="{ active: activeTab === 'radicals' }">Radicais</a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-navbar{position:sticky;top:0;z-index:30;width:100%;border-bottom:1px solid #d9e0e7;background:rgba(255,255,255,.96);backdrop-filter:blur(12px)}.site-navbar-inner{display:flex;align-items:stretch;justify-content:space-between;gap:32px;width:min(1440px,calc(100% - 48px));min-height:76px;margin:0 auto}.site-brand{display:inline-flex;align-items:center;gap:12px;color:#17202a;font-weight:900;text-decoration:none;letter-spacing:-.02em}.site-brand-mark{width:42px;height:42px;flex:0 0 auto;color:#17202a;transition:transform 160ms ease}.site-brand:hover .site-brand-mark,.site-brand:focus-visible .site-brand-mark{transform:translateY(-2px)}.site-nav-links{display:flex;align-items:stretch;gap:4px}.site-nav-links a{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:82px;padding:0 11px;color:#52606d;font-size:.88rem;font-weight:800;text-decoration:none;transition:color 140ms ease,background 140ms ease}.site-nav-links a:hover{background:#f7f9fb;color:#17202a}.site-nav-links a.active{color:#17202a}.site-nav-links a.active::after{position:absolute;right:11px;bottom:0;left:11px;height:3px;border-radius:999px 999px 0 0;background:#17202a;content:''}.site-brand:focus-visible,.site-nav-links a:focus-visible{outline:3px solid rgba(23,32,42,.22);outline-offset:-3px}@media(max-width:860px){.site-navbar-inner{width:min(100% - 24px,1440px);min-height:66px;gap:8px}.site-brand{gap:8px;font-size:.84rem}.site-brand-mark{width:36px;height:36px}.site-nav-links{gap:0}.site-nav-links a{min-width:auto;padding:0 7px;font-size:.74rem}.site-nav-links a.active::after{right:6px;left:6px}}@media(max-width:660px){.site-navbar-inner{align-items:center}.site-brand span{display:none}.site-nav-links{flex:1;justify-content:flex-end}.site-nav-links a{padding:0 5px;font-size:.68rem}}@media(max-width:520px){.site-nav-links{overflow-x:auto;justify-content:flex-start}.site-navbar-inner{gap:4px}.site-brand{flex:0 0 auto}}
</style>
