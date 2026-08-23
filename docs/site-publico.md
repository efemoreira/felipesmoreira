# Site público

## Arquitetura-base

- Next.js 15 App Router com `output: "export"`.
- Hospedagem estática via Apache/Hostinger.
- Backend dinâmico fora do App Router, em `public/painel/`.
- Tailwind v4 existe, mas a identidade principal sai de `src/lib/theme.ts`.

## Estrutura de `src/`

```text
src/
  app/                rotas finas
  features/<nome>/    UI, fluxo, estado e conteúdo por área
  components/         primitivas compartilhadas
  lib/                tema, helpers e clientes de API
  data/               JSON estático versionado
```

Regras:

- `src/app/<rota>/page.tsx` só faz metadata + delegação.
- Estado e efeitos ficam em `features/`.
- Conteúdo tipado pode morar em `features/<nome>/data.ts`.
- O Estúdio é exceção: é um produto à parte em `src/app/painel/estudio/`.

## Tema e tokens

- Fonte única: `src/lib/theme.ts`.
- Use `C`, `FONT_ALFA`, `FONT_ELITE`, `FONT_BITTER`, `BORDA`/`borda()` e `TEXTO`.
- Não escreva `3px solid` à mão.
- A sombra dura ainda não tem token global; isso segue como decisão visual.

## Frentes públicas principais

### Missão, propostas e número

- Felipe é vice, então o voto vai no número do titular.
- A faixa pública mostra número e data; a explicação vive em `/amissao`.
- Em `/propostas`, número sem página do plano é bug.

### Munição

- `/municao` é ferramenta de circulação por link, sem indexação.
- Atribuição usa `?de=<slug>`.
- Os nomes internos `kit-*` continuam por compatibilidade.

### Programação

- A agenda pública é derivada dos encontros do painel.
- Toda conta de tempo sai de `inicio`, nunca de `data`.
- `estadoDe()` (TS) e `estado_do_evento()` (PHP) têm de concordar.

### Funções

- `src/data/funcoes.json` é a fonte única dos papéis da militância.
- `/funcoes` é catálogo público com âncoras.
- `/queroajudar?funcao=<id>` abre o formulário com a função marcada.

### Candidatos

- Candidato e lista são coisas diferentes.
- A colinha respeita a ordem da lista.
- O site exibe o rótulo do cargo vindo do PHP, não replica a tabela em TS.

## Fluxos públicos

### Inscrição

- Fluxo crítico de entrada da militância.
- A tela ajuda mais do que o servidor exige; o servidor aceita mais do que a UI pede.
- O rascunho usa `sessionStorage` (`CHAVE_RASCUNHO`).

### Presença

- Dois tokens: confirmação e presença na porta.
- O fluxo reaproveita a mesma régua de validação da inscrição.
- A passagem para `/queroajudar` envia dados por `sessionStorage`, nunca por querystring.

## Responsividade

- `html { overflow-x: clip }` em `src/app/globals.css` trava rolagem horizontal global.
- Inputs públicos ficam com mínimo de 16 px para não disparar zoom no Safari.
- A frente ainda aberta está menos na navegação e mais no excesso de `style={{...}}` e no desenho de listas/tabelas em mobile.

## Imagens

- `public/` vai para o build sem otimização do Next.
- Verifique peso antes de colocar imagem nova em `public/`.
- Originais ficam em `originais/`.