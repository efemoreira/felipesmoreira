# felipesmoreira.com

Site pessoal/institucional de Felipe Moreira (Missão Ceará). Next.js export
estático hospedado na Hostinger, com um app PHP separado cuidando de login e
dados dinâmicos. Este arquivo documenta as decisões de arquitetura para a
próxima fase (usuários reais + aulas em vídeo) não virar um Frankenstein.

## Stack e por quê

- **Next.js 15 (App Router), `output: "export"`.** O site é 100% estático,
  publicado pelo `.github/workflows/publish.yml` num branch `build` que a
  Hostinger serve via Apache. **Não trocamos isso por um servidor Node/Vercel**
  de propósito: já funciona, é grátis, e o site não precisa de SSR.
- **O backend é o app PHP em `public/painel/`.** Login, sessão, usuários e
  dados dinâmicos (agenda, e futuramente aulas) vivem lá — não em `app/api`
  (que não existe, porque não pode existir num export estático). Ver
  `docs/painel.md` para os detalhes operacionais do painel.
- **Tailwind v4** está instalado mas a identidade visual do site (paleta
  "cordel") não usa classes utilitárias — usa tokens de `src/lib/theme.ts`
  aplicados via inline style. Não lute contra isso tentando migrar para
  Tailwind; siga o padrão existente.

## Estrutura de `src/`

```
src/
  app/                # só rotas: page.tsx fino (metadata) + delega pro feature
  features/<nome>/     # lógica + componentes + dados de cada área do site
  components/          # primitivos compartilhados entre features (ex: icons.tsx)
  lib/
    theme.ts            # única fonte de C (paleta) e FONT_ALFA/ELITE/BITTER
    api/                 # cliente para a API JSON do painel PHP
  data/                 # JSON estático versionado (seed de build)
```

**Regra:** `src/app/<rota>/page.tsx` não deve conter lógica de UI nem dados —
só `export const metadata` e um `return <FeatureClient />` importado de
`@/features/<nome>`. Se uma página precisa de estado/efeitos, o componente
que os usa é um `"use client"` dentro de `features/`, nunca direto na rota
(exceção: `src/app/painel/estudio/`, ver nota abaixo).

**Regra:** cor e fonte vêm sempre de `@/lib/theme` (`C`, `FONT_ALFA`,
`FONT_ELITE`, `FONT_BITTER`). Nunca redefina a paleta num componente novo —
isso é exatamente a duplicação que motivou esta reorganização.

**Regra:** dado de conteúdo (arrays de texto, listas, fichas) mora em
`features/<nome>/data.ts`, tipado — não misturado com JSX no componente.

### O Estúdio (`src/app/painel/estudio/`)

É um editor de artes estilo Canva (~10 mil linhas), já organizado
internamente (`camadas/`, `painel/`, tipos próprios). Por ser essencialmente
um produto à parte, ele **não segue** o padrão `features/` — fica onde está.
Não o use como referência para organizar novas páginas simples.

## O contrato Next.js ↔ PHP

O painel expõe endpoints JSON em `public/painel/api/*.php`, além das páginas
HTML administrativas que já existia. Regras para endpoint novo:

1. `require_once __DIR__ . '/../sessao.php';` — reaproveite `usuario_atual()`,
   `pode($area)`, `areas_do_usuario()`. Nunca crie um segundo mecanismo de
   sessão/login.
2. Sempre `Content-Type: application/json` e `Cache-Control: no-store,
   private`.
3. Prefira responder 200 com o estado no corpo (ex: `{"autenticado": false}`)
   a usar status HTTP para erros esperados — simplifica o cliente.
4. No lado Next, toda chamada passa por `@/lib/api/client.ts`
   (`apiFetch`) — não use `fetch` solto para o painel dentro de uma feature.

Endpoint de referência: `public/painel/api/sessao.php` +
`src/lib/api/sessao.ts`.

### Áreas e permissões

O painel usa um único modelo de permissão por "área" (`AREAS` em
`sessao.php`: hoje `agenda`, `estudio`, `aulas`). Uma funcionalidade nova para
usuários que já têm conta no painel é **mais uma área**, não um sistema de
auth novo. Adicionar área = 1) chave em `AREAS`, 2) entrada em
`DESTINO_AREA` apontando pra página de gestão em PHP, 3) endpoint(s) JSON
correspondentes se o Next precisar consumir os dados.

### Vídeo das aulas

Aulas usam embed de YouTube não-listado (decisão: sem custo, sem problema o
link circular). O tipo `FonteVideo` (`src/features/aulas/types.ts`) abstrai
o provedor — se um dia trocar para um serviço de streaming dedicado, só esse
tipo e o componente de player mudam.

## Convenção de nomes

- Rotas e conteúdo: **português** (`/programacao`, `/herois-do-ceara`,
  `/aulas`), consistente com o público do site. Nos componentes, o sufixo
  `Client` (`ProgramacaoClient.tsx`) marca onde `"use client"` começa.
- Identificadores de código (funções, tipos, arquivos utilitários): também em
  português, seguindo o que já existe (`sessao.ts`, `dados.ts`, `tipos.ts`).

## O que não mexer sem perguntar

- `next.config.ts` (`output: "export"`) e `.github/workflows/publish.yml` —
  mudar isso muda o modelo de hospedagem inteiro.
- `conceito.html` (protótipo solto na raiz) e a pasta `out/` versionada —
  parecem artefatos que valeria limpar, mas não foram removidos nesta
  reorganização; confirme com o Felipe antes.
