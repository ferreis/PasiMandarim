# Learning Mandarin

Treinador gratuito de pronúncia e percepção auditiva de mandarim, com foco em Pinyin, tons e contrastes fonéticos.

## Objetivo

Treinar diferenças difíceis de perceber no Pinyin mantendo o máximo possível de variáveis constantes.

Exemplo conceitual:

- `bā` × `pā`
- `bá` × `pá`
- `bǎ` × `pǎ`
- `bà` × `pà`

A ideia é manter **final + tom** e alterar somente a **inicial**. O sistema não cria combinações artificiais apenas para preencher uma tabela: um exercício só é liberado quando existem gravações humanas compatíveis e verificadas para os dois lados.

## Princípios

- Interface em português do Brasil.
- Gratuito e open source.
- Sem dependência obrigatória de serviços pagos.
- Áudio de referência gravado por falantes humanos reais.
- Não usar TTS ou voz gerada por IA como referência de pronúncia.
- Preferir comparações gravadas pelo mesmo falante.
- Não misturar falantes em um par sem deixar isso explicitamente indicado.
- Progresso salvo localmente no navegador.

## Stack inicial

- Vue 3
- Vite
- TypeScript
- HTML Audio API / Web Audio API
- `localStorage`

O MVP não precisa de backend e pode ser hospedado gratuitamente como site estático.

## Contrastes iniciais

- `b × p`
- `d × t`
- `g × k`
- `j × q`
- `z × c`
- `zh × ch`

Depois serão adicionados contrastes de finais como `an × ang`, `en × eng` e `in × ing`.

## Catálogo de áudio humano

O catálogo fica em `src/data/audioCatalog.ts`. Pares disponíveis para treino ficam em `verifiedAudioPairs`; achados que ainda precisam de validação ficam separados em `audioResearchCandidates` e não podem ser reproduzidos pelo treinador.

### Primeiro par verificado

| Contraste | Final | Tom | Som A | Som B | Falante | Origem | Acervo | Licença |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `b × p` | `ian` | 1º | `biān` 边 | `piān` 篇 | Wei Gao | Pequim, China | Shtooka / Wikimedia Commons | CC BY 2.0 FR |

Os dois lados são gravações do mesmo falante. Os créditos indicados pelo Wikimedia Commons/Shtooka são Wei Gao e Vion Nicolas.

Fontes originais:

- `biān`: https://commons.wikimedia.org/wiki/File:Zh-bi%C4%81n.ogg
- `piān`: https://commons.wikimedia.org/wiki/File:Zh-pi%C4%81n.ogg
- licença: https://creativecommons.org/licenses/by/2.0/fr/

### Candidatos ainda bloqueados

Os seguintes pares foram localizados no acervo, mas continuam fora dos exercícios até que os metadados dos dois arquivos sejam confirmados:

- `bǎo × pǎo` — final `ao`, 3º tom;
- `biàn × piàn` — final `ian`, 4º tom;
- `bái × pái` — final `ai`, 2º tom.

## Regras para aceitar um áudio

Cada amostra precisa registrar:

- Pinyin e tom;
- caractere usado na gravação;
- inicial e final;
- URL direta do áudio;
- página original da fonte;
- nome do falante;
- região/origem do falante, quando informada;
- acervo/projeto de origem;
- créditos;
- licença.

Para um par ser marcado como `verified`, os dois áudios devem ter origem humana verificável. A preferência é sempre por **mesmo falante + mesma final + mesmo tom**.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para validar os tipos e gerar a aplicação de produção:

```bash
npm run typecheck
npm run build
```

## Roadmap

1. Expandir o catálogo `b × p` mantendo o mesmo falante sempre que possível.
2. Cobrir os quatro tons onde existirem sílabas e gravações adequadas.
3. Modo de comparação A/B.
4. Modo de identificação cega.
5. Estatísticas locais de acerto por contraste.
6. Expandir para `d/t`, `g/k`, `j/q`, `z/c` e `zh/ch`.
7. Treino de finais.
8. Gravação da voz do estudante para comparação acústica, sem síntese de voz.
