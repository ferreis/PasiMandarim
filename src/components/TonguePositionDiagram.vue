<script setup lang="ts">
import { computed } from 'vue'
import type { ArticulationDiagram } from '../types/pronunciation'

const props = withDefaults(defineProps<{
  type: ArticulationDiagram
  aspirated?: boolean
}>(), {
  aspirated: false,
})

type DiagramConfig = {
  label: string
  activePart: string
  tongue: string
  target: { cx: number; cy: number; rx: number; ry: number }
}

const config = computed<DiagramConfig>(() => {
  const configurations: Record<ArticulationDiagram, DiagramConfig> = {
    bilabial: {
      label: 'dois lábios',
      activePart: 'Os lábios fecham a passagem; a língua fica relaxada.',
      tongue: 'M164 205 C208 186 265 181 326 187 C371 192 401 210 425 239 C371 234 317 235 263 239 C219 241 184 232 164 205 Z',
      target: { cx: 116, cy: 168, rx: 15, ry: 24 },
    },
    labiodental: {
      label: 'lábio inferior + dentes superiores',
      activePart: 'O lábio inferior se aproxima dos dentes superiores; a língua não faz a constrição.',
      tongue: 'M164 205 C208 186 265 181 326 187 C371 192 401 210 425 239 C371 234 317 235 263 239 C219 241 184 232 164 205 Z',
      target: { cx: 126, cy: 161, rx: 17, ry: 17 },
    },
    alveolar: {
      label: 'alvéolo',
      activePart: 'A ponta/lâmina da língua toca a saliência logo atrás dos dentes superiores.',
      tongue: 'M163 207 C190 192 212 169 232 145 C248 126 264 121 279 132 C299 147 334 174 380 204 C397 215 412 227 425 241 C368 235 315 234 263 239 C219 242 184 233 163 207 Z',
      target: { cx: 232, cy: 133, rx: 15, ry: 12 },
    },
    dental: {
      label: 'região dental / alveolar anterior',
      activePart: 'A ponta fica baixa e a lâmina cria o estreitamento bem à frente, perto dos dentes/alvéolo.',
      tongue: 'M162 207 C187 192 205 174 220 154 C235 134 249 128 264 139 C288 157 330 183 379 207 C396 216 411 228 425 241 C366 236 312 234 262 239 C218 242 183 233 162 207 Z',
      target: { cx: 210, cy: 149, rx: 15, ry: 13 },
    },
    alveolopalatal: {
      label: 'palato duro anterior',
      activePart: 'A ponta fica baixa; a lâmina e a frente do dorso sobem em direção ao palato duro.',
      tongue: 'M162 209 C192 197 219 178 245 151 C267 128 290 112 316 115 C347 120 369 157 389 196 C400 215 414 230 425 241 C367 236 313 235 260 240 C217 242 181 234 162 209 Z',
      target: { cx: 293, cy: 118, rx: 20, ry: 11 },
    },
    retroflex: {
      label: 'região pós-alveolar',
      activePart: 'A ponta da língua sobe e recua moderadamente para trás do alvéolo, sem enrolar de forma extrema.',
      tongue: 'M162 209 C194 198 221 180 244 158 C260 143 267 132 258 121 C249 110 254 96 270 91 C292 85 311 102 326 121 C349 149 370 181 390 207 C402 221 414 232 425 241 C368 236 314 235 261 240 C217 242 181 234 162 209 Z',
      target: { cx: 268, cy: 101, rx: 16, ry: 13 },
    },
    velar: {
      label: 'palato mole',
      activePart: 'A parte de trás do dorso da língua sobe em direção ao palato mole; a ponta permanece baixa.',
      tongue: 'M162 209 C207 191 255 190 301 182 C340 176 365 157 385 131 C400 111 415 105 429 116 C442 128 442 152 438 178 C434 205 431 224 425 241 C367 236 313 235 260 240 C217 242 181 234 162 209 Z',
      target: { cx: 408, cy: 119, rx: 21, ry: 12 },
    },
  }
  return configurations[props.type]
})
</script>

<template>
  <figure class="tongue-diagram">
    <svg
      viewBox="0 0 560 310"
      role="img"
      :aria-label="`Vista lateral da boca. Região de articulação destacada: ${config.label}.`"
    >
      <title>Posição aproximada da língua e ponto de articulação</title>
      <desc>
        Corte lateral simplificado da cabeça mostrando lábios, dentes, alvéolo, palato duro, palato mole, língua e garganta.
        A região destacada indica o ponto principal de articulação da inicial selecionada.
      </desc>

      <!-- Perfil externo: desenho próprio, inspirado em diagramas fonéticos de corte sagital. -->
      <path
        class="face-outline"
        d="M93 35 C70 53 62 79 70 100 C74 111 83 116 96 118 C84 126 77 138 79 151 C81 161 90 167 103 168 C88 179 86 194 95 207 C106 221 128 225 149 225 C167 255 194 274 227 282 L452 282 C459 257 464 231 465 202 C466 168 460 135 448 104 C435 71 409 47 374 34 C293 4 159 7 93 35 Z"
      />
      <path class="nose-line" d="M89 91 C107 87 121 92 127 101 C119 108 108 111 95 109" />
      <path class="upper-lip" d="M99 142 C111 136 121 137 130 144 C122 149 112 151 100 149" />
      <path class="lower-lip" d="M100 158 C111 154 122 156 131 162 C121 169 109 169 99 165" />
      <path class="chin-line" d="M100 171 C101 195 117 211 149 222" />

      <!-- Cavidade oral e referências anatômicas. -->
      <path class="hard-palate" d="M155 126 C191 99 234 85 283 86 C322 87 356 98 386 119" />
      <path class="soft-palate" d="M386 119 C405 130 418 148 424 171" />
      <path class="pharynx" d="M434 166 C445 195 447 229 442 267" />
      <path class="mouth-floor" d="M143 221 C214 247 342 248 428 229" />

      <g class="teeth">
        <path d="M137 133 L151 132 L150 153 L139 154 Z" />
        <path d="M152 132 L166 131 L164 151 L151 153 Z" />
        <path d="M138 169 L151 168 L153 187 L141 187 Z" />
        <path d="M152 168 L165 167 L166 185 L153 187 Z" />
      </g>

      <path class="alveolar-ridge" d="M168 130 C187 117 207 108 228 102" />

      <!-- Língua dinâmica. -->
      <path class="tongue" :d="config.tongue" />
      <path class="tongue-midline" d="M173 211 C243 218 332 216 416 235" />

      <!-- Região-alvo. -->
      <ellipse
        class="target-halo"
        :cx="config.target.cx"
        :cy="config.target.cy"
        :rx="config.target.rx + 7"
        :ry="config.target.ry + 7"
      />
      <ellipse
        class="target"
        :cx="config.target.cx"
        :cy="config.target.cy"
        :rx="config.target.rx"
        :ry="config.target.ry"
      />
      <path class="target-line" :d="`M${config.target.cx + config.target.rx} ${config.target.cy - 2} C455 78 470 67 506 67`" />
      <text class="target-label" x="510" y="63" text-anchor="end">{{ config.label }}</text>

      <!-- Fluxo de ar: aparece apenas nos pares aspirados. -->
      <g v-if="aspirated" class="airflow" aria-label="Rajada de ar da aspiração">
        <path d="M117 150 C89 147 63 145 36 145" />
        <path d="M108 161 C82 166 59 172 39 181" />
        <path d="M39 145 L51 139 M39 145 L51 151" />
        <path d="M39 181 L49 171 M39 181 L53 182" />
        <text x="34" y="127">ar forte</text>
      </g>

      <!-- Legendas anatômicas. -->
      <g class="anatomy-labels">
        <text x="151" y="113">dentes</text>
        <line x1="156" y1="116" x2="151" y2="131" />

        <text x="205" y="68">alvéolo</text>
        <line x1="219" y1="72" x2="222" y2="101" />

        <text x="305" y="61">palato duro</text>
        <line x1="322" y1="65" x2="314" y2="88" />

        <text x="420" y="92">palato mole</text>
        <line x1="414" y1="96" x2="398" y2="126" />

        <text x="341" y="274">língua</text>
        <line x1="356" y1="265" x2="346" y2="225" />

        <text x="474" y="218">garganta</text>
        <line x1="466" y1="213" x2="441" y2="204" />
      </g>
    </svg>

    <div class="diagram-explanation">
      <span class="diagram-key"><i class="key-tongue"></i>Língua</span>
      <span class="diagram-key"><i class="key-target"></i>Região principal</span>
      <span v-if="aspirated" class="diagram-key"><i class="key-air"></i>Rajada de ar</span>
    </div>

    <figcaption>
      <strong>{{ config.label }}:</strong> {{ config.activePart }} A posição varia um pouco conforme a final e o falante.
    </figcaption>
  </figure>
</template>

<style scoped>
.tongue-diagram {
  margin: 0;
  padding: 14px;
  border: 1px solid #d9e0e7;
  border-radius: 16px;
  background: #fbfcfd;
}

svg {
  display: block;
  width: 100%;
  height: auto;
}

.face-outline {
  fill: #f7fbfe;
  stroke: #84b9da;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5;
}

.nose-line,
.upper-lip,
.lower-lip,
.chin-line {
  fill: none;
  stroke: #84b9da;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

.hard-palate,
.soft-palate,
.pharynx,
.mouth-floor,
.alveolar-ridge {
  fill: none;
  stroke: #39546d;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hard-palate,
.soft-palate,
.pharynx,
.mouth-floor {
  stroke-width: 4;
}

.alveolar-ridge {
  stroke-width: 6;
}

.teeth path {
  fill: #fff;
  stroke: #8393a0;
  stroke-linejoin: round;
  stroke-width: 2;
}

.tongue {
  fill: #ddf2e4;
  stroke: #23834c;
  stroke-linejoin: round;
  stroke-width: 5;
}

.tongue-midline {
  fill: none;
  stroke: #6fb187;
  stroke-linecap: round;
  stroke-width: 2;
}

.target-halo {
  fill: rgba(201, 67, 54, 0.13);
}

.target {
  fill: rgba(201, 67, 54, 0.3);
  stroke: #bd3e32;
  stroke-width: 3;
}

.target-line {
  fill: none;
  stroke: #bd3e32;
  stroke-dasharray: 5 4;
  stroke-width: 2;
}

.target-label {
  fill: #8a1f17;
  font-size: 13px;
  font-weight: 800;
}

.airflow path {
  fill: none;
  stroke: #2d6fbb;
  stroke-linecap: round;
  stroke-width: 3;
}

.airflow text {
  fill: #2d6fbb;
  font-size: 12px;
  font-weight: 800;
}

.anatomy-labels text {
  fill: #687784;
  font-size: 11px;
  font-weight: 700;
}

.anatomy-labels line {
  stroke: #9aa7b2;
  stroke-width: 1.5;
}

.diagram-explanation {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 7px;
}

.diagram-key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #687784;
  font-size: 0.7rem;
  font-weight: 700;
}

.diagram-key i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.key-tongue {
  background: #ddf2e4;
  border: 2px solid #23834c;
}

.key-target {
  background: rgba(201, 67, 54, 0.3);
  border: 2px solid #bd3e32;
}

.key-air {
  height: 3px !important;
  border-radius: 999px !important;
  background: #2d6fbb;
}

figcaption {
  margin-top: 9px;
  color: #687784;
  font-size: 0.73rem;
  line-height: 1.45;
}

figcaption strong {
  color: #425466;
}
</style>
