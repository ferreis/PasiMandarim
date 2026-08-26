<script setup lang="ts">
import { computed } from 'vue'
import type { ArticulationDiagram } from '../types/pronunciation'

const props = defineProps<{
  type: ArticulationDiagram
}>()

const tonguePath = computed(() => {
  const paths: Record<ArticulationDiagram, string> = {
    bilabial: 'M82 172 C116 160 150 158 185 164 C218 170 241 184 260 203',
    labiodental: 'M82 172 C116 160 150 158 185 164 C218 170 241 184 260 203',
    alveolar: 'M82 172 C105 157 118 132 139 119 C165 103 205 119 245 169',
    dental: 'M82 172 C101 158 112 142 126 133 C157 116 202 126 247 171',
    alveolopalatal: 'M82 173 C110 165 128 137 151 116 C179 91 218 113 251 169',
    retroflex: 'M82 173 C111 160 132 143 145 126 C132 116 126 102 141 92 C178 94 222 126 253 177',
    velar: 'M82 173 C126 162 166 164 195 145 C215 132 222 108 239 103 C251 104 259 111 264 124',
  }
  return paths[props.type]
})

const contact = computed(() => {
  const points: Record<ArticulationDiagram, { x: number; y: number; label: string }> = {
    bilabial: { x: 67, y: 140, label: 'lábios' },
    labiodental: { x: 70, y: 146, label: 'lábio + dentes' },
    alveolar: { x: 137, y: 116, label: 'alvéolo' },
    dental: { x: 119, y: 132, label: 'dentes / alvéolo' },
    alveolopalatal: { x: 163, y: 109, label: 'palato duro' },
    retroflex: { x: 143, y: 94, label: 'pós-alvéolo' },
    velar: { x: 237, y: 104, label: 'palato mole' },
  }
  return points[props.type]
})
</script>

<template>
  <figure class="tongue-diagram">
    <svg viewBox="0 0 330 245" role="img" :aria-label="`Diagrama esquemático da articulação em ${contact.label}`">
      <title>Posição aproximada da língua</title>
      <desc>Vista lateral esquemática da boca. A região destacada mostra o ponto principal de articulação.</desc>

      <path class="head" d="M51 44 C37 72 38 103 48 126 C54 139 53 158 62 178 C80 210 122 226 176 226 L280 226 C287 187 288 148 282 111 C276 75 253 46 219 31 C171 10 92 15 51 44 Z" />
      <path class="palate" d="M79 119 C109 91 149 76 191 80 C219 83 246 95 267 113" />
      <path class="mouth-floor" d="M76 184 C124 199 205 203 265 190" />
      <path class="upper-teeth" d="M75 118 L85 132 L95 119 L104 131" />
      <path class="lower-teeth" d="M76 165 L88 151 L99 166 L110 153" />
      <path class="lips" d="M62 127 C71 132 72 141 63 146 C72 151 71 161 62 166" />
      <path class="tongue" :d="tonguePath" />

      <circle class="contact" :cx="contact.x" :cy="contact.y" r="7" />
      <line class="guide" :x1="contact.x + 6" :y1="contact.y - 5" x2="300" y2="55" />
      <text x="302" y="52" text-anchor="end">{{ contact.label }}</text>

      <text class="anatomy" x="130" y="72">alvéolo</text>
      <text class="anatomy" x="190" y="69">palato duro</text>
      <text class="anatomy" x="264" y="93" text-anchor="end">palato mole</text>
    </svg>
    <figcaption>Diagrama esquemático original do projeto; a posição exata varia com a final e com o falante.</figcaption>
  </figure>
</template>

<style scoped>
.tongue-diagram {
  margin: 0;
  padding: 14px;
  border: 1px solid #d9e0e7;
  border-radius: 16px;
  background: #f8fafb;
}

svg {
  display: block;
  width: 100%;
  height: auto;
}

.head {
  fill: #fff;
  stroke: #aeb9c3;
  stroke-width: 3;
}

.palate,
.mouth-floor,
.upper-teeth,
.lower-teeth,
.lips {
  fill: none;
  stroke: #687784;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.tongue {
  fill: none;
  stroke: #17202a;
  stroke-linecap: round;
  stroke-width: 9;
}

.contact {
  fill: #b74337;
  stroke: #fff;
  stroke-width: 3;
}

.guide {
  stroke: #b74337;
  stroke-dasharray: 4 4;
  stroke-width: 1.5;
}

text {
  fill: #8a1f17;
  font-size: 11px;
  font-weight: 800;
}

.anatomy {
  fill: #7a8793;
  font-size: 9px;
  font-weight: 650;
}

figcaption {
  margin-top: 8px;
  color: #687784;
  font-size: 0.72rem;
  line-height: 1.4;
}
</style>
