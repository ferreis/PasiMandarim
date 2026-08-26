import type { ArticulationDiagram, InitialPronunciationGuide } from '../types/pronunciation'

type Family = {
  family: string
  place: string
  tongue: string
  lips: string
  diagram: ArticulationDiagram
}

type Entry = Omit<InitialPronunciationGuide, keyof Family | 'initial'> & { familyKey: keyof typeof families }

const families = {
  bilabial: {
    family: 'Labial',
    place: 'Bilabial',
    tongue: 'A língua fica relaxada e baixa; a final escolhida é que determina a posição seguinte da língua.',
    lips: 'Os dois lábios são o ponto principal de articulação.',
    diagram: 'bilabial',
  },
  labiodental: {
    family: 'Labiodental',
    place: 'Labiodental',
    tongue: 'A língua permanece relaxada e não cria a constrição principal.',
    lips: 'O lábio inferior se aproxima dos dentes superiores, formando uma passagem estreita para o ar.',
    diagram: 'labiodental',
  },
  alveolar: {
    family: 'Alveolar',
    place: 'Alveolar',
    tongue: 'A ponta ou a lâmina da língua trabalha junto ao alvéolo, a saliência logo atrás dos dentes superiores.',
    lips: 'Os lábios ficam neutros e acompanham principalmente a final.',
    diagram: 'alveolar',
  },
  dental: {
    family: 'Sibilante anterior',
    place: 'Dental / alveolar anterior',
    tongue: 'A ponta da língua fica baixa e muito à frente, próxima aos dentes inferiores, enquanto a lâmina cria a constrição perto dos dentes superiores e do alvéolo.',
    lips: 'Os lábios ficam neutros, sem arredondamento especial.',
    diagram: 'dental',
  },
  alveolopalatal: {
    family: 'Alveolopalatal',
    place: 'Alveolopalatal',
    tongue: 'A ponta da língua fica junto aos dentes inferiores; a lâmina e a parte anterior do dorso sobem em direção ao palato duro.',
    lips: 'Os lábios tendem a ficar neutros ou levemente estendidos, acompanhando finais com i/ü.',
    diagram: 'alveolopalatal',
  },
  retroflex: {
    family: 'Retroflexa',
    place: 'Pós-alveolar / retroflexa',
    tongue: 'A ponta da língua sobe e recua para a região atrás do alvéolo. Não é necessário enrolar a língua de forma extrema.',
    lips: 'Os lábios ficam neutros e acompanham principalmente a final.',
    diagram: 'retroflex',
  },
  velar: {
    family: 'Velar',
    place: 'Velar',
    tongue: 'A parte de trás da língua sobe em direção ao palato mole; a ponta permanece baixa e relaxada.',
    lips: 'Os lábios não criam a obstrução principal e seguem a final.',
    diagram: 'velar',
  },
} as const satisfies Record<string, Family>

const entries: Record<string, Entry> = {
  b: {
    familyKey: 'bilabial', ipa: '[p]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Feche os lábios por completo e solte a obstrução com pouco sopro. O contraste importante é a quantidade de ar, não transformar o som em um “b” sonoro do português.',
    commonMistake: 'Vibrar as cordas vocais como no “b” brasileiro ou soltar ar demais e aproximar o som de p.',
    portugueseReference: 'É mais próximo de um p sem sopro forte do que do b sonoro de “bola”.',
    contrast: 'Compare diretamente com p: a posição dos lábios é praticamente a mesma; p tem uma rajada de ar evidente.',
  },
  p: {
    familyKey: 'bilabial', ipa: '[pʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Feche os lábios e libere a obstrução com uma rajada clara de ar. Colocar a mão ou um papel diante da boca ajuda a perceber a aspiração.',
    commonMistake: 'Produzir pouco ar e acabar soando como b do Pinyin.',
    portugueseReference: 'Lembra o p brasileiro, mas treine deliberadamente a rajada de ar para manter o contraste com b.',
    contrast: 'Compare com b mantendo exatamente a mesma posição da boca e mudando principalmente a aspiração.',
  },
  m: {
    familyKey: 'bilabial', ipa: '[m]', aspiration: 'Não se aplica', voicing: 'Sonora', manner: 'Nasal',
    production: 'Feche os lábios e deixe o ar sair pelo nariz enquanto a voz vibra. A abertura para a final vem logo depois.',
    commonMistake: 'Abrir os lábios cedo demais ou retirar a nasalização antes de iniciar a final.',
    portugueseReference: 'É bastante próximo do m de “mãe”, mas observe a transição limpa para a final chinesa.',
  },
  f: {
    familyKey: 'labiodental', ipa: '[f]', aspiration: 'Não se aplica', voicing: 'Surda', manner: 'Fricativa',
    production: 'Aproxime o lábio inferior dos dentes superiores e deixe o ar passar continuamente pelo estreitamento, sem fechar totalmente a passagem.',
    commonMistake: 'Encostar com força excessiva e interromper o fluxo, ou deixar a passagem larga demais e perder a fricção.',
    portugueseReference: 'Muito próximo do f de “faca”; concentre-se em manter um fluxo de ar limpo e contínuo.',
  },
  d: {
    familyKey: 'alveolar', ipa: '[t]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Encoste a ponta da língua no alvéolo, bloqueie o ar e solte com pouco sopro. Não use a sonorização típica do d português.',
    commonMistake: 'Pronunciar um d sonoro brasileiro ou aspirar demais e transformar o contraste em t.',
    portugueseReference: 'Pense em um t curto e sem rajada forte, não no d sonoro de “dado”.',
    contrast: 'd e t usam praticamente o mesmo ponto de contato; t é claramente aspirado.',
  },
  t: {
    familyKey: 'alveolar', ipa: '[tʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Bloqueie o ar no alvéolo e libere com uma rajada perceptível de ar.',
    commonMistake: 'Usar aspiração fraca e aproximar o som de d do Pinyin.',
    portugueseReference: 'Lembra o t brasileiro, mas o sopro precisa ficar muito claro quando comparado a d.',
    contrast: 'Compare com d usando a mesma posição de língua e alterando a força da aspiração.',
  },
  n: {
    familyKey: 'alveolar', ipa: '[n]', aspiration: 'Não se aplica', voicing: 'Sonora', manner: 'Nasal',
    production: 'Encoste a ponta da língua no alvéolo, mantenha a voz e deixe o ar escapar pelo nariz.',
    commonMistake: 'Retirar a língua do alvéolo cedo demais ou confundir o contato com l.',
    portugueseReference: 'Próximo do n de “nada”; mantenha o contato alveolar claro antes da final.',
  },
  l: {
    familyKey: 'alveolar', ipa: '[l]', aspiration: 'Não se aplica', voicing: 'Sonora', manner: 'Aproximante lateral',
    production: 'Encoste a ponta da língua no alvéolo e deixe o ar escapar pelas laterais da língua enquanto a voz permanece ativa.',
    commonMistake: 'Deixar a ponta da língua baixa demais ou nasalizar o som e aproximá-lo de n.',
    portugueseReference: 'Próximo do l de “lado”, especialmente em início de sílaba.',
  },
  g: {
    familyKey: 'velar', ipa: '[k]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Eleve o dorso da língua ao palato mole, bloqueie o ar e solte com pouco sopro. O som não é o g sonoro de “gato”.',
    commonMistake: 'Sonorizar como g do português ou soltar ar demais e aproximar o som de k.',
    portugueseReference: 'É mais próximo de um c/k sem aspiração forte do que do g brasileiro.',
    contrast: 'g e k compartilham a posição velar; k possui uma rajada de ar muito mais clara.',
  },
  k: {
    familyKey: 'velar', ipa: '[kʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Oclusiva',
    production: 'Feche a passagem com a parte de trás da língua contra o palato mole e libere com bastante ar.',
    commonMistake: 'Aspiração insuficiente, fazendo k se aproximar de g do Pinyin.',
    portugueseReference: 'Lembra o c de “casa”, mas com uma liberação de ar deliberadamente forte.',
    contrast: 'Use a mesma posição de g e aumente claramente a aspiração.',
  },
  h: {
    familyKey: 'velar', ipa: '[x] ~ [h]', aspiration: 'Não se aplica', voicing: 'Surda', manner: 'Fricativa',
    production: 'Aproxime a parte de trás da língua do palato mole sem fechar totalmente a passagem. O ar passa com fricção contínua.',
    commonMistake: 'Produzir apenas um h muito leve e anterior ou fechar a passagem como se fosse k.',
    portugueseReference: 'Pode lembrar o r forte brasileiro de “rato” em alguns sotaques, mas a realização chinesa varia e é melhor aprender pelo áudio.',
  },
  j: {
    familyKey: 'alveolopalatal', ipa: '[tɕ]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Africada',
    production: 'Mantenha a ponta da língua baixa, perto dos dentes inferiores, e eleve a lâmina em direção ao palato duro. Faça uma breve oclusão seguida de fricção, com pouco sopro.',
    commonMistake: 'Recuar a língua como em zh ou usar o j sonoro do português.',
    portugueseReference: 'Não há equivalente exato em português. A posição da língua é mais importante que imitar uma letra conhecida.',
    contrast: 'j e q têm a mesma região articulatória; q acrescenta aspiração forte.',
  },
  q: {
    familyKey: 'alveolopalatal', ipa: '[tɕʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Africada',
    production: 'Use a mesma posição anterior de j, mas solte uma rajada clara de ar após a breve oclusão.',
    commonMistake: 'Recuar para ch ou produzir pouca aspiração e aproximar q de j.',
    portugueseReference: 'Não corresponde ao q português. Um apoio inicial é pensar em um “tch” muito frontal, mas o áudio deve ser a referência final.',
    contrast: 'Compare com j sem mover a língua; a diferença principal é a aspiração.',
  },
  x: {
    familyKey: 'alveolopalatal', ipa: '[ɕ]', aspiration: 'Não se aplica', voicing: 'Surda', manner: 'Fricativa',
    production: 'Deixe a ponta da língua junto aos dentes inferiores e aproxime a lâmina do palato duro, criando uma passagem estreita e contínua para o ar.',
    commonMistake: 'Recuar a língua e produzir sh, ou usar o valor de x do português.',
    portugueseReference: 'Não há equivalente exato. Pode lembrar um “ch” muito frontal e agudo, com a língua baixa na frente.',
    contrast: 'Para diferenciar x de sh, observe principalmente que x é produzido bem mais à frente e sem curvar a ponta para trás.',
  },
  zh: {
    familyKey: 'retroflex', ipa: '[ʈʂ]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Africada retroflexa',
    production: 'Eleve e recue a ponta da língua para a região pós-alveolar, faça uma breve oclusão e libere em fricção com pouco sopro.',
    commonMistake: 'Curvar demais a língua, tocar muito atrás, ou manter a língua plana como em z/j.',
    portugueseReference: 'Não há equivalente exato; evite ler zh como as letras z+h separadamente.',
    contrast: 'zh e ch usam a mesma posição retroflexa; ch tem aspiração forte.',
  },
  ch: {
    familyKey: 'retroflex', ipa: '[ʈʂʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Africada retroflexa',
    production: 'Eleve e recue a ponta da língua para a região pós-alveolar e libere a oclusão com uma rajada clara de ar.',
    commonMistake: 'Produzir q/tch muito à frente ou perder a aspiração e aproximar o som de zh.',
    portugueseReference: 'O “tch” de “tchau” pode servir apenas como ponto de partida; no mandarim a língua fica mais recuada.',
    contrast: 'Compare com zh mantendo a língua na mesma posição e mudando a aspiração.',
  },
  sh: {
    familyKey: 'retroflex', ipa: '[ʂ]', aspiration: 'Não se aplica', voicing: 'Surda', manner: 'Fricativa retroflexa',
    production: 'Mantenha a ponta da língua elevada e recuada sem fechar a passagem; deixe o ar produzir fricção contínua.',
    commonMistake: 'Produzir x muito à frente ou curvar a língua de forma exagerada.',
    portugueseReference: 'Lembra o “ch/sh” de algumas palavras, mas a língua fica mais recuada que no português brasileiro típico.',
    contrast: 'Compare sh com x: sh é retroflexo e posterior; x é frontal, com a ponta da língua baixa.',
  },
  r: {
    familyKey: 'retroflex', ipa: '[ɻ] ~ [ʐ]', aspiration: 'Não se aplica', voicing: 'Sonora', manner: 'Aproximante / fricativa retroflexa',
    production: 'Recue e eleve moderadamente a ponta da língua sem criar uma oclusão completa. A voz permanece ativa e a realização pode variar entre aproximante e fricativa.',
    commonMistake: 'Usar o r forte brasileiro, vibrar a língua ou encostar com força no palato.',
    portugueseReference: 'Não existe equivalente estável no português. Alguns sotaques oferecem aproximações, mas é melhor copiar a gravação nativa.',
  },
  z: {
    familyKey: 'dental', ipa: '[ts]', aspiration: 'Não aspirada', voicing: 'Surda', manner: 'Africada',
    production: 'Mantenha a língua muito à frente e faça uma breve oclusão seguida de fricção, com pouco sopro.',
    commonMistake: 'Usar o z sonoro de “zero” ou recuar a língua e aproximar o som de zh.',
    portugueseReference: 'É mais próximo de uma sequência curta “ts/ds” sem sonorização do que do z brasileiro.',
    contrast: 'z e c compartilham a posição anterior; c é fortemente aspirado.',
  },
  c: {
    familyKey: 'dental', ipa: '[tsʰ]', aspiration: 'Aspirada', voicing: 'Surda', manner: 'Africada',
    production: 'Use a mesma posição anterior de z e solte a africada com uma rajada clara de ar.',
    commonMistake: 'Ler c como k/s do português ou produzir aspiração fraca e aproximar o som de z.',
    portugueseReference: 'Lembra “ts” seguido de sopro. A letra c do Pinyin não corresponde ao c ortográfico português.',
    contrast: 'Compare com z sem mover a língua; c deve deslocar muito mais ar.',
  },
  s: {
    familyKey: 'dental', ipa: '[s]', aspiration: 'Não se aplica', voicing: 'Surda', manner: 'Fricativa',
    production: 'Mantenha a ponta baixa e anterior e forme um canal estreito para o ar próximo aos dentes e ao alvéolo, sem oclusão completa.',
    commonMistake: 'Recuar a língua e aproximar s de sh ou deixar a fricção pouco definida.',
    portugueseReference: 'É próximo do s surdo de “sapo”, mas mantenha a língua bem anterior para separar s de sh.',
    contrast: 'Compare s com sh: s é frontal e sem retroflexão; sh é produzido mais atrás.',
  },
}

export const initialPronunciationGuides: Record<string, InitialPronunciationGuide> = Object.fromEntries(
  Object.entries(entries).map(([initial, entry]) => {
    const family = families[entry.familyKey]
    const { familyKey: _familyKey, ...specific } = entry
    return [initial, { initial, ...family, ...specific }]
  }),
)

export function getInitialPronunciationGuide(initial: string): InitialPronunciationGuide | undefined {
  return initialPronunciationGuides[initial]
}

export const pronunciationReferences = [
  {
    label: 'University of Iowa · Mastering Mandarin Sounds',
    url: 'https://pressbooks.uiowa.edu/zheng/back-matter/pinyin-chart-initials/',
  },
  {
    label: 'Ohio State University · Mandarin consonants (IPA)',
    url: 'https://ielp.ehe.osu.edu/files/2022/09/Mandarin_IPA_20220830.pdf',
  },
]
