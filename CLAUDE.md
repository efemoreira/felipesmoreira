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

Ele usa **Tailwind**, ao contrário do resto do site. As cores, porém, saem de
tokens em `src/app/painel/estudio/estudio.css`, escopados em `#estudio-raiz` e
definidos nos três estados de tema. **Cor cravada na classe**
(`bg-[#14110C]`, `text-white/35`) **quebra um dos temas** — foi o que existia
antes e é o que os tokens resolvem. Exceções de propósito: o ouro em `background`,
`border` e `ring` (funciona nos dois) e o `bg-black/70` dos véus de modal.

**O Estúdio segue o tema do painel, mas o entorno do palco é cinza neutro, não
o papel do cordel.** A percepção de cor muda com o brilho e a temperatura do que
está em volta: sobre o creme quente do painel, a arte pareceria mais fria do que
vai parecer no feed. É por isso que Figma e Canva usam cinza atrás da prancheta.
Ali a identidade é carregada pela **forma** — canto reto, borda grossa, sombra
dura, Special Elite nos rótulos — e não pela cor do papel.

Quem carimba o tema é o `estudio.php`, no `<html>`, antes de servir o HTML do
build — o mesmo truque do `layout.php`, e pelo mesmo motivo: não piscar. Ele
carimba junto um `window.__PAINEL__` com nome, papel e CSRF, que é o que a barra
usa para mostrar quem está logado e ter um Sair que funcione. **As flags
`JSON_HEX_*` do `json_encode` ali não são decoração:** o nome vem do cadastro, e
um `</script>` dentro dele escaparia do bloco.

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

## A candidatura e as propostas

Felipe é **candidato a Vice-Governador do Ceará**, na chapa do **Delegado Huggo
Leonardo**, pelo **Partido Missão**. Como vice, ele **não tem número de urna
próprio** — o voto vai no número do candidato a governador, e a página
`/a-missao` diz isso com todas as letras, porque é a dúvida mais comum.

`/propostas` (`src/features/propostas/`) traz o plano de governo da chapa,
**"Retomar para Reconstruir"**, organizado como o próprio documento: por
compromisso, não por secretaria, cada um respondendo às mesmas seis perguntas
(o que está em jogo · onde queremos chegar · o que vamos fazer · de onde vem o
recurso · quando entrega · como você cobra).

**Todo número traz a página do plano.** Não é capricho de nota de rodapé: a
carta de abertura pede "leiam este plano, guardem este plano e me cobrem este
plano" (p. 2), e é a mesma regra da Parte 0 do manual — fato sem fonte não
entra. Número sem página aqui é o bug.

> ⚠️ **A fonte do conteúdo é uma wiki interna de estratégia**, não um documento
> público. Além das propostas, ela tem seções de *vulnerabilidades*, *ganchos de
> debate*, *silêncios* e *confrontos*, com as respostas prontas para os ataques
> que virão. **Nada disso vai para o site.** Ao atualizar `/propostas`, copie
> apenas proposta, meta, custeio e prazo.

## O kit do mutirão (`/kit`)

A ferramenta que o manual (§5.5) descreve como coordenação manual no WhatsApp.
Cada peça é **um número do plano com a página**, mais o texto pronto pra colar,
mais a arte gerada no canvas — e o botão usa a Web Share API, que no celular
abre o WhatsApp direto com imagem e texto juntos.

`noindex`: é ferramenta de militante, circula por link no grupo. Kit indexado só
serviria pro adversário saber o que vem antes.

**É aqui que a atribuição fecha o ciclo.** O militante digita o nome uma vez (fica
no `localStorage`, não no servidor), e todo link das peças sai com o `?de=<slug>`
— o mesmo campo que `api/inscricao.php` grava desde a inscrição. Sem isso o
alcance existe e ninguém sabe de quem foi.

> O `slugDe()` do `src/features/kit/data.ts` e o `normalizar_origem()` do
> `inscricoes-comum.php` **têm de concordar**. Se um normalizar diferente do
> outro, o mesmo militante vira duas origens no relatório.

### O calendário da eleição

`src/lib/eleicao.ts` é a **fonte única** das datas: a contagem regressiva da
faixa pública e as travas do kit saem dela. Data repetida em dois arquivos é
data que diverge na terceira alteração.

**Tudo é calculado no navegador, nunca no build.** Num export estático a data de
compilação congelaria — no dia 4 de outubro o kit ainda estaria dizendo o que
dizia em agosto, até alguém publicar de novo. Por isso os componentes nascem
vazios no HTML e se preenchem depois; é também o que evita divergência entre o
que o servidor gerou e o que o cliente desenha.

As fases: `campanha` → `reta-final` (últimas 48h, acaba o impulsionamento pago)
→ `votacao` (o kit **fecha as peças**: publicar conteúdo novo de propaganda na
internet é proibido nesse dia) → `depois`. Quem escreve o recado de cada fase é
`src/features/kit/calendario.ts`.

> **A trava mora onde a ação acontece.** Não adianta a regra estar num documento
> se quem vai publicar está no kit, com o botão na mão — é a mesma lógica da
> Parte 0 do manual.

### Em que número votar

`CHAPA.numero` em `src/features/missao/data.ts` guarda o número do candidato a
**governador** (hoje **14**), porque é nele que se vota. Enquanto estiver vazio,
a faixa não fala de voto — é melhor não dizer nada do que deixar um buraco onde
o eleitor espera o número.

**O número é desenhado já no HTML; só a contagem de dias espera o navegador.**
A distinção não é detalhe: o número é a conversão final da campanha, e se ele só
aparecesse depois do JavaScript rodar, o buscador nunca o leria. Já a contagem
*precisa* ser do navegador, senão congela na data em que o site foi publicado.
O primeiro render (o que vira HTML) traz data e número; o efeito só acrescenta
a linha da contagem — servidor e cliente desenham igual na primeira passada, que
é o que evita erro de hidratação.

**A faixa é tinta com ouro, não ouro cheio.** No site inteiro o ouro cheio
significa "aperte aqui", e ela fica logo acima do cartão de entrar no grupo, que
é ouro. Dois blocos dourados empilhados disputam o mesmo clique — e a faixa não
é botão, é carimbo.

### Peça nova sem deploy

As oito peças fixas do kit vêm do plano e não envelhecem, mas o fato da semana
não viraria peça sem um build. `public/painel/kit-comum.php` +
`api/kit.php` resolvem: a coordenação cria a peça pela tela de **Produção**
(dentro da permissão que ela já tem — nenhuma área nova, nenhum `RewriteRule`
novo no `publish.yml`), e o site mescla as publicadas **antes** das fixas.

- **Peça sem fonte não é aceita.** É a Parte 0 aplicada à ferramenta: peça
  circula muito mais longe que um post.
- **`destino` só aceita caminho interno.** URL externa vira `/propostas` — um
  campo de link livre é convite a link colado errado.
- Se a rede falhar, a página continua com as fixas: o mutirão não para por causa
  de um endpoint fora do ar.

**Os traços do cordel no canvas moram em `src/lib/cordelCanvas.ts`** — `escrever`,
`quebrar`, `bloco`, `pilula`, `icone`. Nasceram dentro do `poster.ts` da
programação e mudaram de casa quando o kit passou a desenhar as mesmas peças:
duas cópias do mesmo `bloco()` divergiriam na primeira vez que alguém mexesse na
espessura da borda. O que é próprio de cada peça (fundo, layout, montagem)
continua no arquivo dela.

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
existir em `src/components/icons.tsx`) e pronto — formulário, validação,
sugestão de áreas e a página `/funcoes` seguem sozinhos.

`/funcoes` é o mesmo catálogo em página pública e indexável, com âncora por
função (`/funcoes#olheiro`) para mandar por link. Cada ficha leva para
`/quero-ajudar?funcao=<id>`, que abre o formulário **com ela já marcada** — quem
leu a descrição inteira e decidiu não deve ter que procurar de novo numa lista
de doze. O id é conferido contra o catálogo antes de marcar: parâmetro é texto
que vem de fora.

> **Uma página só, com âncoras, e não uma rota por função.** `/funcoes/olheiro`
> tem dois segmentos, e o `.htaccess` do `publish.yml` só reescreve um
> (`^([^/]+)$ $1.html`) — a rota cairia no fallback e serviria a home. Para ter
> rota aninhada seria preciso mexer no `publish.yml`, que é da lista do "não
> mexer sem perguntar".

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

### O vão entre se inscrever e ser aprovado

É onde mais se perde gente: a pessoa está no pico de entusiasmo que vai ter, e
entre o passo 2 e o 4 ela depende de um humano decidir. Três coisas atacam isso,
e nenhuma delas exige aprovação:

- **A tela de confirmação lidera com o que ela pode fazer agora** — entrar no
  grupo, ler o plano, pegar o kit. O que a coordenação faz vem depois, como
  informação. Antes eram três passos que eram todos ação de outra pessoa.
- **`agora.php` sobe o recado para urgente** quando a inscrição mais antiga
  passa de `HORAS_LIMITE_INSCRICAO` (48h), com o mesmo desenho da fila da
  Checagem.
- **O Dia 0 abre por link de convite** (abaixo).

### O convite do Dia 0

`link_convite()` (em `aulas-comum.php`) monta `/aulas?convite=<token>`, que
libera **só o Dia 0** para quem ainda não tem conta. A coordenação copia o link
na tela `/painel/aulas`.

O token é **derivado do segredo do site**, não guardado: `hash_hmac` de uma
frase fixa com `segredo()`. Não cria arquivo, não some num deploy e não dá para
adivinhar. Apagar `dados/segredo.php` invalida todos os convites de uma vez —
e, de quebra, zera os contadores do teto de envios, o que é inofensivo.

> **A regra de ouro continua valendo:** o conteúdo sai só pelo `api/aulas.php`,
> e nenhuma linha do manual entra no bundle. O convidado recebe um **recorte**
> do currículo pela rede, nunca uma cópia local. O POST de progresso continua
> exigindo login — sem conta não há onde gravar.

### Conferência de origem

`origem_confere()` (em `sessao.php`) é a única cópia da checagem que a
inscrição, a presença e as aulas faziam cada uma por si. **Ela tira a porta dos
dois lados antes de comparar:** `parse_url` devolve host sem porta e
`HTTP_HOST` a traz quando não é a padrão, então comparar cru reprova todo envio
em porta não-padrão. Em produção isso nunca aparece (443 é implícita) — e é por
isso que só seria descoberto tarde.

### De onde a pessoa veio (`origem`)

`/quero-ajudar?de=<slug>` grava a origem na inscrição, e ela aparece na ficha
da fila. Um campo só para as duas perguntas, porque na prática são a mesma:
`?de=joao-silva` diz **quem trouxe**, `?de=live-domingo` diz **por qual canal**.
Sem isso não dá para saber qual militante recruta nem qual link converte.

- **É opcional.** Inscrição sem origem é inscrição válida — recusar por causa
  disso trocaria um militante novo por uma linha de relatório.
- **Vira slug na entrada** (`normalizar_origem()`), senão "João Silva",
  "joao silva" e "JOÃO" viram três origens diferentes no mesmo relatório.
- O formulário guarda o valor em `sessionStorage` enquanto os três passos
  rolam: sem isso, um F5 no passo 2 apagaria o crédito de quem trouxe.

**A origem não é dado de terceiro nem vem de rastreador.** É o que a própria
pessoa trouxe no link que abriu — por isso não há cookie, pixel ou referrer
envolvido, e a Política de Privacidade continua valendo como está.

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

**Ao mexer em slug ou nome de arquivo:** use `sem_acento()` de `sessao.php`
(nasceu no `producao-comum.php`, mudou de casa quando as inscrições passaram a
precisar dela para o slug de origem), não `iconv('ASCII//TRANSLIT')` — o
TRANSLIT depende da libc e o mesmo texto vira `ha` no Linux da Hostinger e `h`
no macOS. No lado JavaScript o equivalente correto é `normalize("NFD")`, que o
Unicode define e que dá o mesmo resultado em qualquer máquina.

**O nome `AAAA-MM-DD_tipo_assunto` é gerado em dois lugares** e os dois têm de
concordar: `nome_de_arquivo()`/`apelido()` em `producao-comum.php` (o card do
quadro) e `nomeArquivo()`/`apelido()` em `src/app/painel/estudio/exportar.ts`
(o PNG que sai do Estúdio). Mexeu num, mexa no outro — senão o Acervo recebe
dois nomes diferentes para a mesma peça.

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
  `Client` (`ProgramacaoClient.tsx`) marca onde `"use client"` começa — e por
  isso **página sem hook não leva o sufixo** (`Missao.tsx`, `Funcoes.tsx`): elas
  são documentos e renderizam no servidor. Ao tirar o `"use client"` de um
  arquivo, renomeie junto, senão o nome passa a mentir.
- Identificadores de código (funções, tipos, arquivos utilitários): também em
  português, seguindo o que já existe (`sessao.ts`, `dados.ts`, `tipos.ts`).

## O que não mexer sem perguntar

- `next.config.ts` (`output: "export"`) e `.github/workflows/publish.yml` —
  mudar isso muda o modelo de hospedagem inteiro.

  > **O `.htaccess` que o `publish.yml` gera tem duas regras que parecem
  > detalhe e não são.** Ambas foram descobertas testando o build com Apache
  > de verdade (`httpd -f`), não lendo o arquivo:
  >
  > 1. **`DirectorySlash Off` + a regra do `.html` antes da de pasta.** Rota
  >    com imagem de compartilhamento própria (`app/propostas/opengraph-image.tsx`)
  >    faz o Next gerar **o `propostas.html` E a pasta `propostas/`**. Sem isso o
  >    mod_dir responde 301 para `/propostas/`, que não tem índice, e a página
  >    cai em 404. Aconteceu com quatro rotas de uma vez.
  > 2. **`immutable` só onde o nome carrega hash** (`/_next/static/`,
  >    `/modelos/`). O `/favicon.ico` não tem hash: com cache de um ano e
  >    `immutable`, quem visitou o site com o ícone antigo continuava vendo o
  >    antigo por um ano — o navegador nem revalida, nem na recarga forçada.
  >
  > 3. **HTML com `no-cache`.** Sem isso ele saía sem `Cache-Control` nenhum e
  >    o navegador aplicava cache heurístico próprio — servindo a versão de
  >    ontem numa campanha que publica todo dia. `no-cache` não é `no-store`:
  >    o navegador guarda a cópia e só é obrigado a conferir antes de usar, o
  >    que devolve **304 sem corpo** quando nada mudou.
  >
  > Ao mexer no `.htaccess`, teste servindo o `out/` com Apache local
  > (`httpd -f`). O `python -m http.server` e o `php -S` **ignoram
  > `.htaccess`** e não pegam nada disso — foi por isso que a quebra das quatro
  > rotas passou por todos os testes anteriores.
- `conceito.html` (protótipo solto na raiz) — parece artefato que valeria
  limpar, mas não foi removido; confirme com o Felipe antes. (A pasta `out/`
  estava listada aqui como versionada: não está, e nunca esteve — é build
  local, ignorado pelo `.gitignore`.)

## Imagens

`public/` inteiro vai para o build sem passar por otimizador: o export estático
obriga `images.unoptimized`, então **o Next não redimensiona nem converte
nada**. O arquivo que você põe ali é o arquivo que o visitante baixa.

Original em resolução cheia mora em `originais/`, que não é publicado. Os
recortes servidos ficam em `public/image/`, e o `originais/LEIA-ME.md` tem os
comandos exatos para refazer cada um.

> O retrato da home já foi um PNG de 4,4 MB desenhando um círculo de 152 px.
> Antes de acrescentar imagem em `public/`, confira o peso — a maioria chega de
> celular, por link de WhatsApp.

**A foto é da home; a marca é dos ícones.** O retrato aparece só no cabeçalho
da home, no `/a-missao` e no `Person.image` do schema. Todo ícone — favicon,
ícone do Android (manifest), ícone do iOS (`apple-icon.png`) — sai da marca das
onças em `src/app/icon.png`. Eram três desenhos diferentes antes: o iOS chegou a
ter um monograma "FM" próprio, que já não existe.

O `maskable` precisa do conteúdo em ~78% da moldura, senão o Android corta as
orelhas ao aplicar a máscara redonda.
