# Learning Mandarin

Treinador gratuito de pronúncia e percepção auditiva de mandarim, com foco em Pinyin, tons e contrastes fonéticos.

## Objetivo

Treinar diferenças difíceis de perceber no Pinyin mantendo o máximo possível de variáveis constantes.

Exemplo:

- `bā` × `pā`
- `bá` × `pá`
- `bǎ` × `pǎ`
- `bà` × `pà`

A ideia é manter **final + tom** e alterar somente a **inicial**.

## Princípios

- Interface em português do Brasil.
- Gratuito e open source.
- Sem dependência obrigatória de serviços pagos.
- Áudio de referência gravado por falantes humanos reais.
- Não usar TTS ou voz gerada por IA como referência de pronúncia.
- Preferir comparações gravadas pelo mesmo falante.
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

## Áudio

O projeto deverá usar somente gravações com origem e licença verificáveis. A primeira fonte a ser avaliada é o acervo Shtooka/Wikimedia Commons.

Cada arquivo de áudio incorporado deverá registrar, quando disponível:

- fonte;
- falante;
- região/origem do falante;
- licença;
- URL original;
- Pinyin;
- tom.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Roadmap

1. Treinador de contraste de iniciais.
2. Quatro tons por contraste.
3. Modo de comparação A/B.
4. Modo de identificação cega.
5. Integração das gravações humanas licenciadas.
6. Estatísticas locais de acerto por contraste.
7. Treino de finais.
8. Gravação da voz do estudante para comparação acústica, sem síntese de voz.
