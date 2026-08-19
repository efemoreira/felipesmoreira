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

### Endpoint público (sem login)

`public/painel/api/inscricao.php` é o único aberto para a internet, e por isso
segue regras próprias:

- **CSRF não serve aqui.** O cookie de sessão tem `path=/painel` e
  `SameSite=Strict`, e visitante anônimo não tem sessão nenhuma. O que protege
  é: armadilha (honeypot), teto de envios por visitante, conferência de
  `Origin` e checagem de duplicado.
- **O teto usa IP embaralhado, não IP.** `chave_visitante()` faz HMAC do IP com
  um segredo do site (`dados/segredo.php`, criado sozinho). Dá para contar
  tentativas sem guardar endereço, que é dado pessoal.
- **Erro de robô não é explicado.** Honeypot preenchido responde `{"ok":true}`
  e descarta em silêncio — dizer a verdade ensina o robô a contornar.

### Onde guardar dado pessoal

`public_html/dados/` tem um `.htaccess` que bloqueia **só** arquivos `.php` —
`.json` de lá é baixável pela web de propósito (a página `/programacao` busca
`agenda.json`). Então:

> **Qualquer arquivo com dado pessoal — telefone, e-mail, endereço — tem que
> ser `.php` retornando array** (`var_export`), como `usuarios.php` e
> `inscricoes.php`. Um `.json` ali vaza para qualquer um com o link.

## Funções da militância

`src/data/funcoes.json` é a lista canônica dos papéis do movimento (Olheiro,
Roteirista, Design…), com resumo, entrega, ritmo e passo a passo em linguagem
de recrutamento — o texto vem de `update/Manual-da-Militancia.md`, traduzido do
jargão interno.

Uma fonte só para os dois lados: o Next importa no build (formulário
`/quero-ajudar`) e o PHP lê o mesmo arquivo (`out/funcoes.json`, copiado pelo
`publish.yml`) para validar o que chega e sugerir as áreas na aprovação.

**Não confunda `funcoes` com `areas`:** `funcoes` é o papel da pessoa no
movimento; `areas` é permissão de tela no painel. O `areas` de cada função vive
no próprio `funcoes.json`.

**Ao acrescentar função nova:** entre no `funcoes.json` (o `icone` precisa
existir em `src/components/icons.tsx`) e pronto — formulário, validação e
sugestão de áreas seguem sozinhos.

## Fluxo de entrada de militante

1. Pessoa preenche `/quero-ajudar` (3 passos, com consentimento LGPD).
2. `api/inscricao.php` valida e grava em `dados/inscricoes.php` com status
   `nova`. **Não cria conta** — o formulário é público.
3. Coordenação abre `/painel/inscricoes`, confere e aprova.
4. A aprovação cria o usuário com `trocarSenha = true` e mostra a senha
   provisória **uma vez**, com um botão que abre o WhatsApp da pessoa com a
   mensagem pronta.
5. `exigir_login()` prende quem entra em `conta.php` até definir a própria
   senha — isso já existia e não precisou de código novo.

O consentimento fica registrado no cadastro (`consentimentoEm`,
`consentimentoVersao`). Ao mudar o texto de LGPD do formulário, suba
`VERSAO_CONSENTIMENTO` em `public/painel/inscricoes-comum.php`.

## Responsividade

O site inteiro precisa funcionar bem em celular — é de onde vem a maioria, por
link de WhatsApp. O que já está resolvido e não deve regredir:

- `globals.css` tem `html { overflow-x: clip }` (trava global contra rolagem
  horizontal) e força `font-size` mínimo de 16px em campos de formulário —
  abaixo disso o Safari do iPhone dá zoom sozinho ao focar.
- Alvo de toque mínimo de **44px** em botão, link de navegação e campo.
- O layout declara `color-scheme: dark`; página de fundo claro precisa declarar
  `color-scheme: light` no container, senão o navegador desenha caixa de seleção
  e `<select>` em tema escuro.
- `public/painel/painel.css`: ao acrescentar um `type` de input novo, inclua no
  seletor de estilo (linha dos `input[type=...]`) — type fora da lista vira
  caixa branca no fundo escuro. E **suba `VERSAO_ESTILO` em `layout.php`**, que
  o `.htaccess` põe cache imutável de 1 ano em `.css`.

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
