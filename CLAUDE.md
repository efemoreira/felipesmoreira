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

### Endpoints públicos (sem login)

`public/painel/api/inscricao.php` (formulário de `/quero-ajudar`) e
`public/painel/api/presenca.php` (lista de presença dos encontros, o QR da mesa
de recepção) são os **únicos dois** abertos para a internet, e por isso seguem
regras próprias — as mesmas para os dois:

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

`public_html/dados/` é **fechado por padrão**: o `.htaccess` gerado por
`preparar_pastas()` bloqueia `.php` e `.json`, e libera **um único arquivo** —
`agenda.json`, porque a página `/programacao` busca ele no navegador. A ordem
importa: a liberação vem depois do bloqueio, e a última regra que casa é a que
vale.

> **Qualquer arquivo com dado pessoal — telefone, e-mail, endereço, hash de
> senha — deve ser `.php` retornando array** (`var_export`), como
> `usuarios.php`, `inscricoes.php` e `tentativas.php`.

As imagens da agenda (`/dados/imagens/*.jpg`) continuam públicas: a regra é por
extensão e elas não são `.php` nem `.json`.

Ao precisar de um arquivo novo em `/dados` legível pela web, acrescente um
`<Files>` liberando **aquele nome**, nunca afrouxe o bloqueio por extensão.

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

## Visual do painel

O painel usa a **mesma linguagem do site público**: bordas grossas, sombra dura
deslocada, nada arredondado. Militante entra nos dois, e não pode parecer que
trocou de produto.

- **Fontes:** Alfa Slab One (títulos), Special Elite (rótulos, botões, navegação)
  e Bitter (texto). Ficam em `public/painel/fontes/`, servidas do próprio
  domínio — ver o `LEIA-ME.md` de lá para licenças e como atualizar. Não troque
  por CDN de terceiro: a Política de Privacidade promete que nada do visitante
  vai para fora.
- **Ícones:** `public/painel/icones.php`, com os mesmos traçados de
  `src/components/icons.tsx`. Ícone novo entra nos dois para não divergir.
- **Tokens** ficam no `:root` do `painel.css`. Use-os em vez de repetir cor ou
  família na regra — e leia a regra dos temas, logo abaixo, antes de criar um.

### Os três temas

O painel tem **claro, escuro e sistema**. A escolha vive num cookie que o
`layout.php` lê e estampa como `data-tema` no `<html>` **antes** de mandar a
página — é isso, e não JavaScript, que impede a piscada de tema errado. Em
`sistema` não estampa nada e quem decide é o `@media (prefers-color-scheme)`.
O seletor fica no pé da lateral e posta em `public/painel/tema.php`; funciona
sem JavaScript, e com ele troca sem recarregar.

> **Cor nova entra como token definido nos dois temas** (`:root`, o bloco da
> media query e o `[data-tema="escuro"]`). Cor literal dentro de uma regra
> quebra um dos dois lados e ninguém percebe até alguém reclamar.

**O ouro não é cor de texto no tema claro.** `#FFCB05` sobre o papel `#F3ECDA`
dá 1,29:1 de contraste, e a WCAG pede 4,5:1. No claro o ouro é **preenchimento e
borda**; quem escreve é a tinta. Por isso existem tokens separados: `--titulo`,
`--elo` e `--acento` são o ouro no escuro e o ouro escurecido (ou a tinta) no
claro. Escrever `color:var(--ouro)` faz o texto sumir no papel — `--ouro` só
entra em `background` e `border`.

### A navegação

**Mora no `layout.php`, e só lá.** Antes as áreas apareciam numa fileira no topo
*e* repetidas como grade dentro do hub: quem entrava lia o mesmo menu duas vezes
sem saber qual era o menu. Hoje o corpo de cada tela só tem trabalho.

- No computador é uma **lateral fixa**, agrupada por `GRUPOS_NAV`
  (Comunicação · Encontros · Coordenação, o organograma do manual). Início e
  Formação ficam soltos no topo, porque são de todo mundo.
- No celular vira uma **barra fixa no rodapé** com Início, três áreas e "Mais".
  As três saem de uma ordem fixa por pessoa, nunca do contador: barra que se
  reordena sozinha faz errar o alvo já decorado.
- **Área nova precisa entrar em um grupo de `GRUPOS_NAV`**, senão não aparece no
  menu — a permissão sozinha não basta.
- Grupo sem nenhuma área liberada não é renderizado.

**Cuidado com especificidade em cartão:** uma regra como `.mesa span` (0,1,1)
vence `.mesa-icone` (0,1,0) e repinta o ícone. Ao estilizar filhos de um cartão,
escreva o seletor com a classe junto (`.mesa .mesa-icone`) ou mire o filho
direto (`.encontro-texto > span`).

**Fila grande pede recolher:** listas de decisão (como as inscrições) mostram só
o resumo, com o formulário dentro de um `<details class="decidir">`. Com 20
pessoas na fila, formulário aberto para todas vira um paredão impossível de ler.

### Áreas e permissões

O painel usa um único modelo de permissão por "área" (`AREAS` em `sessao.php`).
Uma funcionalidade nova para usuários que já têm conta no painel é **mais uma
área**, não um sistema de auth novo. Adicionar área = 1) chave em `AREAS`,
2) entrada em `DESTINO_AREA` apontando pra página de gestão em PHP, 3) `RewriteRule`
no `publish.yml`, 4) ícone em `icones.php`, 5) endpoint(s) JSON se o Next
precisar consumir os dados, 6) se a área tem fila, um bloco em `agora.php`,
7) entrada em `GRUPOS_NAV` (`layout.php`), senão ela não aparece no menu.

**O que está pendente se declara em `agora.php`, e só lá.** `tarefas_de()` monta a
fila do hub e `contagens_por_area()` alimenta o número ao lado do nome no menu —
os dois saem do mesmo lugar. Não espalhe contador pelo `index.php`: era assim
antes, e o resultado era um painel que sabia dizer onde a pessoa podia ir sem
saber dizer o que estava esperando por ela.

As áreas se dividem em duas naturezas — a distinção não é técnica (a permissão é
a mesma caixa marcada no usuário), é sobre o que vem marcado por padrão:

- **Ferramentas do dia** — `aulas`, `fatos`, `producao`, `eventos`. Listadas em
  `AREAS_FERRAMENTA`. O padrão é liberar todas: ferramenta **não pertence a uma
  função**, e o Olheiro que quiser entender o quadro de Produção deve conseguir
  abrir.
- **Decisão e dado pessoal** — `agenda`, `estudio`, `inscricoes`. O que vai ao
  ar, quem entra no movimento, a lista de contatos com telefone.

**A função da pessoa não limita acesso.** Ela define só o atalho no topo do hub
(`FERRAMENTA_DA_FUNCAO` em `index.php`). O `areas` de cada função no
`funcoes.json` é *sugestão* de marcação na hora de aprovar a inscrição — a
primeira da lista é a que vira o atalho.

### As ferramentas do manual

Três telas que substituem WhatsApp, Trello e planilha. O que cada uma trouxe do
manual para dentro do código:

- **Fatos** (`fatos.php`) — Ficha de Fato e fila da Checagem. Recusa gravar sem
  link de fonte primária, e sem declarar a exceção quando a publicação tem mais
  de 48h. A fila é ordenada do mais antigo para o mais novo, porque a meta é
  "nada dorme sem status".
- **Produção** (`producao.php`) — o quadro. O card **nasce da aprovação do
  fato**, já com fonte e responsável colados; é essa ligação que justifica não
  usar Trello. Publicar exige o link do post e passa pela **regra do ledger**
  (mesmo responsável duas vezes em 48h → avisa e pede ciência; não bloqueia).
  O nome de arquivo `AAAA-MM-DD_tipo_assunto` é gerado, não digitado.
- **Encontros** (`eventos.php`) — as cinco peças com os checklists de
  `checklists.php`, uma lista de pessoas por encontro (e não RSVP + leads
  separados) e o funil D+0/D+3/D+7. Executar pede `eventos`; decidir e ver
  telefone pede `agenda`.

**Ao mexer em slug ou nome de arquivo:** use `sem_acento()` de
`producao-comum.php`, não `iconv('ASCII//TRANSLIT')` — o TRANSLIT depende da
libc e o mesmo texto vira `ha` no Linux da Hostinger e `h` no macOS.

### A formação (área `aulas`)

O manual da militância virou curso: 6 Dias, 32 aulas, cada Dia abrindo com uma
🚗 **Pista Rápida** (o caminho macro) seguida das **Pistas Lentas**
(aprofundamento). Aula nova de reforço entra como `lenta` no Dia certo sem mexer
no caminho principal — foi para isso que a divisão existe.

**A exceção é o Dia 0, que tem duas rápidas:** `como-funciona-a-formacao` explica
a própria divisão em pistas antes de `regras-de-todos` cobrar as regras. Quem cai
ali pela primeira vez precisa saber ler a tela antes de receber a primeira ordem.
E essa explicação é **aula, não rodapé**: o cabeçalho de `/aulas` e o topo do
`aulas.php` só apontam para ela, porque texto repetido em dois lugares é texto que
diverge na terceira alteração — a mesma razão do `checklists.php`.

**O conteúdo mora em `public/painel/aulas-conteudo.php`, não em `src/data/`.**
Esta é a diferença em relação ao `funcoes.json`: aquele é texto de recrutamento,
público por natureza; o manual é documento interno, e num export estático tudo
que entra no bundle é público. O texto sai só pelo `api/aulas.php`, para quem tem
a área. Pelo mesmo motivo `/aulas` **não** usa rota dinâmica por aula
(`generateStaticParams` geraria um HTML público por aula) — o link direto é por
âncora, `/aulas#olheiro`.

**Checklist não se escreve duas vezes.** Os "Pronto quando" ficam em
`public/painel/checklists.php` e são referenciados por id; a aula e a ferramenta
que usa aquela conferência renderizam o mesmo array.

Vídeo é embed de YouTube não-listado (sem custo, e não há problema em o link
circular), pendurado pelo painel — o texto da aula funciona sem ele. O tipo
`FonteVideo` (`src/features/aulas/tipos.ts`) abstrai o provedor: trocar para um
serviço dedicado mexe nesse tipo e no `Player.tsx`, mais nada.

**Fase eleitoral no conteúdo.** O manual em `update/` só descreve a
pré-campanha; o currículo cobre as duas fases. A aula `fases-da-campanha`
(Dia 0) tem a tabela do que muda, e Público, Relacional, Divulgação e Roteirista
dizem o que vale em cada uma. **Escreva sempre "antes da campanha" e "durante a
campanha", nunca a data de virada** — ela muda a cada eleição e o texto datado
envelhece sozinho dentro de uma aula que ninguém relê. A regra fina (horário de
ato, o que cabe num impresso, como uma doação é declarada) fica com a
coordenação de propósito: muda com o calendário e com decisão do juízo
eleitoral.

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
