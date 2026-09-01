<script setup lang="ts">
import {
  flashcardQuantityOptions,
  flashcardRepeatDelayOptions,
  flashcardTtsVoiceOptions,
  flashcardSettings,
  formatRepeatDelay,
  resetFlashcardSettings,
} from '../services/flashcardSettings'
</script>

<template>
  <section class="trainer-card flashcard-settings" aria-labelledby="flashcard-settings-title">
    <div class="flashcard-settings-heading">
      <h2 id="flashcard-settings-title">Preferências dos treinos</h2>
      <p>Estas escolhas são salvas automaticamente neste navegador e reutilizadas nas sessões de flashcards.</p>
    </div>

    <div class="flashcard-settings-list">
      <label class="flashcard-setting-row">
        <span>
          <strong>Quantidade</strong>
          <small>Quantidade padrão de itens gerados ao iniciar uma sessão.</small>
        </span>
        <select v-model.number="flashcardSettings.quantity" aria-label="Quantidade padrão de flashcards">
          <option v-for="quantity in flashcardQuantityOptions" :key="quantity" :value="quantity">
            {{ quantity }} flashcards
          </option>
        </select>
      </label>

      <label class="flashcard-setting-row flashcard-setting-toggle">
        <span>
          <strong>Reproduzir 3× automaticamente</strong>
          <small>No modo manual: ao iniciar, avançar e revelar a resposta.</small>
        </span>
        <input v-model="flashcardSettings.autoRepeat" type="checkbox" aria-label="Reproduzir 3 vezes automaticamente" />
      </label>

      <fieldset class="flashcard-setting-row flashcard-audio-source">
        <legend>
          <strong>Fonte de áudio das comparações</strong>
          <small>Define a origem dos sons usados no treino de iniciais.</small>
        </legend>
        <div class="flashcard-audio-options" role="radiogroup" aria-label="Fonte de áudio das comparações">
          <label><input v-model="flashcardSettings.audioSource" type="radio" value="human" /> Áudio humano</label>
          <label><input v-model="flashcardSettings.audioSource" type="radio" value="tts" /> TTS</label>
          <label><input v-model="flashcardSettings.audioSource" type="radio" value="human-tts" /> Áudio humano + TTS</label>
        </div>
      </fieldset>

      <label v-if="flashcardSettings.audioSource !== 'human'" class="flashcard-setting-row">
        <span>
          <strong>Voz TTS</strong>
          <small>“Recomendada” usa Xiaoxiao, voz zh-CN selecionada pela clareza e consistência para iniciantes.</small>
        </span>
        <select v-model="flashcardSettings.ttsVoice" aria-label="Voz TTS">
          <option v-for="voice in flashcardTtsVoiceOptions" :key="voice.value" :value="voice.value">{{ voice.label }}</option>
        </select>
      </label>

      <label v-if="flashcardSettings.autoRepeat" class="flashcard-setting-row">
        <span>
          <strong>Tempo entre as repetições</strong>
          <small>Pausa entre uma reprodução e a próxima durante a repetição automática 3×.</small>
        </span>
        <select v-model.number="flashcardSettings.repeatDelayMs" aria-label="Tempo entre as repetições automáticas">
          <option v-for="delay in flashcardRepeatDelayOptions" :key="delay" :value="delay">
            {{ formatRepeatDelay(delay) }}
          </option>
        </select>
      </label>

      <label class="flashcard-setting-row flashcard-setting-toggle">
        <span>
          <strong>Modo estudo automático</strong>
          <small>Pode ser ligado ou desligado durante a sessão: 3× áudio → 2s → resposta → 2s → 3× áudio → 2s → próxima.</small>
        </span>
        <input v-model="flashcardSettings.studyMode" type="checkbox" aria-label="Modo estudo automático" />
      </label>
    </div>

    <div class="flashcard-settings-footer">
      <p role="status">Salvo automaticamente somente neste navegador.</p>
      <button type="button" @click="resetFlashcardSettings">Restaurar padrões</button>
    </div>
  </section>
</template>

<style scoped>
.flashcard-settings{display:grid;gap:24px;max-width:960px;margin:0 auto}.flashcard-settings-heading{display:grid;gap:6px}.flashcard-settings-heading h2{margin:0;font-size:clamp(1.35rem,2vw,1.75rem)}.flashcard-settings-heading p{margin:0;color:#62707d;line-height:1.6}.flashcard-settings-list{display:grid;border:1px solid #d9e0e7;border-radius:18px;overflow:hidden}.flashcard-setting-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,220px);align-items:center;gap:24px;padding:20px;background:#fff;border:0;margin:0;min-width:0}.flashcard-setting-row+.flashcard-setting-row{border-top:1px solid #e5eaef}.flashcard-setting-row>span,.flashcard-setting-row legend{display:grid;gap:5px;padding:0}.flashcard-setting-row strong{font-size:1rem}.flashcard-setting-row small{color:#62707d;line-height:1.5}.flashcard-setting-row select{width:100%;min-height:44px}.flashcard-setting-toggle{grid-template-columns:minmax(0,1fr) auto}.flashcard-setting-toggle input{width:24px;height:24px;accent-color:#17202a}.flashcard-audio-source{grid-template-columns:minmax(0,1fr) minmax(250px,1.25fr)}.flashcard-audio-options{display:grid;gap:8px}.flashcard-audio-options label{display:flex;align-items:center;gap:8px;font-weight:650;cursor:pointer}.flashcard-audio-options input{width:18px;height:18px;accent-color:#17202a}.flashcard-settings-footer{display:flex;align-items:center;justify-content:space-between;gap:20px}.flashcard-settings-footer p{margin:0;color:#62707d;font-size:.9rem}.flashcard-settings-footer button{min-height:42px;padding:0 16px;border:1px solid #cbd4dc;border-radius:12px;background:#fff;color:#17202a;font-weight:700;cursor:pointer}.flashcard-settings-footer button:hover{background:#f5f7f9}@media(max-width:680px){.flashcard-setting-row,.flashcard-setting-toggle,.flashcard-audio-source{grid-template-columns:1fr;gap:12px}.flashcard-setting-toggle input{justify-self:start}.flashcard-settings-footer{align-items:flex-start;flex-direction:column}}
</style>
