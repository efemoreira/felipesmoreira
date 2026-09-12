# Avaliação e plano de crescimento — o produto inteiro, por sete visões

Data: 2026-09-11

Substitui os dois planos anteriores — o de 29/08 (*para onde* o movimento
anda: estudo e crescimento) e o de 10/09 (*como o painel aguenta*: separar,
nomear, fortalecer). Os dois foram cumpridos e apagados em 11/09; o que ficou
em aberto deles está registrado aqui, em "Método e limites". Este é o primeiro
plano que olha o produto **inteiro**: site público, painel, dados, operação e
o código por baixo, cada um por uma visão diferente, e a partir daí diz o que
muda, o que melhora e o que cresce. O passo a passo por critério, com
calendário, está em `roteiro-das-notas.md`.

## Antes de tudo: o calendário manda

**A eleição é 04/10/2026 — faltam 23 dias.** `src/lib/eleicao.ts` já trava as
fases: `campanha` até 30/09, `reta-final` a partir de 01/10, `votacao` no dia,
`depois`. Isso governa o plano mais do que qualquer achado abaixo. Por isso ele
tem três horizontes, e a régua de cada um é diferente:

| Horizonte | Quando | O que entra |
| --- | --- | --- |
| **A** | 11/09 → 04/10 | só o que **protege dado** ou **converte** (voto, presença, inscrição) |
| **B** | 05/10 → 04/11 | o que a campanha ensinou: leitura, rastro, dívida que ficou cara |
| **C** | nov/2026 → | o movimento depois do pleito — o `Manual-da-Militancia.md` e a `/plano` já dizem que ele continua |

## Método e limites

Esta avaliação foi feita por leitura do código, dos testes e dos docs em
11/09 — não por uso em campo. Ela mede o que o código *faz*, não o que o
militante *sente*. Os dois planos anteriores deixaram três pendências que só
uso real fecha, e elas continuam abertas: validar o painel e o `/presenca` num
aparelho de verdade, em pé, na porta de um encontro; a segunda passada do front
público (home, programação, aulas); e o item 13 de 10/09 — "decidir com uso
real: Mutirão sobe para a lateral? Leituras precisa de gráfico?".

Contexto que pesa: 116 commits, um autor, ~70% deles nos últimos 25 dias
(ago/set). É um produto que nasceu rápido e está **bem cuidado** — comentário
que explica decisão, 339 testes em três frentes, arquitetura consistente. Os
pontos fracos são estruturais e concentrados, não bagunça espalhada. Quem ler
as seções de "fraco" abaixo sem ler as de "forte" vai ter a impressão errada.
A nota logo abaixo é o resumo honesto dos dois lados.

## A nota — para comparar depois

Uma avaliação sem número não mede crescimento; daqui a três meses "melhorou"
seria opinião contra opinião. Então cada visão recebe uma nota de **0 a 10**,
quebrada em critérios, e o conjunto recebe uma nota ponderada. As regras para
a nota valer como comparação:

- **mesmos critérios, mesma escala, mesmo método** (leitura do código, dos
  testes e dos docs — não impressão de uso). Se um critério mudar, a nota
  antiga é refeita com o critério novo antes de comparar;
- **datas fixas de reavaliação**: **05/10/2026** (post-mortem da campanha) e
  **11/12/2026** (90 dias);
- cada critério diz **o que faz subir** — o item do plano que o resolve. A nota
  não sobe por sensação; sobe quando o item está feito e testado;
- 10 não é "perfeito", é "não há nada a fazer aqui por um ano". 5 é "funciona,
  mas cobra caro". Abaixo de 3 é "falta a coisa".

| Visão | Peso | Nota | Critérios (nota · o que faz subir) |
| --- | --- | --- | --- |
| 1. Site de militância | 20% | **6,5** | funil desenhado 9 · atribuição `?de=` 9 · compartilhar nativo 8 · OG nas rotas-chave 4 (item 3) · robustez de `/candidatos` 5 (item 5) · medição **1** (item 11) |
| 2. Design | 10% | **7,0** | identidade 9 · acessibilidade 8 · disciplina de tokens 5 (item 19) · componentização 4 (itens 19–20) · peso e performance 9 |
| 3. Programação | 15% | **7,0** | arquitetura 9 · testes 9 · concorrência **3** (item 2) · CI 5 (item 17) · docs × código 6 (item 18) · contrato Next↔PHP 7 |
| 4. Administração | 20% | **5,5** | autenticação 8 · CSRF e escape 9 · permissão real **3** (item 1) · integridade do dado **3** (item 2) · backup 7 (item 8) · observabilidade **2** (item 35) · LGPD 5 (item 16) |
| 5. Ferramenta de edição | 10% | **7,0** | agenda 9 · fatos → produção 9 · aulas 4 (item 26) · estúdio 7 (item 22) · rascunho 6 (item 9) |
| 6. Ferramenta de organização | 15% | **6,0** | modelo de dado 9 · rotina do dia 8 · rotina da semana e do mês **3** (itens 13, 27, 28, 30) · rastro **3** (item 14) · escala e convite 6 (item 29) |
| 7. Entrada (quem chega) | 10% | **6,0** | militante novo 7 (item 23) · coordenação nova no painel 5 (item 24) · desenvolvedor novo 6 (item 25) |
| **Geral** | | **6,4** | média ponderada |

Como ler: o produto é **bom onde foi pensado** (funil, identidade,
arquitetura, testes, agenda, modelo de pessoa — tudo 8 ou 9) e **fraco onde
ninguém precisou ainda** (medição, concorrência, permissão real, rastro,
observabilidade — tudo 1 a 3). Não há nota média por mediocridade; há notas
altas e notas baixas convivendo. É o perfil de um produto novo que cresceu
rápido, e é uma boa notícia: nota baixa por ausência sobe mais barato do que
nota baixa por coisa mal feita.

**Meta declarada:** **7,5 em 05/10** (só o horizonte A: os itens 1–9 sobem
permissão, integridade, OG, robustez e rascunho) e **8,5 em 11/12** (B inteiro
mais o começo de C). Se em 05/10 a nota não passar de 7, o horizonte A não foi
feito — e o post-mortem começa por aí.

---

## 1. Visão: site de militância

A pergunta desta visão é uma só: **o site transforma quem chega em voto, em
presença e em militante?**

### O que está forte

- **Um CTA só.** A home tem seis cartões e um único `accent` — "Quero ajudar" —
  e a decisão está escrita no comentário. Toda rota indexável (`/amissao`,
  `/propostas`, `/funcoes`) termina em `/queroajudar`; `/funcoes` termina por
  ficha (`?funcao=<id>`), que pré-marca o formulário.
- **A atribuição fecha.** `?de=<slug>` sai da Munição, entra na inscrição,
  vira `origem` na pessoa e aparece em Leituras › Origem como "quem trouxe
  gente que milita". Poucas campanhas têm isso funcionando de ponta a ponta.
- **A passagem presença → inscrição** é por `sessionStorage`, nunca por
  querystring com telefone. Quem veio ao encontro e não é inscrito recebe o
  convite na tela de "Pronto", com a ficha já preenchida.
- **Compartilhar é nativo**: pôster da programação (9:16, 1:1, 4:5), colinha
  dos candidatos, peças da Munição — tudo PNG por canvas com
  `navigator.share({files})` e fallback de download + legenda copiada.
- **As fases eleitorais travam no cliente**: sem arte nova no dia da votação,
  sem impulsionamento nas 48h finais. Calculado no navegador, não no build —
  o site estático não fica "preso em agosto".
- **A prévia do WhatsApp de `/presenca`** é dinâmica (`presenca-previa.php` só
  para o robô), então o link do encontro chega com o título certo.

### O que está fraco

| Sintoma | Onde | Impacto |
| --- | --- | --- |
| `/candidatos` e `/programacao` — as duas rotas de maior intenção de busca ("em que número votar", "onde assistir") — **não têm OG próprio**; herdam o cartão genérico "Candidato a Vice-Governador" | `src/app/candidatos/page.tsx`, `src/app/programacao/page.tsx` | conversão: o link mais compartilhado da reta final chega sem o número na prévia |
| `twitter.title` só é sobrescrito em `/queroajudar` | as outras `page.tsx` | conversão, menor |
| `/candidatos` depende 100% de `candidatos.php`; rede fora ou API lenta = página vazia, sem semente do build | `features/candidatos/CandidatosClient.tsx` | conversão: a página do número pode abrir em branco |
| "12 funções" escrito em três lugares; o catálogo tem **17** e a própria página imprime "17 funções" logo abaixo | `src/app/page.tsx:78`, `src/app/funcoes/page.tsx:7`, `src/app/funcoes/opengraph-image.tsx:12` | credibilidade |
| `sitemap.ts` com `lastModified: now` em todas as URLs | `src/app/sitemap.ts` | SEO: o buscador não sabe o que mudou |
| `robots.ts` bloqueia `/api/` (não existe) e não bloqueia `/painel/` | `src/app/robots.ts` | higiene |
| **Zero medição no site.** A única leitura de conversão é a que o painel deriva de `?de=`. Não há como saber quantos abriram `/candidatos`, quantos clicaram em compartilhar, quantos pararam no passo 2 do formulário | `src/` inteiro | crescimento: toda decisão sobre o site é opinião |
| Semente da programação tem itens de julho, já passados | `src/data/programacao.json` | o plano B do build é ruído, não plano B |
| O cartão OG não carrega fonte — sai em sans do sistema | `src/lib/ogCard.tsx` | design: a identidade some exatamente no WhatsApp |

**Leitura da visão:** o funil está desenhado certo e a parte de baixo dele
(presença → inscrição → militância) é melhor do que a média. O buraco está
na boca do funil, na reta final: as duas páginas que mais vão circular nas
próximas três semanas são as duas sem cartão próprio, e uma delas pode abrir
vazia. É barato e é o que mais vale antes de 04/10.

---

## 2. Visão: design

### O que está forte

- **Identidade forte e coerente.** Cordel e xilogravura: `C` com sete cores,
  três fontes com papel definido (Alfa Slab título, Special Elite rótulo,
  Bitter corpo), `borda()` de 3 px, `sombra()` em três degraus com
  `sombraErguida()`/`sombraAfundada()` casando com `translate`. Não é
  "template com cor trocada"; é uma linguagem.
- **Acessibilidade acima da média** para um site de campanha: um `h1` por
  página, `aria-live` nos formulários, `role="dialog"` com gestão de foco e
  Esc, `role="progressbar"` nas aulas, `prefers-reduced-motion` respeitado,
  `focus-visible` com outline no padrão da borda, foco que vai para o `h2`
  ao trocar passo da inscrição.
- **Imagens leves**: nenhuma imagem pública passa de 70 KB; a foto da home
  usa `<picture>` WebP+JPG com `fetchPriority="high"` e dimensões declaradas.
- **Painel com tema próprio** (57 tokens, claro/escuro por `data-tema` e por
  `prefers-color-scheme`), barra fixa no celular, tabelas que viram cartões
  abaixo de 700 px, e um teste de contrato que impede classe sem CSS.

### O que está fraco

| Sintoma | Onde | Tamanho |
| --- | --- | --- |
| **Três paletas de erro**: `C.erro/erroBorda` no tema, `#FBE3E0/#8C2F22/#6B1F15` na inscrição, `#E4572E/#F09A7E` na presença | `src/lib/theme.ts`, `features/inscricao/estilos.ts`, `features/presenca/Pecas.tsx` | o mesmo erro tem três caras |
| 47 cores hardcoded em 15 arquivos fora do tema (fora o Estúdio) | `programacao/tipos.ts` (9), `presenca/Pecas.tsx` (7), `inscricao/estilos.ts` (6), `aulas/*` (6), `herois/HeroisClient.tsx` (4)… | regra do tema cumprida só para a borda de 3 px |
| `2px solid` à mão **52 vezes** em 16 arquivos — não existe token de borda fina | `ProgramacaoClient` (8), `PlanoClient` (8), `estilos.ts` (6)… | o dia em que a borda fina mudar, são 52 edições |
| `HATCH` (a hachura da xilogravura) copiado literalmente em **7 arquivos** | `plano`, `missao`, `inscricao/estilos`, `funcoes`, `herois`, `legal`, `propostas` | duplicação da peça mais identitária do site |
| Fontes redefinidas em vez de importadas; `tipos.ts` reexporta o tema, criando um segundo caminho de import | `programacao/ProgramacaoClient.tsx:23-25`, `CompartilharClient.tsx:9-10`, `programacao/tipos.ts` | duas portas para a mesma fonte |
| **Tailwind instalado, importado e com zero utilities usadas**; `globals.css` ainda carrega `--background/--foreground` cinza e `body { font-family: Arial }` do template | `src/app/globals.css`, `package.json` | peso no build e uma promessa que ninguém cumpre |
| Só dois componentes compartilhados (`FaixaEleicao`, `icons`); "Voltar" reescrito em 13 arquivos; iframe do cordel + véu montados à mão em 3 | `src/components/`, `page.tsx`, `not-found.tsx`, `ProgramacaoClient.tsx` | o que é comum mora em cada feature |
| Contraste no limite: Elite 11–12 px com `opacity .6–.7` (kickers, "página" nos cartões de meta); cinzas `#8e877a` sobre `night` em aulas e presença | vários | AA em risco em texto pequeno — a parte do site lida em pé, na rua |
| A home é a única rota "gorda": 477 linhas, `'use client'`, dados de perfil e links inline | `src/app/page.tsx` | exceção não documentada à regra "page.tsx fino" |

**Leitura da visão:** a identidade é o maior ativo do site e está protegida
onde importa (`theme.ts`, `sombra()`, o teste de contrato de sombra). O
que falta é levar a mesma disciplina para o resto: borda fina, erro, hachura,
componentes comuns. Nada disso é visível para quem vota — é custo de quem
mantém, e por isso vai para o horizonte B.

---

## 3. Visão: programação

### O que está forte

- **Arquitetura consistente**: rota → `-acoes` → `-tela` → `-comum` em todas
  as telas grandes; POST-redirect-GET num lugar só (`acoes-comum.php`);
  registro `pendencias_*`/`medidores_*`/`estado_*` em vez de cadeia de `if`;
  `normalizar_pessoa()` como schema do dado. O plano de 10/09 foi cumprido
  quase inteiro em um dia sem quebrar nenhum `require_once`.
- **Comentários que explicam decisão**, não o que a linha faz. `gravar_atomico()`
  explica por que o sufixo é sorteado e por que o OPcache é invalidado.
- **339 testes** em três frentes (204 de ação, 88 de contrato, 47 de fumaça)
  com sandbox PHP real (`testes/sandbox.ts`): copia o painel para um `tmpdir`,
  semeia dados pelas próprias funções `gravar_*()`, sobe `php -S` só quando
  uma ação pede, segue o `Location`, e derruba o teste em qualquer `Warning`.
  Os de contrato prendem pares PHP × TS (`semana`, `origem`, `escala`,
  `presenca-previa`) por uma ponte com lista explícita de funções puras.
- **`npm test` roda antes do build no CI**: build não acontece se falhar.
- **Higiene de saída**: `h()` em toda interpolação de texto; os `<?= $var ?>`
  sem `h()` na amostra são inteiros ou sufixos constantes. JSON inline com
  `JSON_HEX_*`. CSRF em todo POST do painel, com `hash_equals`.
- **Upload** reencoda via GD (JPEG q82, `LARGURA_MAX`, EXIF), nome sorteado,
  pasta com `php_flag engine off`.

### O que está fraco

| Sintoma | Onde | Tamanho |
| --- | --- | --- |
| **Concorrência.** `gravar_atomico()` é atômico *por arquivo*, mas todo caminho é `ler_X()` → altera o array → `gravar_X()`, e não há `flock` em lugar nenhum do painel: *last-writer-wins* sobre o arquivo inteiro | `sessao.php:71`; `api/presenca.php`, `api/inscricao.php`, `marcar_acesso()`, `registrar_envio()` | o cenário que o próprio código descreve — 30 celulares lendo o QR na porta — é onde `presenca.php` grava `pessoas.php` **e** `presencas.php` em sequência, e presenças podem sumir sem erro |
| ~320 linhas de JS inline em `fechar_pagina()` (copiar, tema, modal, três pontinhos, peneira, rascunho, atalho `/`) | `layout.php:428-751` | re-transmitido em toda página, não cacheia, e inviabiliza CSP com nonce; `agenda-previa.js` já mostra o caminho certo |
| `InscricaoClient.tsx:232` faz `fetch` direto em `/painel/api/inscricao.php`, fora de `apiFetch`; `api/sessao.ts` (`obterSessao`, `podeAbrir`) não tem consumidor | `src/features/inscricao/`, `src/lib/api/sessao.ts` | o contrato "toda chamada passa por `apiFetch`" tem uma exceção e um órfão |
| Nenhuma lista pagina; `usuario_atual()` relê e normaliza `pessoas.php` inteiro a **cada request** | `pessoas-lista.php`, `procurar.php`, `sessao.php:434` | fica lento na casa dos milhares, sem aviso |
| CI: `npm install` (não `ci`), sem `lint`, sem `test:tipos`, sem trigger em PR, sem cache; Node e PHP não pinados (`engines`, `.nvmrc`); PHP mínimo real é **8.1** (`: never` em `acoes-comum.php:30`) mas `api/inscricao.php:21` diz 8.0 | `.github/workflows/publish.yml`, `package.json` | o CI aprova código que o lint reprova |
| Deploy = push da pasta `out/` para a branch `build`, e a Hostinger puxa — **não está documentado em lugar nenhum do repositório** | `publish.yml`, `docs/deploy-testes-e-limites.md` | o dia em que outra pessoa precisar publicar |
| Dois testes prometidos no plano de 10/09 não existem: `fumaca/pessoas.test.ts` (ficha não aparece no HTML da lista) e a regra "`api/presenca.php` não inclui `inscricoes-comum.php`" em `contrato/arquivo.test.ts` | `testes/` | promessa em aberto |
| `eventos-comum.php` com 827 linhas — acima do teto de 800 que o plano anterior pôs | `public/painel/eventos-comum.php` | pequeno; a meta era a régua, não o número |

**Docs divergentes do código** (a lista concreta, para fechar de uma vez):

1. `docs/dominio-e-fluxos.md`: "endpoints públicos atuais: inscrição e
   presença" — `candidatos.php`, `kit.php` e `escala.php` também são públicos
   sem sessão (os próprios wrappers em `src/lib/api/` dizem isso).
2. `docs/dominio-e-fluxos.md`: "toda chamada passa por `apiFetch`" — ver
   `InscricaoClient.tsx:232`.
3. `docs/site-publico.md`: "page.tsx só faz metadata + delegação" — a home é a
   exceção não escrita; `privacy`/`terms` carregam ~150 linhas de conteúdo cada.
4. `docs/site-publico.md`: "fonte única `theme.ts`" — ver §2.
5. `conta.php:10-11` manda resetar senha em `usuarios.php`, que não existe
   (é `pessoas.php?p=…&aba=acesso`).
6. `api/aulas.php:13-14` e `aulas-conteudo.php:27-28` dizem que quem não tem
   a área `aulas` recebe `pode: false` — o código entrega o currículo a
   qualquer conta.
7. `dominio.php:44-50`: o aviso sobre `pessoas` está escrito duas vezes
   seguidas, e só o primeiro parágrafo inclui `caixa`.
8. `docs/painel-ui-e-permissoes.md` diz "só `adm` e `coordenacao` leem nome
   e telefone" e, quatro parágrafos antes, descreve `gente.php` mostrando
   nome e WhatsApp a quem tem `lideranca`. `privacidade.php` também diz "só
   adm e coordenacao", e `pode_ver_telefone()` abre para quem criou a presença.
9. `desenhar_barra_celular` (`layout.php:311`) tem lista fixa de 10 áreas que
   **não inclui** `caixa` nem `leituras` — área nova fora dessa lista nunca
   entra nos slots do celular, e "Área nova exige" no doc não fala disso.
10. `docs/deploy-testes-e-limites.md` não menciona que os `.htaccess` de
    `/dados` são gerados **em runtime** por `preparar_pastas()` (só após a
    primeira gravação), nem o cron de `backup.php`, nem as três cópias que o
    painel exige (`dados-semente.json`, `funcoes.json`, `municipios-ce.json`)
    — se faltarem, `cidade_valida()` e `funcoes_validas()` degradam em
    silêncio.

**Leitura da visão:** é uma base de código melhor do que a maioria dos
projetos de campanha, e o que a torna assim (testes, sandbox, registro por
área, comentários) deve ser preservado a qualquer custo. O único item desta
visão que não pode esperar a eleição é a concorrência — porque é o único que
perde dado.

---

## 4. Visão: administração

Segurança, dados e operação: **o que acontece se alguém errar, se alguém
atacar, se o disco sumir.**

### O que está forte

- Login com `password_hash`, hash-fantasma quando o usuário não existe (contra
  timing), mensagem "desativado" só depois de provar a senha, e-mail duplicado
  não abre conta. Primeiro admin só enquanto `pessoas.php` não existe.
- Sessão `Strict`, `httponly`, `secure` em HTTPS, `path=/painel`,
  `session_regenerate_id` no login e na troca de senha, expira em 2 h.
- CSRF universal (`exigir_token_de_acao()` em todo `-acoes.php`, `token_valido()`
  nos demais); token errado derruba a sessão.
- Backup: zip de `/dados` inteiro (com `segredo.php` e imagens), 14 mais
  recentes, botão na Manutenção **e** `backup.php` só por CLI (404 pela web),
  download validado por regex, "zerar" não apaga backups, e um teste de ação
  prendendo tudo isso.
- `.htaccess` de `/dados`, `/dados/imagens` e `/dados/backups` gerados em
  runtime, fechando a pasta para a web.
- "ZERAR TUDO" exige `confirmacao === 'ZERAR TUDO'` e grupos explícitos.
- Consentimento LGPD com `consentimentoEm` e `consentimentoVersao` na pessoa.

### Riscos concretos, em ordem

| # | Risco | Onde | Prova |
| --- | --- | --- | --- |
| 1 | **Escalada de `pessoas` para `adm`.** "Pessoas e Caixa são só-adm" é o que o doc, o menu e o comentário de `layout.php:42` dizem. O código restringe por **área** (`exigir_area('pessoas')`), e a área é concedível a qualquer conta pelo ajuste fino: `areas_do_post()` aceita qualquer chave de `AREAS`, e os checkboxes iteram `AREAS` inteiro. `pessoas-acoes.php` não tem nenhum `e_admin()`. Quem tiver só a área grava `capacidades[]=adm` na própria ficha, reseta senha de administrador e apaga gente | `pessoas.php:34`, `caixa.php:22`, `pessoas-acoes.php:29-39`, `pessoas-ficha.php:171`, `inscricoes-fila.php:229` | lida no código em 11/09 |
| 2 | **Perda silenciosa de gravações concorrentes** (§3) | `sessao.php:71` e todo `ler_*()`→`gravar_*()` | não há `flock` no painel |
| 3 | **Bloqueio de conta por terceiro.** As tentativas contam por *login*, não por IP: cinco senhas erradas em qualquer conta conhecida travam a conta por 15 min. Um adversário que saiba o login da coordenação tranca a coordenação na noite da apuração | `index-acoes.php`, `MAX_TENTATIVAS=5`, `BLOQUEIO_SEG=900` | — |
| 4 | `chave_visitante()` confia no **primeiro** IP de `X-Forwarded-For`. Atrás do proxy da Hostinger costuma estar certo; se o header for forjável, o teto de 5/h da inscrição e de 60/h da presença é furável | `limite-comum.php` | — |
| 5 | Sem `Content-Security-Policy`, `frame-ancestors`/`X-Frame-Options`, `Permissions-Policy`. O `Cache-Control` das telas vinha só do `session_start()` (`session.cache_limiter` do php.ini da hospedagem) — **corrigido em 11/09**: `sessao.php` manda `no-store, private` explícito depois do `session_start()`, e `testes/acoes/cabecalhos.test.ts` confere | `sessao.php` | — |
| 6 | Senha provisória guardada em texto em `$_SESSION['senha_nova']` até ser exibida — fica no arquivo de sessão do servidor (hospedagem compartilhada, `session_save_path` padrão) | `pessoas-acoes.php:156` | — |
| 7 | "ZERAR TUDO" faz `unlink` sem chamar `fazer_backup()` antes; não há restore pelo painel (é "descompacta em cima"); o backup fica no mesmo disco da hospedagem e nada força baixar | `manutencao.php`, `backup-comum.php` | — |
| 8 | **Nenhum log de erro de aplicação, nenhum monitoramento, nenhum alerta** de backup que não rodou. Em produção o `display_errors` está off e o erro some | `public/painel/` inteiro | — |
| 9 | LGPD: consentimento existe, mas não há "apagar a pedido" com registro nem "exportar os dados desta pessoa" | `pessoas-ficha.php` | — |
| 10 | `presenca.php` acao=`procurar` devolve **nome completo** de todas as fichas quando 2+ pessoas dividem o telefone. Aceito conscientemente no código; com o teto de 400/dia, um IP varre 400 números por dia | `api/presenca.php:223-230` | — |

**Leitura da visão:** o painel foi construído por alguém que pensou em
segurança — a lista de "forte" é longa e específica. Os dois primeiros riscos
são graves justamente porque contradizem o que o resto do sistema promete:
"pessoas é só adm" e "a presença gravou". Os dois cabem em um dia e meio e
vão antes de qualquer outra coisa.

---

## 5. Visão: ferramenta de edição

O que a coordenação e a comunicação **editam** — agenda, aulas, fatos,
produção, Munição, Estúdio.

### O que está forte

- **Agenda**: capa + itens espelhados dos encontros, prévia ao vivo
  (`agenda-previa.js`), reordenação, aviso de não-salvo, rascunho local,
  upload por item com imagem reencodada, backups próprios (`MAX_BACKUPS = 12`),
  publicação ao gravar. `republicar_agenda()` a partir dos encontros garante
  que a `/programacao` nunca mostra o que o painel não tem.
- **Fatos → Produção**: fato sem fonte primária não entra; fonte tem de estar
  dentro de 48 h; quem trouxe não checa; aprovar cria o card; `alvo_repetido()`
  evita dois cards do mesmo alvo; o ledger de 48 h transforma fato aprovado
  sem saída em pendência do hub. É um fluxo editorial de verdade, com regra.
- **Munição** em duas abas com ritmos distintos (catálogo × mutirão da
  semana), `registrar_postagem()` num lugar só, histórico das semanas.
- **Estúdio** (`src/app/painel/estudio/`, 11 mil linhas TS): editor real de
  artes — camadas, texto, filtros, recorte de fundo por MediaPipe, modelos,
  undo — todo no cliente, sem persistir nada no servidor, servido só por
  `estudio.php` (o `.html` é negado pelo `.htaccess`).
- **Rascunho local** (`data-rascunho`) com validade de 12 h e limpeza ao
  sair, em agenda, caixa, candidatos e eventos.

### O que está fraco

| Sintoma | Onde | Tamanho |
| --- | --- | --- |
| **Aula é código.** O currículo é a constante `CURRICULO` (1.233 linhas de PHP); o painel só pendura vídeo e marca `publicada`. Corrigir uma frase de aula é commit + deploy. A decisão está declarada ("muda por decisão da coordenação, não numa terça-feira") e é defensável — mas na reta final, quando a aula de Recepção precisa mudar na quinta para o encontro de sábado, pesa | `aulas-conteudo.php`, `aulas-acoes.php` | a coordenação depende de desenvolvedor para conteúdo |
| `data-rascunho` **não está** em `fatos-form.php` — o formulário mais digitado por militante, na rua, com a fonte colada — nem em `pessoas-ficha.php` | `fatos-form.php`, `pessoas-ficha.php` | perder o que se digitou em pé |
| Estúdio: 38 MB de modelos MediaPipe em `public/modelos` (95% do peso de `public/`); 3 `eslint-disable` de hooks; 8 arquivos > 400 linhas (`Inspetor` 1.311, `modelos` 947, `Estudio` 904); **nenhum teste** | `src/app/painel/estudio/`, `public/modelos/` | o maior módulo do repositório é o único sem rede |
| Três geradores de PNG por canvas sem base comum — peças da Munição, pôster da programação, colinha dos candidatos — cada um com seu carregamento de fonte, seu `navigator.share`, seu fallback | `kit/KitClient.tsx`, `programacao/poster.ts`, `candidatos/colinha.ts` | a quarta peça compartilhável copia a terceira |
| A agenda ainda tem `importar` para o formato legado | `agenda-acoes.php` | provavelmente morto; confirmar e tirar |

**Leitura da visão:** editar está bem resolvido para o que é *operação*
(agenda, fatos, produção) e mal resolvido para o que é *conteúdo* (aula). A
regra "muda por decisão" pode continuar — o que muda é quem aperta o botão.
Vai para o horizonte C porque não é urgente e porque mexe no contrato de
`/aulas`.

---

## 6. Visão: ferramenta de organização

O que a coordenação usa para **organizar gente**: pessoas, encontros, funil,
liderança, leituras.

### O que está forte

- **Uma pessoa, não quatro cadastros.** `dados/pessoas.php` como base única,
  telefone como chave natural, presença como relação. Inscrição reaproveita a
  ficha; aprovar dá conta à ficha existente. É a decisão mais importante do
  produto e está certa.
- **Reativação derivada** (`reativacao.php`): quatro motivos (faltou, nunca
  entrou, parou de estudar, sumiu), indexada por pessoa, sem campo "reativar"
  — ninguém sai da lista por ser chamado, só por voltar.
- **Funil pós-encontro** D+0 agradecer · D+3 conteúdo · D+7 convidar, com
  mensagem pronta por etapa, dono (função Follow-up) e vencimento no hub.
- **Escala** com peças, checklist por peça, convite por token HMAC, `topou`/
  `não posso` sem login, `convites_sem_resposta()` em 48 h.
- **Liderança** como recorte, não como área: `minha_gente($eu)` por desenho
  não aceita parâmetro que amplie; `gente.php` com Todas · Esfriando · Sem
  estudar.
- **Leituras** com seis abas, todas derivadas, nenhum arquivo de dado novo,
  e um teste que prova que GET não grava.
- **Caixa** em centavos, duas contas que nunca se somam, lançamento amarrado
  a encontro.
- **Duplicatas** como sugestão, nunca fusão automática; `juntar_pessoas()`
  migra presenças e não funde duas contas.

### O que uma campanha pede primeiro — e não existe

| Falta | Hoje | Por que pesa |
| --- | --- | --- |
| **Exportar** (CSV/planilha) pessoas, presenças, lançamentos | zero — o único "export" é o zip em `var_export` PHP | a coordenação vai pedir a lista para o WhatsApp, para a gráfica, para o contador. Vai fazer print |
| **Importar** lista (planilha de contatos, base antiga) | só `agenda importar` (legado) | toda base que já existia fora do site entra à mão, uma por uma |
| **Meta** com número e data | `medidores_*` não têm alvo | "500 inscritos até 30/09" não existe como coisa que o painel saiba |
| **Tarefa atribuída** a alguém com prazo | tudo é derivado de prazo do dado (fila do dia) | "Fulano, resolve o som até quinta" vive no WhatsApp |
| **Mensagem em massa** / registro de envio | `links_whatsapp()` um a um, texto copiável | ninguém sabe quem já recebeu o D+3 |
| **Auditoria**: quem alterou ficha, evento, lançamento; quem apagou | `decididoPor` só em inscrição e fato; apagar não deixa rastro | a régua "linha do tempo derivada dos carimbos" funciona enquanto o carimbo existe — e "apagado por" não existe |
| **Território** | cidade e bairro, texto validado por catálogo | sem zona eleitoral, sem seção, sem "onde há massa para núcleo" além de bairro |
| Escala para quem **não tem conta** | `pessoas_ativas()` só devolve quem tem `usuario` | o voluntário de recepção que nunca vai logar não pode ser escalado |
| Áreas mudas no hub: `leituras`, `caixa`, `candidatos`, `aulas`, `municao`, `estudio` não declaram `pendencias_*` nem `medidores_*` | `agora.php` | o hub sabe da metade das áreas |
| Paginação | nenhuma lista pagina | ver §3 |

**Leitura da visão:** o modelo de dado está certo e o painel responde bem às
perguntas do **dia** (fila, funil, quem esfriou). O que falta é o que se
pede na **semana** e no **mês**: exportar, meta, tarefa, rastro. Nada disso
muda o modelo; tudo isso é camada em cima dele. É o horizonte B e C.

---

## 7. Visão: entrada — quem chega entende?

Um sistema que só o autor entende cresce até o autor cansar. Esta visão olha
três pessoas que chegam, o que cada uma encontra e onde tropeça.

### Militante novo

Caminho hoje: `/queroajudar` → aprovação → senha provisória → `trocarSenha`
obrigatório → hub. **Forte:** o Dia 0 (`/aulas?convite=`) abre antes da conta;
`trilhas.php` dá a trilha mínima por função (a aula, o checklist, a primeira
ferramenta); as "mesas" do hub já falam a língua da função, não da área.
**Fraco:** a primeira tela é o hub inteiro — mesas, fila, encontros, formação,
atividade — quando a pessoa só precisa de três coisas: entrar no grupo, fazer a
aula, fazer a primeira ferramenta. E a senha é atrito para quem só vai marcar
presença e assistir aula: `trocarSenha` prende a pessoa numa tela de senha antes
de ela ver qualquer valor.

### Coordenação nova no painel

Doze áreas, quatro grupos, abas em toda tela. **Forte:** selo com contagem no
menu, "Esperando você" no hub, `cabecalho_pagina()` com título e voltar, o
menu de três pontinhos sempre no mesmo lugar. **Fraco:** as três distinções que
sustentam o produto — `tipo ≠ funcoes ≠ capacidades`, *mesa × leitura*,
*pendente × aprovada × militante* — só existem no `CLAUDE.md`, que a
coordenação nunca vai ler. Nenhuma tela diz em uma linha para que serve e o
que sai dela. Não há glossário, não há ajuda dentro do painel, e a primeira
pergunta de quem chega ("onde eu aprovo gente?") só se responde clicando.

### Desenvolvedor novo

**Forte:** `CLAUDE.md` curto e normativo; testes que explicam a regra no nome
(`semana`, `fontes-unicas`, `mobile`); comentários que dizem *por quê*;
sandbox que sobe o painel inteiro com dados semeados sem instalar nada além
do PHP. **Fraco:** o deploy (push para a branch `build`, que a Hostinger puxa)
não está escrito em lugar nenhum; `arquitetura-referencia.md` tem 1.828 linhas
e é apresentado como "leia se precisar" — ninguém sabe quando precisa; não
existe um `comece-aqui`; o `sandbox.ts` sabe subir o painel local semeado e
não é exposto como script; não há um desenho do fluxo central (pessoa →
presença → inscrição → aprovação → formação → militância) — ele está
espalhado em cinco docs.

| Sintoma | Onde | Tamanho |
| --- | --- | --- |
| Hub inteiro como primeira tela do militante | `index-hub.php` | a pessoa não sabe o que fazer primeiro |
| Senha obrigatória para quem só milita | `sessao.php` (`trocarSenha`), `pessoas-acoes.php` | atrito na entrada; ver aposta 1 |
| Sem "para que serve" por tela; sem glossário; sem ajuda | `componentes.php` (`cabecalho_pagina`), painel inteiro | coordenação aprende clicando |
| Deploy não documentado; sem `comece-aqui`; referência de 1.828 linhas | `docs/` | o segundo desenvolvedor demora um dia para publicar |
| `montarSandbox()` não é script | `testes/sandbox.ts`, `package.json` | rodar o painel local é conhecimento oral |

**Leitura da visão:** o produto é compreensível para quem o construiu e
razoável para quem o usa todo dia. Para quem chega, falta a camada mais fina e
mais barata: uma frase por tela, três passos no primeiro dia, um documento de
trinta minutos. Nada disso muda código de negócio; tudo isso decide se o
sistema sobrevive a uma troca de pessoas.

---

## 8. Síntese

| Sintoma | Onde | Classe | Horizonte |
| --- | --- | --- | --- |
| Escalada `pessoas` → `adm` | `pessoas.php`, `caixa.php`, `pessoas-acoes.php` | **risco** | A |
| Gravação concorrente perde dado | `sessao.php`, APIs públicas | **risco** | A |
| Bloqueio de conta por terceiro | `index-acoes.php` | **risco** | A |
| Telas do painel sem `Cache-Control` | `layout.php` | **risco** | A |
| "Zerar" sem backup antes | `manutencao.php` | **risco** | A |
| `/candidatos` e `/programacao` sem OG | `src/app/…/page.tsx` | **conversão** | A |
| `/candidatos` sem semente | `CandidatosClient.tsx` | **conversão** | A |
| "12 funções" (são 17) | 3 arquivos | **conversão** | A |
| Rascunho ausente em fatos | `fatos-form.php` | **conversão** | A |
| Sem medição no site | `src/` | **crescimento** | A/B |
| Sem exportação CSV | painel | **crescimento** | B |
| Sem rastro de alteração/apagamento | modelo | **crescimento** | B |
| JS inline em `layout.php`; sem CSP | `layout.php` | **custo** | B |
| CI sem lint/tipos; versões não pinadas; deploy não documentado | `publish.yml`, docs | **custo** | B |
| 10 divergências doc ↔ código | docs, comentários | **custo** | B |
| Três paletas de erro, `HATCH` ×7, `2px solid` ×52, Tailwind sem uso | `src/` | **custo** | B |
| Home gorda; `privacy`/`terms` com conteúdo na page | `src/app/` | **custo** | B |
| Dois testes prometidos e não escritos; Estúdio sem teste | `testes/` | **custo** | B |
| Aula é código | `aulas-conteudo.php` | **crescimento** | C |
| Sem meta, sem tarefa, sem importação, sem território | painel | **crescimento** | C |
| Escala só para quem tem conta | `escala-comum.php` | **crescimento** | C |
| Sem paginação/índice | `pessoas-modelo.php` | **crescimento** | C |
| Sem monitoramento, sem alerta de backup | operação | **crescimento** | C |
| Hub inteiro como primeira tela; senha para quem só milita | `index-hub.php`, `sessao.php` | **entrada** | B / aposta 1 |
| Sem "para que serve" por tela, sem glossário, sem ajuda | painel | **entrada** | B |
| Deploy não documentado; sem `comece-aqui`; sandbox não é script | `docs/`, `package.json` | **entrada** | B |
| Site pede voto depois de 04/10 | `src/app/`, `eleicao.ts` | **aposta** | A (decidir) / B |
| Rastro derivado, não guardado; unidade é pessoa, não núcleo | modelo | **aposta** | C |

---

## 9. A régua (as cinco de antes, mais três)

As cinco regras dos planos de 29/08 e 10/09 continuam valendo, e ficam
escritas aqui porque aqueles arquivos saíram:

- **fica em aba** o que é recorte do mesmo objeto, na mesma sessão de trabalho;
- **sobe para o menu** o que responde pergunta própria, tem rotina recorrente
  e é aberto como destino — e só depois de a rotina ser medida;
- **sai da mesma tela** o que acontece em ritmos diferentes;
- **nunca vira scroll gigante** o que aba ou destino resolvem; bloco do hub
  tem no máximo três linhas e um link;
- **leitura e mesa são coisas diferentes.** Mesa é onde se faz (fila, quadro,
  ficha). Leitura é onde se olha (funil, mapa, contagem). Leitura não mora
  dentro de mesa.

Este plano acrescenta três:

- **Até 04/10, só entra o que protege dado ou converte.** Refatoração,
  design e dívida esperam. Sem exceção "porque é rápido".
- **Leitura sem medição é opinião.** O site ganha medição mínima antes de
  qualquer redesign — sem terceiro, sem cookie, contagem por dia e por rota,
  lida em Leituras. Quem quiser mudar a home depois disso mostra o número.
- **Rastro é dado, não log.** Onde o carimbo existente não responde "quem
  fez", o registro nasce como campo na própria peça (`alteradoEm`,
  `alteradoPor`, `apagadoEm`), e `linha_do_tempo()` passa a lê-lo. A regra
  "não crie `dados/atividade.php`" continua.

---

## 10. O plano

### A. Até a votação (11/09 → 04/10) — proteger e converter

Teto: os itens 1–9 somam cerca de **quatro dias** de trabalho. O que não
couber cai para B sem discussão. Ordem é prioridade.

1. **Trava de administração.** `exigir_admin()` em `pessoas.php` e
   `caixa.php`; `pessoas` e `caixa` saem de `areas_do_post()` e dos checkboxes
   de ajuste fino (`pessoas-ficha.php`, `inscricoes-fila.php`) — ou
   `normalizar_pessoa()` descarta as duas de quem não tem `adm`, o que prende
   também o dado antigo. Teste em `testes/acoes/pessoas.test.ts`: conta com a
   área `pessoas` e sem `adm` tenta `capacidades[]=adm` em si mesma e recebe
   recusa; tenta abrir `/painel/pessoas` e recebe `?negado=`. *Meio dia.*
2. **Trava de concorrência.** Helper `com_trava(string $arquivo, callable $fn)`
   em `sessao.php`, ao lado de `gravar_atomico()`: `flock(LOCK_EX)` num
   `<arquivo>.lock` envolvendo ler → alterar → gravar. Entra primeiro onde
   dói: `api/presenca.php` (pessoa + presença), `api/inscricao.php`,
   `api/escala.php`, `marcar_acesso()`, `registrar_envio()`,
   `registrar_postagem()`. Teste de ação: 20 POSTs paralelos em
   `presenca.php` com telefones distintos → 20 presenças em `presencas.php`.
   *Um dia.*
3. **OG próprio** em `/candidatos` ("em que número votar", com o número da
   chapa) e `/programacao` (a semana), no padrão dos cinco que já existem;
   `twitter.title` por rota; `ogCard.tsx` carrega Alfa Slab One
   (`next/og` aceita `fonts` com o `.ttf` lido do disco no build). *Meio dia.*
4. **17 funções.** Os três lugares passam a derivar de
   `catalogo.funcoes.length` (ou do JSON no build, no caso do OG). *Uma hora.*
5. **Semente de candidatos.** `src/data/candidatos.json` gerado como
   `programacao.json`, passado como `semente` ao `CandidatosClient`; a API
   sobrescreve quando responder. A página do número nunca abre vazia.
   *Meio dia.*
6. **Tentativas por IP** além de por login (`chave_visitante()` já existe em
   `limite-comum.php`): a conta só trava quando o *mesmo IP* erra cinco
   vezes; IP que erra em contas distintas trava o IP. E `X-Forwarded-For` só
   é lido se `REMOTE_ADDR` for o proxy esperado — senão `REMOTE_ADDR`.
   *Meio dia.*
7. **`Cache-Control: no-store, private`** em toda tela do painel, no mesmo
   lugar de `layout.php` que já manda `X-Robots-Tag`. Teste de fumaça
   confere o header. *Uma hora.*
8. **"Zerar" faz backup antes.** `manutencao.php` chama `fazer_backup()` e só
   apaga se o zip foi gravado; `testes/acoes/backup.test.ts` ganha o caso.
   *Uma hora.*
9. **`data-rascunho` em `fatos-form.php`.** *Uma hora.*
10. **Validação em aparelho real** — não é código. Um encontro de verdade,
    celular na mão, com a lista de dez coisas para observar (QR na porta,
    busca por telefone, duplicata, "quem convidou", tela de Pronto → Quero
    ajudar, hub sem rolar, fila do dia, três pontinhos, marcar postagem,
    voltar). O que aparecer entra em B com o nome de quem viu.
11. **Medição mínima** — se couber. `api/sinal.php`: POST público com
    `{rota, evento}` de uma lista fechada (`abriu`, `compartilhou`,
    `abriu-presenca`, `enviou-inscricao`, `passo-2`, `passo-3`), honeypot e o
    mesmo teto de `limite-comum.php`, gravando **só contagem por dia × rota ×
    evento** em `dados/sinais.php` com `com_trava()`. Nenhum identificador,
    nenhum cookie. Leituras › Semana ganha o bloco "O site". Se não couber
    antes de 04/10, é o primeiro item de B.

### B. Os trinta dias depois (05/10 → 04/11) — o que a campanha ensinou

12. **Post-mortem** em `update/`: o que Leituras respondeu e o que não; o
    item 13 de 10/09 decidido com número (Mutirão na lateral? gráfico?
    ajustes por tela?); o que o item 10 acima viu no aparelho.
13. **Exportar CSV**: pessoas (com filtro da lista), presenças por encontro,
    lançamentos do caixa. `exportar.php` + `exportar-comum.php`, só
    `adm`/`coordenacao`, UTF-8 com BOM (Excel), telefone como texto.
    `testes/acoes/exportar.test.ts`: linhas = registros, nada gravado.
14. **Rastro como campo**: `alteradoEm`/`alteradoPor` em pessoa, evento e
    lançamento, gravados por `gravar_*()` a partir de `usuario_atual()`;
    apagar pessoa e lançamento vira `apagadoEm`/`apagadoPor` (tombstone, fora
    das listas, dentro da linha do tempo); `linha_do_tempo()` lê os campos
    novos. Evento com gente na lista continua não se apagando.
15. **`painel.js`**: o JS de `fechar_pagina()` vira arquivo com
    `?v=VERSAO_ESTILO`, como `agenda-previa.js`. Depois disso, CSP com nonce
    e `frame-ancestors 'none'`. `Permissions-Policy` mínima.
16. **LGPD na ficha**: "Exportar os dados desta pessoa" (JSON do que o
    sistema tem sobre ela) e "Apagar a pedido" (tombstone do item 14, com
    `motivo = 'pedido'`). Senha provisória sai de `$_SESSION` em texto: vai
    para o recado uma vez e some.
17. **CI**: `npm ci`; `npm run lint` e `npm run test:tipos` no job;
    `engines.node` e `.nvmrc` (24); PHP mínimo **8.1** declarado em
    `docs/deploy-testes-e-limites.md` e corrigido em `api/inscricao.php:21`;
    trigger `pull_request` rodando testes sem publicar; documentar que a
    Hostinger puxa a branch `build`.
18. **Docs**: fechar as dez divergências de §3; `docs/site-publico.md` ganha a
    exceção da home; "Área nova exige" ganha `desenhar_barra_celular` e
    `pendencias_*`; `docs/painel-ui-e-permissoes.md` resolve a contradição
    sobre `lideranca` e telefone (a regra certa está em `privacidade.php` +
    `gente.php`; o doc é que está velho).
19. **Design como sistema**: `BORDA_FINA = 2` e `bordaFina()` em `theme.ts`;
    `C.erro*` como única paleta de erro (inscrição e presença migram);
    `HATCH` sai dos sete arquivos para `theme.ts`; `Voltar` e `FundoCordel`
    (iframe + véu) viram componentes em `src/components/`; `globals.css` perde
    o resto do template; **Tailwind sai** (`tailwindcss`,
    `@tailwindcss/postcss`, o `@import` e a variável do Estúdio, que passa a
    usar `--font-mono` direto) — zero uso, peso no build, e uma promessa que
    contradiz o CLAUDE.md. `testes/contrato/sombra.test.ts` ganha a borda
    fina e a paleta de erro.
20. **Home fina**: `src/app/page.tsx` → `features/home/` (`Home.tsx`,
    `data.ts` com perfil e redes); `privacy`/`terms` → `features/legal/data.ts`.
21. **Semente da programação** sem itens passados — gerada vazia, ou com um
    script que a atualiza do `agenda.json` de produção antes do build.
22. **Testes que faltam**: `fumaca/pessoas.test.ts` e a regra de
    `api/presenca.php` em `contrato/arquivo.test.ts` (prometidos em 10/09);
    fumaça mínima do Estúdio (abre, carrega modelo, exporta PNG) — o maior
    módulo do repositório não pode seguir sem rede. `contraste.test.ts` de
    contrato: toda combinação texto/fundo do tema passa AA em 14 px.
23. **Primeiros passos no hub.** Enquanto a trilha mínima de `trilhas.php`
    (entrou no grupo · fez a aula · fez a primeira ferramenta) não estiver
    completa, o hub abre com **só esses três cartões** e um "pular por hoje";
    some quando completa. Reaproveita `trilha_de()` e `retrato_de_estudo()`;
    `entrouNoGrupo` já existe na ficha. `testes/fumaca/painel.test.ts` ganha
    o caso: militante recém-aprovado vê três cartões e nenhuma seção.
24. **`/painel/ajuda`.** Uma página, gerada de `dominio.php` (`AREAS`,
    `CAPACIDADES`, `TIPOS_PESSOA`, `GRUPOS_NAV`) e de um `ajuda-comum.php`
    com três frases por área — *para que serve*, *quem abre*, *o que sai
    daqui* — mais o glossário das distinções (`tipo ≠ funcoes ≠
    capacidades`; mesa × leitura; pendente → aprovada → militante).
    `cabecalho_pagina()` passa a mostrar a frase "para que serve" como
    subtítulo da tela. Link no rodapé e na Conta. Teste de contrato: toda
    área em `AREAS` tem as três frases — área nova sem frase quebra o teste.
25. **`docs/comece-aqui.md` + `npm run painel:local`.** O documento de trinta
    minutos: rodar o site, rodar o painel, rodar os testes, publicar (a branch
    `build` que a Hostinger puxa), onde mora o quê, o vocabulário, o fluxo
    central desenhado em Mermaid (pessoa → presença → inscrição → aprovação →
    formação → militância) — o desenho vai também para
    `docs/dominio-e-fluxos.md`. O script usa `montarSandbox()` + `semear.php`
    de `testes/sandbox.ts` e sobe `php -S` com o admin de teste; hoje isso é
    conhecimento oral. `arquitetura-referencia.md` ganha no topo um índice de
    "leia isto quando…", para deixar de ser um bloco de 1.828 linhas.

### C. Crescimento (nov/2026 →) — o movimento depois do pleito

26. **Aula editável no painel** sem abrir mão de versionar:
    `aulas-conteudo.php` continua sendo a fonte no repositório, e
    `dados/aulas-texto.php` guarda **sobrescritas por bloco** (patch, chaveado
    por `dia/aula/bloco`), editadas em `/painel/aulas?aba=conteudo` por
    `coordenacao`. `api/aulas.php` aplica o patch ao servir. O commit vira
    "consolidar": desenvolvedor copia o patch para a constante e zera o
    arquivo. A regra "muda por decisão" fica; muda quem aperta.
27. **Metas**: `dados/metas.php` (`medidor`, `alvo`, `ate`), editado pela
    coordenação em Leituras › Semana; `medidores_*` que tiverem alvo mostram
    "x de y" e o degrau de atenção passa a considerar o ritmo.
28. **Tarefa com dono e prazo**: um tipo novo de pendência, gravado em
    `dados/tarefas.php`, declarado por `pendencias_tarefas()` e entrando no
    hub pelo mesmo registro de `ORDEM_AGORA`. Nasce como aba de Encontros
    ("Tarefas do encontro") e de Gente ("O que pedi"), não como área — a
    régua de 29/08 vale: sobe para o menu quando o uso provar.
29. **Escala para quem não tem conta**: `pessoas_ativas()` ganha o irmão
    `pessoas_escalaveis()` (militante ou apoiador com telefone, com ou sem
    `usuario`); o convite por token já não exige login.
30. **Importar planilha**: CSV → `normalizar_pessoa()` por linha →
    `duplicatas_de_pessoas()` contra a base → tela de revisão → `aprovar-lote`
    ou "só cadastrar". Reaproveita tudo o que existe; o que nasce é a tela de
    revisão e o parser.
31. **Território**: `zona` (eleitoral) como campo opcional da pessoa, com
    catálogo do TRE-CE como `municipios-ce.json`; Leituras › Território
    agrupa por zona antes de bairro. Mapa só quando uma pergunta não couber
    em lista.
32. **Áreas mudas no hub**: `caixa`, `candidatos`, `aulas`, `municao` e
    `leituras` declaram pelo menos `estado_*()` (uma linha na mesa); o teste
    de contrato passa a exigir de toda área em `ORDEM_AGORA`.
33. **Escala do dado**: quando `pessoas.php` passar de ~2.000 fichas —
    medir antes: Leituras › Semana mostra o tempo de `usuario_atual()` —
    índice por telefone e por id em arquivo separado, e paginação em
    `pessoas-lista.php` e `procurar.php`. Banco de dados é decisão com número,
    não reflexo.
34. **Estúdio**: confirmar que os 38 MB de `/modelos/` só carregam sob demanda
    e nunca entram no first load de rota pública; considerar servir por CDN da
    hospedagem; um gerador de PNG comum (`src/lib/cartaz.ts`) para Munição,
    pôster e colinha.
35. **Operação**: uptime externo gratuito apontado para `/` e `/painel/`;
    cron que confere se `dados/backups/` tem zip com menos de 36 h e avisa
    (e-mail da hospedagem serve); `error_log` para `dados/erros.log` fechado
    pela web, com rotação, lido em Manutenção.
36. **Segundo par de mãos**: o repositório tem um autor. `CONTRIBUTING.md`
    curto (o `CLAUDE.md` já é 80% disso) e PR obrigatório com CI verde
    (item 17). Não por burocracia — porque o dia em que o único autor não
    puder publicar, alguém precisa conseguir.

### D. Coragem — apostas que saem do natural

Tudo acima é o caminho natural: consertar, separar, documentar. É necessário
e não é suficiente — um produto que só conserta vira uma versão melhor do que
já é. Esta seção é o que **muda a natureza** da coisa: apostas que não saem de
sintoma nenhum da tabela, e sim da pergunta "o que este sistema poderia ser que
nenhum outro é?".

Nenhuma aposta vale o dado de uma pessoa. Por isso todas obedecem ao mesmo
**cinto de segurança**, e é ele que permite ser ousado:

1. **Nasce ao lado, nunca no lugar.** O arquivo, a tela e a rota velhos
   continuam funcionando até a aposta provar. Ninguém acorda com o painel
   diferente.
2. **Dado migra por script idempotente** que lê os `dados/*.php` de hoje;
   rodar duas vezes dá o mesmo resultado. `normalizar_pessoa()` continua sendo
   o schema — o que ela não conhece, não existe.
3. **Teste de equivalência.** Toda forma nova de guardar ou derivar tem um
   teste em `testes/contrato/equivalencia.test.ts` que, na sandbox semeada,
   prova que a projeção nova reproduz o `pessoas.php` / `presencas.php`
   atual campo a campo. Vermelho, não migra.
4. **`fazer_backup()` antes de qualquer migração**, e o caminho de volta
   escrito antes do caminho de ida.
5. **Sessenta dias para provar.** Aposta que não mudou uma rotina em sessenta
   dias sai — e o script de volta é o que a tira.

#### Aposta 1 — Militante sem senha

*O que é.* Cada militante tem um link pessoal (`/painel/meu-dia?t=…`) que
abre "Meu dia": próximo encontro (com o botão de confirmar), próxima aula, a
peça da semana, minha gente se lidera. Sem login, sem senha, sem
`trocarSenha`.
*O que quebra do natural.* Hoje toda pessoa que faz algo no painel tem conta.
Aqui a **conta com senha vira coisa de quem opera** (coordenação,
comunicação, adm); quem *milita* nunca vê uma tela de senha. Metade do atrito
de entrada some.
*O que reaproveita.* `token_de_escala()` em `escala-comum.php` já é
exatamente isso — HMAC de ids com `hash_equals`, sem login — para o convite
da peça. `pendencias_*`, `trilhas.php` e `registrar_postagem()` já sabem
responder por pessoa.
*Como não perde dado.* Nada muda no modelo: `usuario` e `hash` já são
opcionais. A ficha ganha `tokenVersao` (inteiro) — revogar é somar um.
*Risco.* Link vaza = alguém vê a agenda de outro. Mitigação: a tela não
mostra dado de terceiro (a "minha gente" sai encoberta como `gente.php` já
faz para quem não é coordenação), não tem ação destrutiva, e o token expira
com `tokenVersao`. O que exige conta continua exigindo conta.
*Horizonte.* Nasce em B como `?t=` só na `/aulas` (que já aceita `?convite=`
para o Dia 0); vira "Meu dia" em C.

#### Aposta 2 — A pessoa como linha do tempo

*O que é.* Em vez de 39 campos em `pessoas.php` + `presencas.php` +
`aulas-progresso.php` + `mutirao.php`, cada pessoa é uma **sequência de
fatos**: `chegou`, `confirmou`, `veio`, `aprovada`, `estudou`, `postou`,
`alterada por`, `apagada por`. Os quatro arquivos de hoje viram **projeções**
geradas a partir da sequência.
*O que quebra do natural.* Hoje a linha do tempo é *derivada* dos carimbos
que sobraram, e "quem apagou" não existe porque nenhum carimbo o guarda. Aqui
o rastro **é** o dado, e toda leitura — funil, reativação, prontidão — vira um
`reduce` sobre a sequência. O item 14 (rastro como campo) deixa de ser
necessário: é o caso particular.
*O que reaproveita.* `linha_do_tempo()` em `atividade-comum.php` já é a
leitura desses eventos, só que ao contrário (dos carimbos para a lista);
`gravar_atomico()` e `com_trava()` (item 2) guardam o arquivo;
`normalizar_pessoa()` continua sendo a forma da projeção.
*Como não perde dado.* O script lê os quatro arquivos e emite os eventos que
os carimbos permitem (`criadoEm` → `chegou`, `decididoEm` → `aprovada`,
presença → `veio`…). O teste de equivalência prova que projetar a sequência
devolve os quatro arquivos iguais aos de hoje. **Nenhuma tela muda no
primeiro passo**: todas continuam lendo a projeção.
*Risco.* Alto — é a mudança de maior alcance do documento. Por isso nasce como
`dados/eventos-pessoa.php` escrito **em paralelo** (dual-write) por sessenta
dias, lido só por Leituras › Atividade; só depois de dois meses de
equivalência verde em produção vira fonte, e as projeções passam a ser
geradas.
*Horizonte.* C, e por último entre as apostas.

#### Aposta 3 — O cordel que se preenche

*O que é.* A trilha de cada militante como um **folheto de cordel** que ganha
uma xilogravura a cada passo — Chegou · Veio · Estudou · Fez · Trouxe —
visível em `/aulas` e no "Meu dia", compartilhável como imagem (o `ogCard`
já desenha nesse estilo). A coordenação vê quantos folhetos estão em cada
página.
*O que quebra do natural.* É gamificação **sem ponto e sem ranking** — não
"quem fez mais", e sim "onde cada um está" — na identidade visual do site,
não num widget genérico. É o simétrico de `reativacao.php`: aquele lista quem
esfriou; este mostra quem cresceu.
*O que reaproveita.* `trilhas.php`, `retrato_de_estudo()`, `HATCH`, o
gerador de cartaz (item 34), `presencas` e `origem` (o "Trouxe" é `?de=`).
*Como não perde dado.* Cem por cento derivado. Não grava nada.
*Risco.* Baixo. O único risco é ficar bonito e ninguém abrir — o item 11
(medição) responde.
*Horizonte.* B/C — a primeira aposta a entrar, porque é barata e é a que
melhor explica o movimento para quem chega.

#### Aposta 4 — Núcleo como unidade

*O que é.* Hoje as unidades do sistema são **pessoa** e **encontro**. Leituras
› Território já diz "onde há massa para núcleo" — e nada cria um. `nucleo`
(bairro ou cidade + líder + gente) vira coisa de primeira classe: `gente.php`
passa a ser a tela do núcleo, um encontro pode ser "do núcleo", Leituras conta
por núcleo, a Munição pode escalar por núcleo.
*O que quebra do natural.* A liderança deixa de ser um **recorte** (a decisão
de 10/09, certa para a campanha) e vira **estrutura**. É a forma que o
movimento precisa ter depois de 04/10, quando não há mais eleição para
organizar o calendário.
*O que reaproveita.* `lider`, `bairro`, `cidade`, `minha_gente()`,
`militancia_por_regiao()`, `pode_liderar()`.
*Como não perde dado.* `dados/nucleos.php` é arquivo novo; a pessoa ganha
`nucleo` opcional, preenchido pelo script a partir de `lider` (núcleo = as
pessoas de cada líder, batizado pelo bairro mais frequente). Sem `lider`, sem
núcleo — nada é inventado.
*Risco.* Médio — muda o vocabulário do movimento, e vocabulário só muda com
as pessoas. Decidir depois do post-mortem (item 12), com a coordenação.
*Horizonte.* C.

#### Aposta 5 — O site sobrevive ao candidato

*O que é.* `faseEm()` já sabe que existe `depois`; hoje só a Munição obedece.
A home, a programação e o `/queroajudar` ganham uma versão `depois`: sem
número, sem "vote", com encontros, formação e núcleos no centro — o site do
movimento, na mesma URL.
*O que quebra do natural.* Site de campanha morre em 05/10 — ou vira um
cartaz velho. Este é desenhado para **não morrer**: a fase é decidida no
cliente, como as outras já são, e o texto de cada fase mora em `data.ts`.
*O que reaproveita.* `eleicao.ts`, `FaixaEleicao`, todas as features; nada de
rota nova.
*Como não perde dado.* Nenhum dado envolvido.
*Risco.* Baixo. Custo médio — é texto, e texto é decisão da coordenação.
*Horizonte.* **A para decidir e escrever** (é a única aposta com prazo antes
de 04/10: no dia 05 a home não pode pedir voto); B para ligar.

#### Aposta 6 — Presença sem sinal

*O que é.* `/presenca` grava em IndexedDB quando o `fetch` falha e sincroniza
quando a rede volta; o `manifest.ts` já faz do site um PWA instalável.
*O que quebra do natural.* O sistema deixa de supor que há Wi-Fi na porta da
igreja. O `limite-comum.php` já descreve trinta celulares no mesmo QR; este
descreve trinta celulares sem sinal.
*O que reaproveita.* `api/presenca.php` (reconcilia por telefone + encontro;
com `com_trava()` do item 2 vira idempotente), `CHAVE_RASCUNHO`, a validação
de `inscricao/validacao.ts`.
*Como não perde dado.* O servidor continua a fonte; o cliente só enfileira e
reenvia. Reenvio duplicado cai na reconciliação por telefone que já existe.
*Risco.* Baixo. A pessoa precisa deixar a aba aberta até sincronizar — a
tela diz isso.
*Horizonte.* B, depois de validar em aparelho real (item 10) se sinal é
mesmo o problema.

#### Aposta 7 — Leituras que fala

*O que é.* Cada aba de Leituras ganha um parágrafo **gerado por regra** a
partir dos números: "Esta semana chegaram 12 pessoas; 5 vieram do encontro de
sábado; 3 já militam. Messejana passou de 10 e ainda não tem núcleo. O
mutirão teve 7 de 11." Com botão de copiar, para mandar no grupo da
coordenação.
*O que quebra do natural.* Leitura deixa de ser tabela que se interpreta e
vira texto que se manda. É o oposto do "gráfico" que o item 13 do plano
anterior perguntava: não é mais visual, é mais falado.
*O que reaproveita.* `funil_de_origens()`, `militancia_por_regiao()`,
`funil_de_encontros()`, `panorama_de()`, `semana_de()` — só o texto é novo.
*Como não perde dado.* Nada gravado.
*Risco.* Baixo. **IA generativa fica fora por decisão**: dado pessoal não
sai para terceiro. Se um dia entrar, é só sobre os agregados de Leituras, e
depois de a versão por regra provar que alguém lê.
*Horizonte.* B.

#### Aposta 8 — O movimento como produto instalável

*O que é.* `dominio.php` (CARGOS, REDES), a chapa, o número, a paleta e os
contatos viram um único `dados/movimento.php`, e o site lê nome, número e
cores de lá. Outro núcleo, outra cidade, outra candidatura instala o mesmo
código com outro arquivo.
*O que quebra do natural.* felipesmoreira.com deixa de ser um site e vira
uma **ferramenta** — o que o `Manual-da-Militancia.md` já é em papel.
*O que reaproveita.* Tudo; é configuração.
*Como não perde dado.* Nenhum dado envolvido.
*Risco.* Baixo tecnicamente, **alto em foco**: é o tipo de projeto que rouba
um mês. Só depois de C provar o resto.
*Horizonte.* Depois de C.

#### A régua da coragem

- **Uma aposta por vez.** Duas ao mesmo tempo é nenhuma provada.
- **Ordem:** 5 (decidir agora, ligar em B) → 3 → 7 → 6 → 1 → 4 → 2 → 8. A
  que mais protege vai antes; a que mais muda vai por último, com o cinto
  inteiro.
- **Nenhuma antes de 04/10** fora a decisão da 5.
- Aposta que muda dado (2, 4) só entra com `equivalencia.test.ts` verde na
  sandbox **e** em cópia do backup de produção.

---


## 11. O que não fazer

- **Não refatorar antes de 04/10.** Fora os itens 1–9, nada. O mais tentador
  é o item 19 — é o que mais coça e o que menos vale voto.
- **Não trocar arquivo por banco** por reflexo. `flock` + índice resolvem até
  a casa dos milhares; banco é o item 33, com número na mão.
- **Não criar `dados/atividade.php`** nem cache de leitura. Rastro é campo na
  peça (§9).
- **Não pôr analytics de terceiro** no site. A medição é a do item 11: sem
  identificador, sem cookie, contagem por dia.
- **Não renomear `kit-*`, `api/kit.php` nem `/kit`.** Não tocar
  `next.config.ts`, `publish.yml` (fora `RewriteRule` de rota nova), o
  `.htaccess` gerado, `conceito.html`.
- **Não adotar Tailwind "de vez"** para justificar a dependência. Zero uso em
  dezessete meses é resposta; remover é mais barato que começar.
- **Não promover nada para o menu** sem rotina medida — a regra de 29/08.
  Tarefas, Importar e Exportar nascem como aba ou botão.
- **Não fazer duas apostas ao mesmo tempo**, e não migrar dado sem o teste de
  equivalência verde na sandbox e numa cópia do backup de produção.
- **Não deixar a nota subir por sensação.** Reavaliar com os mesmos critérios,
  nas datas marcadas, e escrever a nota nova ao lado da velha neste arquivo.

## 12. Como saber que deu certo

- Uma conta com a área `pessoas` e sem `adm` **não** consegue se dar `adm` —
  teste vermelho antes do item 1, verde depois.
- Vinte celulares no mesmo QR ao mesmo tempo = vinte presenças gravadas.
- A prévia do WhatsApp de `/candidatos` mostra a chapa e o número; a de
  `/programacao`, a semana.
- Nenhuma tela do painel entra no cache do navegador.
- "Zerar tudo" deixa um zip de um minuto atrás em `dados/backups/`.
- A coordenação tira o CSV de pessoas em um clique e nunca mais manda print.
- "Quem apagou" aparece na linha do tempo.
- `npm run lint` e `test:tipos` rodam no CI, e um PR com aviso não publica.
- O post-mortem de 05/10 é escrito com os números de Leituras e do item 11,
  não com impressão.
- Uma segunda pessoa consegue publicar o site lendo só `docs/comece-aqui.md`.
- Uma coordenadora que nunca abriu o painel chega à fila do dia em cinco
  minutos, com `/painel/ajuda` e sem perguntar a ninguém.
- Um militante recém-aprovado vê três cartões, não dez blocos.
- No dia 05/10 a home não pede voto.
- **A nota de 05/10 é ≥ 7,5 e a de 11/12 é ≥ 8,5**, com os mesmos critérios
  desta tabela — e as duas estão escritas aqui, ao lado da de 11/09.
