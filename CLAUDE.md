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

`public/painel/api/inscricao.php` (formulário de `/queroajudar`) e
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
`/amissao` diz isso com todas as letras, porque é a dúvida mais comum.

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

## A Munição (`/municao`)

A ferramenta que o manual (§5.5) descreve como coordenação manual no WhatsApp.
Cada peça é **um número do plano com a página**, mais o texto pronto pra colar,
mais a arte gerada no canvas — e o botão usa a Web Share API, que no celular
abre o WhatsApp direto com imagem e texto juntos.

`noindex`: é ferramenta de militante, circula por link no grupo. Lista indexada
do que vem por aí só serviria pro adversário.

> **Chamava-se "kit" e virou "Munição".** A rota antiga `/kit` continua
> respondendo, por `RewriteRule ... [R=301,L,QSA]` — o link circula em grupo de
> WhatsApp desde antes. Os ARQUIVOS continuam com o nome antigo de propósito:
> `kit-comum.php`, `api/kit.php` e `dados/kit.php` são contrato interno e
> arquivo em produção, e renomeá-los é risco sem ganho.

**É aqui que a atribuição fecha o ciclo.** O militante digita o nome uma vez (fica
no `localStorage`, não no servidor), e todo link das peças sai com o `?de=<slug>`
— o mesmo campo que `api/inscricao.php` grava desde a inscrição. Sem isso o
alcance existe e ninguém sabe de quem foi.

> O `slugDe()` de `src/lib/atribuicao.ts` e o `normalizar_origem()` do
> `inscricoes-comum.php` **têm de concordar**. Se um normalizar diferente do
> outro, o mesmo militante vira duas origens no relatório.
>
> Ele morava em `features/kit/data.ts`. Mudou de casa quando a inscrição e a
> presença passaram a precisar dele: importá-lo de lá arrastava as oito peças
> fixas do plano para o bundle do `/presenca`, que é aberto em pé, na porta do
> encontro. Medido — o texto das peças estava mesmo no chunk da página.

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

### Os candidatos e a colinha (`/candidatos`)

**Duas coisas separadas, e é a separação que importa:**

- o **candidato** é um cadastro simples — quem é, que número tem, qual o @, e uma
  foto opcional. Rápido, sem decisão nenhuma junto;
- a **lista** é curadoria — um nome ("Deputados federais", "As mulheres da
  chapa", "Os que eu apoio") e quem entra nela. É a lista que vira colinha.

> A primeira versão tinha grupos fixos marcados no próprio candidato
> (`federais`, `mulheres`, `escolhidos`) e estava errada nos dois lados:
> obrigava a classificar na hora de cadastrar, quando o que se quer é só
> registrar o número certo; e engessava as listas em categorias decididas no
> código, quando **lista é conteúdo de campanha e muda toda semana**.

`api/candidatos.php` entrega os dois juntos — pedir as listas num segundo
endpoint faria a página piscar duas vezes no 4G de quem abriu na fila.
`/candidatos` desenha e gera a colinha (`src/features/candidatos/colinha.ts`,
com os traços de `cordelCanvas.ts`).

- **Não é lista no código.** Nome de urna e número saem do registro no TSE e
  mudam até a véspera; lista no repositório é lista que exige um deploy para
  corrigir um dígito.
- **Sem número não cadastra.** Colinha com número errado é pior que colinha
  nenhuma. Nome e número são os únicos obrigatórios — cargo, partido, @ e foto
  não travam o cadastro.
- **A ordem da lista é a ordem da colinha.** Não é alfabética: quem vem primeiro
  é quem se quer que seja lembrado primeiro.
- **Recolher um candidato tira ele de todas as listas de uma vez.** A limpeza é
  na saída (`listas_publicadas()`), não na gravação — quem recolhe não deveria
  ter que lembrar de editar cinco listas, e republicar devolve a todas.
- **Uma lista vai para a home** (`naHome`), e só uma: a home é a página onde o
  visitante tem menos paciência. Marcar a segunda desmarca a primeira em vez de
  recusar — quem clicou já decidiu.
- **Sem lista publicada, o bloco da home não aparece.** Mesmo padrão de
  `CHAPA.numero`: melhor não dizer nada do que deixar um buraco onde o eleitor
  espera um número.

> **A trava do TSE mora no botão.** Compartilhar arte com número é propaganda:
> no dia da votação o botão fecha (publicar propaganda nova na internet é
> proibido) e depois da eleição também. **A lista continua visível nos dois
> casos** — consultar não é publicar, e quem abrir a página no domingo precisa
> achar o número. Mesma `faseEm()` de `src/lib/eleicao.ts` que a Munição usa.

### Em que número votar

`CHAPA.numero` em `src/features/missao/data.ts` guarda o número que se digita na
urna — **14, o mesmo para presidente e para governador**. Um campo só, porque é
um número só: o vice não tem número próprio. Enquanto estiver vazio, a faixa não
fala de voto — é melhor não dizer nada do que deixar um buraco onde o eleitor
espera o número.

**A faixa é carimbo, não explicação.** Ela diz o número e a data, e mais nada;
quem explica que o vice não tem número de urna é `/amissao`, que existe para
isso. Texto de esclarecimento repetido dentro da faixa disputa espaço com o
número, que é a única coisa que precisa ser lida de longe.

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

As oito peças fixas vêm do plano e não envelhecem, mas o fato da semana não
viraria peça sem um build. `public/painel/kit-comum.php` + `api/kit.php`
resolvem: a coordenação cria a peça em **`/painel/municao`**, e o site mescla as
publicadas **antes** das fixas.

> Isto já morou dentro do quadro de Produção, num `<details>` no meio das quatro
> colunas — a ferramenta mais usada do movimento escondida atrás de um triângulo,
> numa tela que fala de outra coisa. Virou área própria (`municao`, em
> `AREAS_FERRAMENTA`), com nome próprio, no grupo Comunicação do menu.

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

## A agenda (`/programacao`)

**Um encontro se cadastra UMA vez.** A coordenação marca em `/painel/eventos`, e
`dados/agenda.json` é **gerado** dali a cada gravação; o visitante recebe o JSON
pela rede — é a única página do site cujo conteúdo muda sem deploy.

Eram duas metades que não se conheciam: a mesma live era digitada em
`/painel/agenda` (com data própria, para o site) e cadastrada de novo em
`/painel/eventos` (com outra data, para as cinco peças e a presença). Duas fichas
para a mesma coisa é duas datas que divergem na terceira alteração.

- **`naAgenda` no encontro, padrão `true`.** O normal é o encontro ser público; a
  exceção — reunião fechada, jantar com liderança — é quem desmarca. Padrão
  invertido faria a coordenação cadastrar e o encontro não aparecer, sem ninguém
  entender por quê.
- **A live é um encontro da família `digital`.** O formulário troca `local` e
  `endereco` por `plataforma` e `link`.
- **`agenda.php` ficou com a capa** (título, período, chamada, canais) e a lista
  em modo leitura, apontando para cada encontro. Ela também tem o botão de
  importação única da agenta antiga, que aparece só enquanto sobrar item sem
  encontro.
- **`item_publico()` é lista de permissão, não de bloqueio.** O `agenda.json` é
  o único arquivo de `/dados` liberado à web: campo que caia nele fica aberto na
  internet. Enumerar o que SAI garante que um campo novo no encontro nunca vaze
  por esquecimento. Por isso `local` sai (é o nome público do lugar) e `endereco`
  não (pode ser a casa de alguém), junto com `orcamento`, `observacoes`,
  `responsaveis` e `publicoEsperado`.
- **Publica ao gravar, não por botão.** Editar o encontro já exige coordenação —
  não há revisão a mais para fazer, e "esqueci de publicar" deixa de existir.

> **`estado_do_evento()` (PHP, em `agenda-comum.php`) e `estadoDe()` (TS, em
> `programacao/tempo.ts`) têm de concordar,** inclusive no
> `DURACAO_PADRAO_MIN = 120`. Se divergirem, o painel diz que o encontro acabou
> enquanto o site ainda mostra "AO VIVO". Mesmo pacto de `slugDe()` ↔
> `normalizar_origem()`.

> **`agenda-comum.php` existe porque `agenda.php` faz `exigir_area('agenda')` na
> primeira linha** — nada mais no painel conseguia usar o relógio, as cores nem
> o caminho de imagem que moravam lá dentro. Segue a convenção dos outros
> `*-comum.php`: só define, e quem inclui decide se exige login.

**Dois campos na tela, UM instante no arquivo.** Quem marca o encontro pensa
"sábado, 9 da manhã" — são um `<input type="date">` e um `<input type="time">`,
e no celular o primeiro abre um calendário de verdade, que o `datetime-local`
não abre em todo aparelho. `inicio_de_dia_e_hora()` junta os dois na gravação.

**O que não muda é o que fica guardado:** um `inicio` só, ISO com fuso fixo do
Ceará
(`2026-10-04T19:00-03:00`); `dia`, `data` e `hora` saem dele na hora de gravar e
continuam no JSON porque o pôster e o cartão os desenham. Antes eram três
campos de texto digitados à mão — `"29/07"`, sem ano, e `"19H"` — e por isso a
página não conseguia ordenar, não conseguia esconder o que passou, e o "AO VIVO"
era uma caixa marcada à mão que ficava acesa para sempre. Havia uma no ar treze
dias depois da live.

> **Formate sempre com `DateTimeZone('America/Fortaleza')`,** nunca com `date()`
> puro: o PHP da Hostinger roda em UTC e um evento das 19h aparecia como **22H**.
> `partes_de_exibicao()` em `agenda.php` é a única cópia dessa conversão.

**O relógio da página fica em `src/features/programacao/tempo.ts`** — `estadoDe`,
`estaAoVivo`, `emOrdem`, `idEmDestaque`, `quantosPassaram`. Um evento "acontece"
por `DURACAO_PADRAO_MIN` (120) minutos depois de começar, porque a coordenação
marca quando começa e ninguém volta ao painel para dizer que acabou.

- **`aoVivo` sozinho não acende nada.** O selo pede a marca manual **e** a janela
  de tempo: só a marca é o que produziu o fantasma; só o relógio marcaria como
  transmissão um jantar fechado.
- **O que passou fica na lista, apagado.** Sumir com o evento faz quem chegou
  atrasado achar que errou o link; o rodapé diz quantos foram.
- **`agora` começa `null` e só é preenchido no efeito.** Num export estático o
  HTML é gravado no dia do build — desenhar estado de tempo no servidor
  congelaria "É o próximo" no evento errado e ainda quebraria a hidratação.
- **O JSON-LD `Event` só sai para evento futuro** e também só no cliente, pela
  mesma razão. Google recusa `Event` sem `startDate` — era essa falta, e não o
  schema, que bloqueava.

**A hora pode ficar em branco** — o dia já ordena, e o cartão simplesmente não
mostra horário. Meia-noite em ponto é como isso fica gravado, e é por isso que
`normalizar_evento()` trata `0H` como "hora ainda não definida": anunciar um
encontro à meia-noite seria pior que não anunciar hora nenhuma.

Item antigo, sem `inicio`, não some nem quebra: vira `sem-horario`, cai para o
fim da lista e mostra o texto legado. O formulário exibe esse texto ao lado do
campo vazio, para quem for preencher saber o que a linha era.

**A miniatura é sempre desenhada, mesmo sem imagem.** O cartão é um grid de
quatro colunas (`176px | 1fr | auto | auto`) e a primeira é dela. Quando o bloco
deixava de ser renderizado para o evento sem imagem — que é a maioria —, os
outros filhos escorregavam uma coluna: o título caía nos 176 px e quebrava em
duas linhas, e a data, que se alinha à direita, herdava a coluna elástica de
540 px e ia parar do outro lado do cartão. **Some tudo no celular**, onde o grid
é de uma coluna só, e por isso o defeito passou por medição de celular.

> Componente que é filho de um grid com colunas fixas não pode ser condicional
> sem que o grid saiba. Ou desenhe sempre, ou troque o `grid-template-columns`
> junto.

Sem imagem, o que ocupa a coluna é a hachura do cordel com a sigla do dia — o
mesmo desenho da linha do pôster, para quem vê os dois reconhecer a mesma peça.
No celular ela é escondida (`display: none` na sigla, moldura zerada): lá não há
coluna a preencher e a faixa custaria de volta a altura que o conserto devolveu.
**A etiqueta continua visível nos dois**, virando selo no topo do cartão — é ela
que carrega "Ao vivo" e "Já passou", e sumir com ela junto da moldura seria
trocar um defeito por outro.

### O pôster do Compartilhar imagem

`poster.ts` desenha um layout próprio (não é um print da página) para stories
9:16 e feed 3:4. **A sobra vertical nunca vira um respiro só.** O layout foi
desenhado para uma semana cheia, e uma semana de três eventos empilhava a sobra
inteira antes da lista: um quarto do pôster era um buraco entre a chamada e o
primeiro cartão. Hoje ela é gasta em três frentes, nesta ordem — o selo da
eleição, o respiro entre os cartões (até `GAP_MAX`) e só então as duas pontas.

**Esticar o cartão não resolveria.** A tipografia dele sobe por degrau
(`h >= 180 ? 1.12 : 1`) e a miniatura trava em 118 px, então altura a mais vira
margem interna vazia — é por isso que `LINHA_MAX` continua onde está e quem
ocupa o vazio é conteúdo.

**O selo só sai durante a campanha.** No dia da votação publicar propaganda nova
na internet é proibido, e depois dela pedir voto não quer dizer mais nada — a
mesma trava que o kit aplica às peças, aqui na função que monta o texto. Sem
número cadastrado também não sai. Nos dois casos o pôster volta a distribuir a
sobra entre os cartões, que já era o suficiente para não deixar buraco.

> `escrever()` desenha com `textBaseline = "top"`: o `y` é o topo da caixa do
> texto, não a linha de base. Empilhe somando a altura da linha anterior —
> tratar como linha de base foi o que fez uma linha subir para dentro da outra.

## Funções da militância

`src/data/funcoes.json` é a lista canônica dos papéis do movimento (Olheiro,
Roteirista, Design…), com resumo, entrega, ritmo e passo a passo em linguagem
de recrutamento — o texto vem de `update/Manual-da-Militancia.md`, traduzido do
jargão interno.

Uma fonte só para os dois lados: o Next importa no build (formulário
`/queroajudar`) e o PHP lê o mesmo arquivo (`out/funcoes.json`, copiado pelo
`publish.yml`) para validar o que chega e sugerir as áreas na aprovação.

**Não confunda os três eixos:** `funcoes` é o que a pessoa faz no movimento;
`tipo` é o que ela é (eleitor, militante, coordenador…); `areas` e
`capacidades` são permissão de tela no painel. O `areas` de cada função vive no
próprio `funcoes.json`, e serve de sugestão na hora de aprovar.

**Ao acrescentar função nova:** entre no `funcoes.json` (o `icone` precisa
existir em `src/components/icons.tsx`) e pronto — formulário, validação,
sugestão de áreas e a página `/funcoes` seguem sozinhos.

`/funcoes` é o mesmo catálogo em página pública e indexável, com âncora por
função (`/funcoes#olheiro`) para mandar por link. Cada ficha leva para
`/queroajudar?funcao=<id>`, que abre o formulário **com ela já marcada** — quem
leu a descrição inteira e decidiu não deve ter que procurar de novo numa lista
de doze. O id é conferido contra o catálogo antes de marcar: parâmetro é texto
que vem de fora.

> **Uma página só, com âncoras, e não uma rota por função.** `/funcoes/olheiro`
> tem dois segmentos, e o `.htaccess` do `publish.yml` só reescreve um
> (`^([^/]+)$ $1.html`) — a rota cairia no fallback e serviria a home. Para ter
> rota aninhada seria preciso mexer no `publish.yml`, que é da lista do "não
> mexer sem perguntar".

## Os canais de contato

Fonte única em `src/lib/contato.ts`, com o par PHP em `sessao.php`. **São dois
grupos, e a linha divisória é a conta, não a intenção:**

- **`GRUPO_GERAL`** — quem só quer acompanhar. É o **único** grupo que o site
  público divulga: home, `/plano`, e a tela de confirmação da inscrição.
- **`GRUPO_TRABALHO`** — quem já tem conta. Só dentro do painel. Se ele
  circulasse no site, encheria de gente que a coordenação ainda não conferiu e
  viraria grupo de recados.

> `grep -rn "chat.whatsapp.com/C8rQ" src` tem de voltar **vazio**: o grupo de
> trabalho não pode existir no bundle público.

**Não há e-mail.** `contato@felipesmoreira.com` saiu do site inteiro, inclusive
do `email` do JSON-LD — tirar da tela e deixar no dado estruturado, que é
justamente o que raspador lê, não tira de lugar nenhum. A LGPD exige um canal
para a pessoa exercer os direitos dela, não exige que seja e-mail: o canal é o
WhatsApp da coordenação, e é isso que `/privacy` diz. O que **não** pode
acontecer é sobrar página legal sem canal nenhum.

**Entrar no grupo de trabalho é a primeira obrigação de quem chega**, e por isso
é tarefa em `agora.php` — não banner. Banner some da vista em três dias. Some
quando a pessoa marca "já entrei" (`entrouNoGrupo` no usuário); o cartão fixo
continua na coluna da direita do hub, que é o endereço permanente do link.

## Uma pessoa, e não quatro cadastros

Havia quatro arquivos que não se conheciam — `usuarios.php`, `inscricoes.php`,
`leads.php` e `candidatos.php` — e a mesma pessoa aparecia em vários, com o nome
escrito de três jeitos. Não dava para responder as perguntas óbvias: *em que
encontros o Fulano esteve? esse número já é do time? quem está duplicado?*

Hoje é `dados/pessoas.php`, um registro por gente, com blocos opcionais:

| bloco | campos | quando |
|---|---|---|
| identidade | nome, telefone, e-mail, cidade, bairro | sempre |
| movimento | `tipo`, `funcoes` | sempre |
| painel | `usuario`, `hash`, `capacidades`, `areas` | só quem tem conta |
| candidatura | `urna`, `cargo`, `numero`, `instagram`, `imagem` | só candidato |
| entrada | `status`, `origem`, consentimento | só quem se inscreveu |

**O modelo mora no `sessao.php`**, e não num `pessoas-comum.php`: é ele que
autentica, e pôr o registro fora dele criaria include circular. O
`pessoas-comum.php` tem só o que se pergunta *depois* — duplicatas, fusão, a
fila de entrada.

**O telefone é a chave natural.** Era a única coisa que as quatro listas tinham
em comum, é o que a pessoa digita na porta do encontro e é por ele que a
coordenação fala com ela. Não é chave primária — gente troca de número —, mas é
por ele que se acha duplicata e que a página de presença reconhece quem chega.

### Três eixos que não se confundem

- **`tipo`** — o que a pessoa **é**: eleitor, apoiador, militante, coordenador,
  candidato. Substituiu a `classe` do lead (curioso/simpatizante/…), que dizia
  quase a mesma coisa com outras palavras e vivia num arquivo à parte.
- **`funcoes`** — o que ela **faz**: Olheiro, Checagem, Design… As doze do
  `funcoes.json`. Um coordenador tem função; um militante também.
- **`capacidades`** — o que ela **abre** no painel.

### Capacidades, e as áreas por baixo

Quatro caixas em vez de dez: `comunicacao`, `eventos`, `coordenacao`, `adm`.
Marcar dez áreas uma a uma é decisão demais para uma pergunta simples ("essa
pessoa coordena o quê?"), e quem marca acaba dando tudo por preguiça.

As **áreas continuam existindo** por baixo, para a exceção — tirar o Estúdio de
alguém de Comunicação sem inventar uma capacidade nova. `normalizar_pessoa()`
grava o resultado das duas coisas somadas.

> **`pessoas` só entra em `adm`.** É a tela com telefone, e-mail e endereço de
> todo mundo: acesso a dado pessoal não acompanha o trabalho do dia, acompanha a
> responsabilidade sobre ele. O antigo "papel" (Administrador/Editor) sumiu — era
> um segundo eixo de permissão ao lado das áreas, dizendo quase o mesmo.

> **Estudar não pede permissão.** A formação é de quem tem conta, e `/aulas` só
> exige login. A área `aulas` é para **editar** — pendurar o vídeo, ver quem
> estudou —, e é por isso que ela mora no grupo Coordenação. Antes `api/aulas.php`
> exigia a área, e militante novo ficava com a formação trancada justamente na
> semana em que ela mais importa.

### Presença é relação, não cópia

`dados/presencas.php` liga pessoa × encontro (`pessoaId`, `eventoId`,
`confirmou`, `compareceu`, `funil`). Antes cada ficha de encontro repetia nome,
telefone e bairro: quem foi a cinco encontros tinha cinco cópias de si, e
corrigir um telefone errado exigia achar as cinco.

`presencas_do_evento()` devolve cada linha com a `pessoa` já resolvida — quem
desenha a tela não deveria cruzar dois arrays para escrever um nome.
`encontros_da_pessoa()` faz o caminho inverso, e é ele que responde "em que
encontros o Fulano esteve".

### Duplicatas

`duplicatas_de_pessoas()` sugere por **mesmo telefone** ou **mesmo nome** (sem
acento, sem caixa). É **sugestão que um humano confere, nunca fusão
automática**: casa que divide celular tem duas pessoas de verdade no mesmo
número, e juntar a ficha errada apaga o histórico de alguém — isso não tem
desfazer.

`juntar_pessoas($fica, $some)`:

- campo vazio de quem fica é preenchido por quem some; **o que já está
  preenchido não é sobrescrito** — quem escolheu manter aquela ficha decidiu que
  ela é a boa;
- as presenças mudam de dono, e se as duas estiveram no mesmo encontro sobra uma
  com o melhor dos dois estados (compareceu > confirmou > convidado);
- **duas contas de painel nunca se fundem**: escolher qual login sobrevive não é
  decisão que se toma por inferência.

### A migração

`migrar.php` converte os quatro arquivos antigos na primeira leitura de
`ler_pessoas()`, e só quando `pessoas.php` ainda não existe. **Roda sozinho, e
não por um botão** — migração que depende de alguém lembrar de clicar é migração
que roda no meio do expediente errado.

Casa por telefone e, na falta dele, por nome sem acento. Preserva os ids de
**conta** (a sessão guarda o id: trocá-lo derrubaria quem estiver logado) e de
**candidato** (as listas apontam para ele). As áreas viram capacidades: quem
tinha todas as áreas de uma capacidade ganha a capacidade, e o resto fica como
ajuste fino.

> Os arquivos antigos **não são apagados**. Se algo saiu errado, o conserto é
> apagar `pessoas.php` e ajustar o `migrar.php` — o original continua lá.

## Fluxo de entrada de militante

1. Pessoa preenche `/queroajudar` (3 passos, com consentimento LGPD).
2. `api/inscricao.php` valida e grava uma **pessoa** com `status = 'pendente'`.
   **Não cria conta** — o formulário é público. Se o telefone já for conhecido
   (ela apareceu num encontro, foi cadastrada pela coordenação), entra na fila a
   ficha que já existe: a mesma pessoa não passa a existir duas vezes.
3. Coordenação abre `/painel/inscricoes`, confere e aprova.
4. A aprovação **dá conta à ficha que já está lá** — não cria uma segunda —, com
   `trocarSenha = true`, e mostra a senha provisória **uma vez**, com um botão
   que abre o WhatsApp da pessoa com a mensagem pronta.
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

### A presença nos encontros

Dois links por encontro, e **dois tokens**:

| token | onde vive | grava |
|---|---|---|
| `token` | só no QR impresso na mesa | `compareceu` |
| `tokenConfirmacao` | no grupo e no botão "Vou nesse" da `/programacao` | `confirmou` |

Um token para os dois faria qualquer pessoa que recebesse o link no grupo se
marcar como presente sem sair de casa — e é a lista de presença que alimenta o
funil D+0/D+3/D+7.

**A pessoa digita só o WhatsApp.** `api/presenca.php` procura em três lugares
pelo mesmo número — presenças de qualquer encontro, `inscricao_por_telefone()` e
`usuario_por_telefone()` — e:

- **um achado** → grava e responde com o **primeiro nome**. Nem a ficha inteira
  (um número alheio digitado por engano viraria um jeito de ler o cadastro de
  outra pessoa) nem nada (quem erra um dígito confirmaria a pessoa errada em
  silêncio, sem descobrir);
- **dois ou mais** (casa que divide celular) → mostra os nomes completos para a
  pessoa escolher. Sem isso não há como desempatar;
- **nenhum** → a ficha curta, com o telefone já preenchido.

**As duas telas dizem, no topo, o que fazem.** Os dois links levam à mesma rota
e se parecem, e a confusão não é teórica: quem abre o link do grupo em casa acha
que está "dando presença", e quem lê o QR na porta acha que só está "avisando
que vem". A faixa de modo vem antes de qualquer campo, e o verbo do botão repete
a mesma coisa para quem rolou direto.

> **A `ref` da escolha nunca é o id.** É `hash_hmac` do telefone com o id e o
> `segredo()` do site: o servidor recalcula em vez de guardar, e uma ref só
> serve para o telefone que a gerou. Id que sai de endpoint público é
> identificador estável, e identificador estável é coisa que se coleciona.

> **O dedupe do encontro é por telefone; o da ESCOLHA é por telefone + nome.**
> `lead_por_telefone()` responde "este número já está aqui?", que é o certo para
> não duplicar — mas quando duas pessoas dividem o celular ela devolve a
> primeira, e marcar pela escolha da tela acabava marcando a pessoa errada.
> `lead_da_pessoa()` é a versão com o nome na chave.

**O teto tem escopo.** A inscrição é uma vez na vida por pessoa (5/h); a presença
é uma fila numa porta, com trinta celulares no mesmo Wi‑Fi do local
(`LIMITE_PRESENCA_HORA = 60`). Com o teto da inscrição, a sexta pessoa da fila
levava "você já se cadastrou há pouco" e ia embora sem entrar na lista. **A busca
conta no teto** — sem isso o endpoint vira um oráculo de "digita número, recebe
nome".

**Quem confirma presença e não é do movimento recebe o convite de `/queroajudar`
com os dados já preenchidos**, por `sessionStorage` (`CHAVE_RASCUNHO`) e nunca
por querystring: telefone em URL entra no histórico, no referrer e no log do
servidor. O `?de=encontro-<slug>` fica na URL porque não é dado pessoal — é ele
que responde "quantos militantes saíram do encontro X".

### O time também conta na lista

Militante com conta **não lê o QR da mesa** — ele está atrás dela, recebendo os
outros. Sem escalar, a lista do encontro contava só quem entrou pela porta, e o
relatório esquecia justamente quem fez o encontro acontecer.

`time_fora_do_evento()` lista quem tem conta e ainda não está na ficha (casando
por id **e** por telefone, para não duplicar quem já se cadastrou sozinho), e a
ação `add-time` escala em bloco. Quem entra assim nasce `militante`, não
`curioso` — classificá-lo como lead novo sujaria o funil —, com `confirmou` e
sem `compareceu`: marca-se no dia, que é o que faz a conta fechar.

O `usuarioId` no lead é o que sustenta o selo "do time" na lista e na visão
cruzada.

### Quatro campos obrigatórios, e só quatro

**WhatsApp · nome completo · bairro · cidade** — iguais em `/queroajudar` e em
`/presenca`. Todo o resto (e-mail, função, quem convidou) é opcional.

Não é simetria: é o que faz o retrabalho sumir. É por esses quatro campos que a
presença consegue preencher uma inscrição inteira e a inscrição consegue
reconhecer quem chega na porta. Campo que existe de um lado só é campo que a
pessoa digita duas vezes.

> **Escolher função deixou de ser obrigatório.** O servidor recusava a inscrição
> de quem não marcasse nenhuma; quem chegou disposto e ainda não sabe onde
> encaixa é militante do mesmo jeito, e barrar por causa de uma linha de
> relatório troca um militante novo por um campo preenchido. Sem escolha, a
> aprovação assume `onde-precisar`, que já existia no catálogo para isso.

A régua de validação é uma só: `src/features/inscricao/validacao.ts` (máscara,
DDD de verdade, exigência de sobrenome). Duas réguas divergem na terceira
alteração.

### Conferência de origem

`origem_confere()` (em `sessao.php`) é a única cópia da checagem que a
inscrição, a presença e as aulas faziam cada uma por si. **Ela tira a porta dos
dois lados antes de comparar:** `parse_url` devolve host sem porta e
`HTTP_HOST` a traz quando não é a padrão, então comparar cru reprova todo envio
em porta não-padrão. Em produção isso nunca aparece (443 é implícita) — e é por
isso que só seria descoberto tarde.

### De onde a pessoa veio (`origem`)

`/queroajudar?de=<slug>` grava a origem na inscrição, e ela aparece na ficha
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

**Toda tela se explica.** `cabecalho_pagina()` recebe um quinto parâmetro,
`$comoUsar`: 3–4 frases num `<details class="explicacao">` "O que dá para fazer
aqui", fechado por padrão. Sem JavaScript e sem estado de "já vi" — quem conhece
a ferramenta nunca abre, quem chegou hoje abre uma vez, e ninguém tem um banner
para dispensar errado. O `$sub` de cada área sai do `resumo` de `DESTINO_AREA`,
que estava escrito e não era renderizado em lugar nenhum.

> Divisão de texto, para não duplicar: o `<details>` diz **o que** a tela faz; o
> "Como se faz →" que o mesmo cabeçalho anexa leva para a aula, que diz **como**.

**Cuidado com especificidade em cartão:** uma regra como `.mesa span` (0,1,1)
vence `.mesa-icone` (0,1,0) e repinta o ícone. Ao estilizar filhos de um cartão,
escreva o seletor com a classe junto (`.mesa .mesa-icone`) ou mire o filho
direto (`.encontro-texto > span`).

**Tela longa pede índice, e formulário pede modal.** O encontro aberto tem
playbook, cinco peças, lista de gente, follow-up e dados — sem um índice
(`.secoes`, âncoras e não abas: funcionam sem JavaScript e dão link para mandar
no grupo), chegar em "Pessoas" no celular é rolar às cegas. E o formulário de
novo encontro, que vivia embaixo de duas listas com dezenas de itens, virou
`<dialog class="modal">`.

> **O botão do modal é um link de verdade** (`?novo=1`), não um botão que só
> existe com JavaScript: sem JS a página recarrega com o `<dialog open>` e o
> formulário continua ali. Com JS, o link vira modal de verdade — foco preso,
> Esc fecha, véu por cima.

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
7) entrada em `GRUPOS_NAV` e em `ROTULO_CURTO` (`layout.php`), senão ela não
aparece no menu nem na barra do celular.

Feito duas vezes recentemente: `municao` (ferramenta, em `AREAS_FERRAMENTA`) e
`candidatos` (coordenação).

**O que está pendente se declara em `agora.php`, e só lá.** `tarefas_de()` monta a
fila do hub e `contagens_por_area()` alimenta o número ao lado do nome no menu —
os dois saem do mesmo lugar. Não espalhe contador pelo `index.php`: era assim
antes, e o resultado era um painel que sabia dizer onde a pessoa podia ir sem
saber dizer o que estava esperando por ela.

**A permissão normal é por CAPACIDADE** (ver "Uma pessoa, e não quatro
cadastros"); as áreas são o ajuste fino por baixo. As áreas se dividem em duas
naturezas — a distinção não é técnica (a permissão é a mesma caixa marcada), é
sobre o que vem marcado por padrão:

- **Ferramentas do dia** — `aulas`, `fatos`, `producao`, `municao`, `eventos`. Listadas em
  `AREAS_FERRAMENTA`. O padrão é liberar todas: ferramenta **não pertence a uma
  função**, e o Olheiro que quiser entender o quadro de Produção deve conseguir
  abrir.
- **Decisão e dado pessoal** — `agenda`, `estudio`, `inscricoes`, `candidatos`,
  `aulas`, `pessoas`. O que vai ao ar, quem entra no movimento, o que o time
  estuda, o número que o eleitor vai digitar — e `pessoas`, a lista completa com
  telefone, que **só a capacidade `adm` libera**.

**A função da pessoa não limita acesso.** Ela define só o atalho no topo do hub
(`MESA_DA_FUNCAO` em `agora.php`). O `areas` de cada função no
`funcoes.json` é *sugestão* de marcação na hora de aprovar a inscrição — a
primeira da lista é a que vira o atalho.

### As ferramentas do manual

Três telas que substituem WhatsApp, Trello e planilha. O que cada uma trouxe do
manual para dentro do código:

- **Fatos** (`fatos.php`) — Ficha de Fato e fila da Checagem. Recusa gravar sem
  link de fonte primária, e sem declarar a exceção quando a publicação tem mais
  de 48h. A fila é ordenada do mais antigo para o mais novo, porque a meta é
  "nada dorme sem status".

  **Quem traz o fato não checa o fato.** Checagem que o próprio autor faz não é
  checagem — é a mesma pessoa conferindo a si mesma, e o passo inteiro vira
  carimbo. O `autorId` já estava gravado desde sempre; faltava a regra. Admin
  destrava, mas caro: escreve o porquê, e o porquê fica na ficha, visível ao
  lado de quem checou. Mesmo desenho da regra do ledger. `agora.php` também não
  conta o fato próprio como pendência da pessoa — mandaria alguém para uma tela
  onde a única coisa a fazer é esperar.

  **O fato pode virar roteiro, arte, vídeo, qualquer combinação — ou nada.** Ao
  aprovar, a Checagem marca as saídas; um card por saída, via `card_do_fato()`,
  que agora recebe a etapa. Antes toda aprovação abria um card de roteiro, e o
  quadro enchia de card que ninguém tinha pedido.

  **"Nada" é uma resposta legítima, e fica registrada.** O status `arquivado`
  exige motivo: sem ele, fato aprovado que ninguém aproveitou fica idêntico a
  fato esquecido, e a pergunta *o que foi feito com aquele fato* não tem
  resposta. `saidas_do_fato()` (em `producao-comum.php`, varrendo `fatoId`)
  monta o rastro na tela; fato `ok-checado` há mais de `HORAS_SEM_SAIDA` (48)
  sem nenhuma saída vira pendência no hub.
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

- Rotas e conteúdo: **português** (`/programacao`, `/heroisdoceara`,
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
  > 4. **Os `RewriteRule ... [R=301,L,QSA]` das rotas renomeadas.** `/quero-ajudar`
  >    virou `/queroajudar`, `/a-missao` virou `/amissao`, `/herois-do-ceara`
  >    virou `/heroisdoceara` e `/kit` virou `/municao` — link se dita em voz
  >    alta, e hífen não. Sem o 301 a URL antiga cairia no *SPA fallback* e
  >    devolveria **a home com status 200**, um soft 404 (pior que o 404
  >    honesto). **O `QSA` é o que quebra em silêncio se faltar:**
  >    `/quero-ajudar?funcao=olheiro&de=joao-silva` tem de chegar do outro lado
  >    com os dois parâmetros, senão o formulário abre em branco e o crédito de
  >    quem trouxe a pessoa se perde.
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
da home, no `/amissao` e no `Person.image` do schema. Todo ícone — favicon,
ícone do Android (manifest), ícone do iOS (`apple-icon.png`) — sai da marca das
onças em `src/app/icon.png`. Eram três desenhos diferentes antes: o iOS chegou a
ter um monograma "FM" próprio, que já não existe.

O `maskable` precisa do conteúdo em ~78% da moldura, senão o Android corta as
orelhas ao aplicar a máscara redonda.
