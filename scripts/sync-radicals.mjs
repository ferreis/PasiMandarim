import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const SOURCE_REV = '4abfad3fb256049481825f81ac64d5713e3ee31d'
const SOURCE_REPO = 'bluegreenstone/hanzi-project'
const RAW_BASE = `https://raw.githubusercontent.com/${SOURCE_REPO}/${SOURCE_REV}`
const OUTPUT_FILE = resolve('src/data/generatedRadicals.ts')

const PT_GLOSSES = [
  '',
  'um', 'linha vertical', 'ponto', 'traço inclinado', 'segundo', 'gancho', 'dois', 'tampa', 'pessoa', 'pernas',
  'entrar', 'oito', 'caixa aberta para baixo', 'cobertura', 'gelo', 'mesa', 'caixa aberta', 'faca', 'força', 'embrulhar',
  'colher', 'caixa aberta à direita', 'esconderijo / cercado', 'dez', 'adivinhação', 'selo', 'penhasco', 'privado', 'novamente', 'boca',
  'cercado', 'terra', 'erudito', 'ir', 'andar devagar', 'noite', 'grande', 'mulher', 'criança', 'teto',
  'polegada', 'pequeno', 'coxo', 'cadáver', 'broto', 'montanha', 'rio', 'trabalho', 'si mesmo', 'pano / turbante',
  'seco', 'fio curto', 'penhasco pontilhado', 'passada longa', 'duas mãos', 'atirar', 'arco', 'focinho', 'pelos / cerdas', 'passo',
  'coração', 'alabarda', 'porta', 'mão', 'ramo', 'bater', 'escrita', 'concha de medida', 'machado', 'quadrado / direção',
  'não', 'sol', 'dizer', 'lua', 'árvore / madeira', 'faltar', 'parar', 'morte', 'arma', 'não fazer',
  'comparar', 'pelo', 'clã', 'vapor', 'água', 'fogo', 'garra', 'pai', 'linhas cruzadas', 'madeira partida',
  'fatia', 'presa / dente', 'boi', 'cão', 'profundo / misterioso', 'jade', 'melão', 'telha', 'doce', 'vida / nascer',
  'usar', 'campo', 'rolo de tecido', 'doença', 'passos', 'branco', 'pele', 'recipiente', 'olho', 'lança',
  'flecha', 'pedra', 'altar / espírito', 'rastro', 'cereal', 'caverna', 'ficar em pé', 'bambu', 'arroz', 'seda',
  'jarro', 'rede', 'ovelha', 'pena', 'velho', 'e / barba', 'arado', 'orelha', 'pincel', 'carne',
  'ministro', 'si mesmo', 'chegar', 'pilão', 'língua', 'opor-se', 'barco', 'parar', 'cor', 'erva / planta',
  'tigre', 'inseto', 'sangue', 'andar', 'roupa', 'oeste', 'ver', 'chifre', 'fala', 'vale',
  'feijão', 'porco', 'texugo / besta', 'concha / dinheiro', 'vermelho', 'correr', 'pé', 'corpo', 'carro', 'amargo',
  'manhã', 'caminhar', 'cidade', 'vinho', 'distinguir', 'aldeia', 'metal / ouro', 'longo', 'portão', 'colina',
  'escravo', 'pássaro de cauda curta', 'chuva', 'azul / verde', 'errado', 'rosto', 'couro', 'couro curtido', 'alho-poró', 'som',
  'cabeça / página', 'vento', 'voar', 'comida / comer', 'cabeça', 'fragrância', 'cavalo', 'osso', 'alto', 'cabelo longo',
  'lutar', 'vinho sacrificial', 'caldeirão', 'fantasma', 'peixe', 'pássaro', 'sal', 'veado', 'trigo', 'cânhamo',
  'amarelo', 'painço', 'preto', 'bordado', 'sapo', 'tripé', 'tambor', 'rato', 'nariz', 'uniforme / alinhado',
  'dente', 'dragão', 'tartaruga', 'flauta',
]

const PT_NOTES = {
  9: 'Representa pessoa ou ser humano. A variante 亻 aparece com frequência à esquerda de caracteres relacionados a pessoas, papéis ou ações humanas.',
  18: 'Representa faca ou corte. A forma lateral 刂 costuma aparecer à direita e frequentemente participa de caracteres ligados a cortar, dividir ou separar.',
  30: 'Representa a boca ou uma abertura. É comum em caracteres ligados à fala, sons, alimentação e ações realizadas com a boca.',
  32: 'Representa terra ou solo. Pode aparecer em caracteres ligados a terreno, lugares, construção e propriedades físicas do solo.',
  38: 'Representa mulher. Historicamente aparece em muitos caracteres relacionados a parentesco, papéis sociais e conceitos associados ao feminino; alguns usos refletem valores de épocas antigas.',
  40: 'Representa teto ou cobertura. Em caracteres compostos costuma sugerir ideias relacionadas a casa, interior, abrigo ou espaços cobertos.',
  61: 'Representa o coração e, por extensão, emoções, pensamentos e estados mentais. A variante 忄 é muito frequente no lado esquerdo.',
  64: 'Representa a mão. A variante 扌 aparece em muitos verbos e ações físicas realizadas com as mãos.',
  72: 'Representa o sol e pode participar de caracteres relacionados a luz, tempo, dias, calor e brilho.',
  74: 'Representa a lua. Dependendo do caractere, a forma 月 também pode estar historicamente relacionada ao radical carne 肉, por isso nem todo 月 interno significa “lua”.',
  75: 'Representa árvore e madeira. É comum em caracteres associados a plantas lenhosas, objetos de madeira e materiais derivados.',
  85: 'Representa água e líquidos. A forma lateral 氵, chamada frequentemente 三点水 (sān diǎn shuǐ), aparece em muitos caracteres ligados a líquidos, rios e estados da água.',
  86: 'Representa fogo, calor ou combustão. A variante 灬 costuma aparecer na parte inferior de caracteres.',
  93: 'Representa boi ou gado. A variante 牜 aparece à esquerda em vários caracteres relacionados a animais bovinos e criação.',
  94: 'Representa cão. A variante 犭 aparece à esquerda e participa de muitos nomes de animais e caracteres historicamente associados a animais.',
  96: 'Representa jade. Quando aparece como 王 em componentes, o contexto histórico pode indicar jade e não necessariamente “rei”.',
  102: 'Representa campo cultivado. É comum em caracteres ligados a agricultura, parcelas de terra e espaços divididos.',
  109: 'Representa olho e participa de caracteres ligados a visão, aparência e ações de observar.',
  113: 'Relaciona-se historicamente a altar, culto e manifestações espirituais. A variante 礻 aparece à esquerda de muitos caracteres ligados a rituais, religião e auspícios.',
  118: 'Representa bambu. A forma ⺮ no topo é frequente em caracteres ligados a objetos tradicionalmente feitos de bambu, escrita e utensílios.',
  120: 'Representa seda ou fio. A forma simplificada 纟 aparece em caracteres relacionados a tecido, fios, ligação e continuidade.',
  130: 'Representa carne. Quando usado como componente lateral, frequentemente assume a forma 月; nesses casos o sentido costuma estar ligado ao corpo e não à lua.',
  140: 'Representa vegetação e plantas. A forma 艹 aparece no topo de muitos caracteres relacionados a plantas, flores, ervas e produtos vegetais.',
  142: 'Tradicionalmente representa insetos ou pequenos animais. Em caracteres antigos seu campo semântico pode ser mais amplo do que o português moderno “inseto”.',
  145: 'Representa roupa ou vestimenta. A variante 衤 aparece à esquerda de caracteres ligados a roupas, tecidos e ações de vestir.',
  149: 'Representa fala, palavras e linguagem. A forma simplificada 讠 aparece em muitos caracteres ligados a comunicação, opinião e discurso.',
  154: 'Representa concha. Conchas foram usadas como objetos de valor na China antiga, por isso o radical aparece em muitos caracteres ligados a dinheiro, comércio e riqueza.',
  162: 'Representa movimento ou deslocamento. A variante 辶 é muito comum em caracteres relacionados a caminhar, caminhos, distância e movimento.',
  163: 'Representa cidade ou assentamento. Sua variante 阝 aparece normalmente à direita; ela não deve ser confundida com a forma lateral do radical 阜, que costuma aparecer à esquerda.',
  167: 'Representa metal ou ouro. A forma simplificada 钅 aparece em caracteres relacionados a metais, ferramentas e objetos metálicos.',
  169: 'Representa portão ou porta de entrada. A forma simplificada 门 é muito frequente em caracteres ligados a entradas, espaços fechados e ações envolvendo portas.',
  170: 'Representa colina ou elevação. A variante 阝 costuma aparecer à esquerda; visualmente é igual à variante de 邑, mas sua posição ajuda a distinguir a origem.',
  173: 'Representa chuva e fenômenos atmosféricos. É comum no topo de caracteres ligados a clima, nuvens, neve, trovão e precipitação.',
  184: 'Representa comida ou o ato de comer. A variante 饣 aparece em caracteres ligados a alimentação, refeições, fome e bebidas.',
  187: 'Representa cavalo. A forma simplificada 马 aparece em caracteres relacionados a cavalos e também como componente fonético em muitos caracteres.',
  195: 'Representa peixe. A forma simplificada 鱼 aparece em nomes de peixes e caracteres ligados a animais aquáticos.',
  196: 'Representa pássaro. A forma simplificada 鸟 aparece em muitos nomes de aves e caracteres relacionados a pássaros.',
}

function codepointToChar(value) {
  if (typeof value !== 'string' || !value.startsWith('U+')) return ''
  return String.fromCodePoint(Number.parseInt(value.slice(2), 16))
}

function normalizeVariants(variants = []) {
  return variants
    .map((variant) => typeof variant === 'string' ? variant : variant?.char ?? variant?.character ?? '')
    .filter(Boolean)
}

function historicalForms(record) {
  const forms = record.historical_forms ?? {}
  const result = []
  if (forms['oracle_bone_甲骨文']?.length) result.push('oracle')
  if (forms['bronze_金文']?.length) result.push('bronze')
  if (forms['shuowen_seal_說文解字']?.length) result.push('seal')
  if (forms['liushutong_六書通']?.length) result.push('liushutong')
  return result
}

function genericExplanation(number, meaningPt, forms) {
  const history = forms.length
    ? ' Há formas históricas verificadas no acervo para acompanhar a evolução gráfica deste radical.'
    : ' O acervo atual não possui uma forma histórica aprovada para este radical.'
  return `Radical Kangxi nº ${number}, associado ao campo de sentido “${meaningPt}”. Como radical, ele funciona principalmente como chave de classificação e pode sugerir uma relação semântica, mas essa relação não é uma regra absoluta.${history}`
}

async function fetchRadical(number) {
  const url = `${RAW_BASE}/radicals/${number}.json`
  const response = await fetch(url, { headers: { 'user-agent': 'pasi-mandarim-radicals-sync' } })
  if (!response.ok) throw new Error(`Falha ao baixar radical ${number}: HTTP ${response.status}`)
  return response.json()
}

async function fetchAllRadicals() {
  const result = []
  const batchSize = 12
  for (let start = 1; start <= 214; start += batchSize) {
    const numbers = Array.from({ length: Math.min(batchSize, 215 - start) }, (_, index) => start + index)
    const batch = await Promise.all(numbers.map(fetchRadical))
    result.push(...batch)
  }
  return result
}

function transform(record) {
  const number = record.kangxi_number
  const meaningPt = PT_GLOSSES[number]
  if (!meaningPt) throw new Error(`Tradução PT-BR ausente para o radical ${number}`)

  const forms = historicalForms(record)
  const primaryPinyin = record.readings?.pinyin?.find((entry) => entry.context === 'primary')?.reading
    ?? record.readings?.pinyin?.[0]?.reading
    ?? ''

  return {
    number,
    character: record.primary?.char ?? '',
    radicalCharacter: record.radical_block?.char ?? record.primary?.char ?? '',
    variants: normalizeVariants(record.variants),
    strokes: record.stroke_count ?? 0,
    pinyin: primaryPinyin,
    zhuyin: record.readings?.zhuyin?.[0] ?? '',
    meaningPt,
    meaningEn: record.english_definition ?? record.definitions?.[0]?.gloss ?? record.names?.en?.[0] ?? '',
    explanationPt: PT_NOTES[number] ?? genericExplanation(number, meaningPt, forms),
    historicalForms: forms,
    exampleCharacters: (record.example_characters ?? []).slice(0, 8).map(codepointToChar).filter(Boolean),
    sourceUrl: `https://github.com/${SOURCE_REPO}/blob/${SOURCE_REV}/radicals/${number}.json`,
  }
}

async function main() {
  console.log('Baixando os 214 radicais Kangxi de uma revisão fixada do Hanzi Project...')
  const sourceRecords = await fetchAllRadicals()
  const radicals = sourceRecords.map(transform).sort((a, b) => a.number - b.number)

  if (radicals.length !== 214) {
    throw new Error(`Catálogo incompleto: esperado 214, recebido ${radicals.length}`)
  }

  const output = `import type { MandarinRadical } from '../types/radical'\n\n// Gerado por scripts/sync-radicals.mjs. Não editar manualmente.\nexport const generatedRadicals: MandarinRadical[] = ${JSON.stringify(radicals, null, 2)}\n`
  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await writeFile(OUTPUT_FILE, output, 'utf8')

  const withHistory = radicals.filter((radical) => radical.historicalForms.length).length
  console.log(`Catálogo gerado: ${radicals.length} radicais; ${withHistory} com formas históricas referenciadas.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
