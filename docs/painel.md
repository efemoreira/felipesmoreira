# Painel — felipesmoreira.com/painel

Painel administrativo do site. Roda no PHP da Hostinger, ao lado do site estático
gerado pelo Next. Sete áreas hoje: **Agenda e eventos**, **Estúdio de artes**,
**Formação da militância**, **Fatos do dia**, **Produção**, **Encontros** e
**Inscrições**.

Desde a reorganização de arquitetura do site, o painel também expõe uma API
JSON em `public/painel/api/` para o Next.js consumir (ex: saber se o visitante
está logado e em que áreas). Ver `CLAUDE.md` na raiz do repo para o contrato
completo entre o site estático e este painel.

> Este arquivo mora em `docs/` de propósito: nada em `public/` fica fora do ar,
> e explicar o mecanismo de recuperação numa URL pública não ajuda ninguém.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `public/painel/sessao.php` | Núcleo: sessão, usuários, permissões. Todos os outros começam por aqui. |
| `public/painel/layout.php` | A moldura: lateral agrupada, barra do celular, cabeçalho de tela e o tema. |
| `public/painel/index.php` | Login, criação do primeiro admin e o hub: mesa da função, fila do dia, encontros e formação. |
| `public/painel/agora.php` | Fonte única do que está pendente — a fila do hub e o contador do menu saem daqui. |
| `public/painel/agenda.php` | Editor da programação da semana. |
| `public/painel/estudio.php` | Porteiro do estúdio: serve o `estudio.html` do build e carimba nele o tema e quem está logado. |
| `public/painel/aulas.php` | Gestão da formação: pendura o vídeo de cada aula e mostra quem estudou. |
| `public/painel/aulas-conteudo.php` | O currículo (6 Dias, 30 aulas), traduzido do manual da militância. |
| `public/painel/aulas-comum.php` | Vídeo e progresso das aulas — lê e grava `dados/aulas*.php`. |
| `public/painel/checklists.php` | Os "Pronto quando" do manual, por id. Usados pelas aulas e pelas ferramentas. |
| `public/painel/fatos.php` | Ficha de Fato do Olheiro + fila da Checagem. |
| `public/painel/fatos-comum.php` | Dados dos fatos e as travas (fonte obrigatória, janela de 48h). |
| `public/painel/producao.php` | O quadro A fazer → Fazendo → Revisão → Publicado. |
| `public/painel/producao-comum.php` | Dados dos cards, regra do ledger e o nome de arquivo do Acervo. |
| `public/painel/eventos.php` | Os encontros: cinco peças, lista de presença e funil. |
| `public/painel/eventos-comum.php` | Dados dos encontros e dos contatos, playbooks das 5 famílias. |
| `public/painel/usuarios.php` | Gestão de usuários — só admin. |
| `public/painel/conta.php` | Cada um troca a própria senha. |
| `public/painel/tema.php` | Grava o cookie do tema (claro/escuro/sistema) e volta para a página. |
| `public/painel/painel.css` | Visual das telas. |
| `public/painel/api/sessao.php` | Endpoint JSON: quem está logado e em quais áreas. Consumido pelo Next.js. |
| `public/painel/api/aulas.php` | Endpoint JSON da formação: currículo, vídeos e progresso. Consumido por `/aulas`. |
| `public/painel/api/presenca.php` | Endpoint **aberto** da lista de presença. Consumido por `/presenca`. |

## Onde ficam os dados

Tudo em `public_html/dados/`, **fora do repositório** — um deploy novo nunca
apaga o que foi editado no painel:

- `usuarios.php` — os usuários, com a senha em hash bcrypt.
- `agenda.json` — a agenda que a página `/programacao` lê.
- `imagens/` — as fotos enviadas nos itens da agenda.
- `backups/` — as 12 últimas versões da agenda.
- `tentativas.php` — contador de tentativas de login, por login.
- `inscricoes.php` — quem se inscreveu em `/quero-ajudar`, com telefone e e-mail.
- `inscricoes-limite.php` e `segredo.php` — teto de envios do formulário público.
- `aulas.php` — qual vídeo do YouTube está pendurado em cada aula, e se está publicado.
- `aulas-progresso.php` — quem concluiu qual aula.
- `fatos.php` — as Fichas de Fato e o status de cada uma.
- `producao.php` — os cards do quadro, com histórico.
- `eventos.php` — os encontros, com checklist marcado e quem responde por cada peça.
- `leads.php` — quem foi convidado e quem compareceu, **com telefone**.

O **texto** das aulas não fica em `/dados`: ele é versionado em
`public/painel/aulas-conteudo.php`, porque é conteúdo editorial, não dado de
uso. Trocar uma aula é um commit, não um clique.

O `.htaccess` dessa pasta é **fechado por padrão**: bloqueia o download de
qualquer `.php` e de qualquer `.json`, e abre exceção só para o `agenda.json`,
que a página `/programacao` precisa ler. As fotos em `imagens/` continuam
públicas — a regra é por extensão e elas são `.jpg`.

Por isso todo arquivo com dado sensível é `.php` retornando array: hash de
senha, telefone e e-mail de inscrição, contador de tentativas.

Se existir um `dados/config.php` do painel antigo (senha única, sem usuários),
ele é **ignorado** e pode ser apagado.

Se existir um `dados/tentativas.json` (versão antiga, que ficava legível pela
web), ele é **apagado sozinho** no primeiro acesso ao painel.

## Primeiro acesso

Assim que o deploy subir, abra `felipesmoreira.com/painel/`. Como ainda não existe
nenhum usuário, a tela oferece **criar o primeiro administrador**.

> **Faça isso na hora.** Enquanto não existir nenhum usuário, quem chegar em
> `/painel/` pode criar o administrador. A janela é curta, mas é real.

Depois disso a tela vira o login normal e o cadastro de novos usuários só sai
pelo `usuarios.php`.

## Papéis e áreas

- **Administrador** — abre todas as áreas, marcadas ou não, e é o único que
  gerencia usuários. O painel não deixa ficar sem nenhum admin ativo: não dá para
  se rebaixar, se desativar nem remover o último.
- **Editor** — abre só as áreas marcadas. Sem marcação nenhuma, entra e vê um
  painel vazio.

As áreas se dividem em duas naturezas, e vale entender a diferença antes de
marcar caixa:

- **Ferramentas do dia** (Formação, Fatos, Produção, Encontros) — é onde o
  trabalho acontece. O padrão é liberar as quatro para todo militante: elas não
  pertencem a uma função, e o Olheiro que quiser entender o quadro de Produção
  deve conseguir abrir. A constante `AREAS_FERRAMENTA` em `sessao.php` marca
  quais são.
- **Decisão e dado pessoal** (Agenda e eventos, Estúdio, Inscrições) — o que vai
  ao ar, quem entra no movimento e a lista de contatos com telefone. Libere para
  quem coordena.

**A função da pessoa não limita nada.** Ela define só a *mesa* que aparece no topo
do painel — o cartão com a ferramenta daquela função, o estado do trabalho nela e
o botão com o verbo certo ("Trazer um fato", "Checar a fila"). Montada a partir do
`funcoes` do usuário; ver `MESA_DA_FUNCAO` e `mesas_de()` em `agora.php`.

A função também decide qual das cinco peças de um encontro o painel destaca para
a pessoa: os ids das funções do grupo Eventos no `funcoes.json` são exatamente as
chaves de `PECAS` (`peca_da_pessoa()`).

Tirar uma permissão vale na hora: a sessão é conferida contra o disco a cada
requisição, não fica presa ao que valia no login.

## Senha esquecida

Só o hash é guardado. **Não existe descobrir a senha, existe trocar.**

1. **Se outra pessoa é admin** — ela abre `usuarios.php`, clica em *Resetar senha*
   do seu login e passa a senha provisória que aparece na tela. Essa senha só
   aparece uma vez, e quem entrar com ela é obrigado a trocar na hora.

2. **Se você é o único admin e esqueceu** — apague `public_html/dados/usuarios.php`
   pelo Gerenciador de Arquivos do hPanel. O painel volta à tela de primeiro
   acesso e você cria o administrador de novo.
   *Isso apaga todos os usuários* — os outros terão de ser recadastrados. A agenda
   e as imagens não são afetadas.

## Regras de senha

- Mínimo de 8 caracteres.
- 5 tentativas erradas travam **aquele login** por 15 minutos. Errar o seu não
  atrapalha o de mais ninguém.
- Sessão cai depois de 2 horas parada.
- Senha provisória é gerada pelo painel em blocos legíveis (`abcd-efgh-ijkl`,
  sem `l`, `o`, `0` ou `1`), para passar por telefone sem erro.

## Agenda da semana

Cada item é um bloco que recolhe. Com a semana cheia, o cabeçalho mostra cor,
título, dia, hora e plataforma sem precisar abrir. Dentro, uma prévia desenha o
cartão como ele vai sair em `/programacao`.

- **Reordenar** — arraste pelo `⠿`, ou use `↑` `↓` (o caminho de teclado).
- **Imagem** — arraste o arquivo para a miniatura, cole com `Ctrl+V` com o item
  em foco, ou clique na miniatura.
- **Sair sem publicar** avisa. Se a gravação falhar, o formulário volta com tudo
  que foi digitado — não é preciso refazer.
- O envio inteiro é barrado no navegador quando as imagens somam mais de 8 MB:
  o servidor recusaria o POST e o trabalho todo se perderia junto.

## Estúdio de artes

Roda inteiro no navegador, nada sobe para o servidor.

**Formatos:** Feed 4:5, Stories 9:16, Quadrado 1:1, Capa/vídeo 16:9,
Link 1.91:1 e Personalizado (320 a 4096 px). Trocar de formato reposiciona as
camadas em proporção e reescala os tamanhos sem distorcer.

**Atalhos:**

| Tecla | O que faz |
|---|---|
| `⇧` ou `⌘` + clique | junta a camada à seleção |
| `Alt` + clique | pega a camada de baixo |
| `⇧` ao arrastar | trava o eixo |
| `P` | vê sem guias nem alças |
| `Esc` | desmarca tudo |
| `⌘A` | seleciona todas as destravadas |
| `⌘Z` / `⌘⇧Z` | desfaz / refaz |
| `⌘D` | duplica |
| `[` `]` | manda para trás / para a frente (com `⇧`, até o fim) |
| setas | move 1 px (com `⇧`, 10 px) |
| `⌘0` | ajusta o zoom à janela |
| `⌘V` | cola uma imagem da área de transferência |

Arrastar um arquivo para o palco cria a camada onde foi solto: **PNG** vira
pessoa recortada, **JPG/WEBP** vira foto de contexto. Com uma camada de imagem
já selecionada, o arquivo só troca o conteúdo dela.

Com duas ou mais camadas selecionadas, o inspetor troca para alinhar, distribuir,
ordenar e mexer em opacidade, visibilidade e travas de uma vez.

## Formação da militância

O manual da militância virou curso, em `/aulas` (site) e `/painel/aulas`
(gestão). São 6 Dias, 30 aulas.

**Pista Rápida e Pista Lenta.** Cada Dia abre com uma 🚗 **Pista Rápida** — o
caminho macro, e quem fizer só as rápidas já consegue trabalhar. Em seguida vêm
as **Pistas Lentas**, que aprofundam ou reforçam para quem precisar. É isso que
deixa acrescentar conteúdo profundo depois sem atrasar o avanço de todo mundo:
aula nova entra como `lenta` no Dia certo, e o caminho principal não muda.

**O texto está pronto; o vídeo é opcional.** Cada aula já nasce com o conteúdo
escrito, então a área funciona sem gravar nada. Em `/painel/aulas` a coordenação
cola o link do YouTube e marca *Mostrar o player* — enquanto não marcar, o link
fica guardado e ninguém vê. Use vídeo **não listado**.

**Onde mexer no conteúdo.** Em `aulas-conteudo.php`, não pelo painel. Os blocos
possíveis são `texto`, `passos`, `lista`, `checklist`, `nunca`, `modelo`,
`aviso` e `tabela` — o site só sabe desenhar esses. Um `checklist` referencia um
id de `checklists.php`, e nunca repete o texto: o mesmo array alimenta a aula e a
ferramenta que usa aquela conferência no dia a dia.

**Por que o conteúdo não está no build do Next.** O site é export estático, e
tudo que entra no bundle é público. O manual é documento interno, então o texto
sai só pelo `api/aulas.php`, para quem tem a área `aulas`. Quem abrir `/aulas`
sem acesso não baixa uma linha do conteúdo. Pela mesma razão a página não usa
rota dinâmica por aula: isso geraria um HTML público por aula. O link direto é
por âncora — `/aulas#olheiro`.

**As duas fases eleitorais.** O manual em `update/Manual-da-Militancia.md` foi
escrito em pré-campanha e só descreve aquele período. O currículo cobre os dois:
a aula *Antes da campanha e durante a campanha* (Dia 0) traz a tabela do que
muda — pedido de voto, número de urna, carreata, material impresso, captação de
recurso — e as aulas de Público, Relacional, Divulgação e Roteirista dizem o que
vale em cada fase.

Ao escrever conteúdo novo, use **"antes da campanha"** e **"durante a
campanha"**, nunca a data de virada: ela muda a cada eleição e deixaria a aula
desatualizada sem ninguém perceber.

## Fatos do dia

Substitui o canal `#fatos` e o `pendentes.md`. O Olheiro preenche a Ficha de
Fato; a Checagem abre o link e decide.

Duas travas do manual viraram código, e as duas recusam a gravação:

- **Sem link de fonte primária não grava.** Print não é fonte, e sem link a
  Checagem não tem o que abrir.
- **Só entra fato das últimas 48h.** A exceção do manual — desdobramento novo de
  algo mais antigo — existe, mas precisa ser declarada numa caixa própria. É
  exceção explícita, não tácita.

Marcar um fato como pendente exige o motivo escrito: sem ele ninguém sabe o que
faltou para destravar depois. Pendente não é lixo — o fato fica guardado.

**A fila é ordenada do mais antigo para o mais novo**, de propósito: a meta é
"nada dorme sem status", e ordenar pelo mais recente esconderia o atrasado.

## Produção

O quadro que substitui o Trello: A fazer → Fazendo → Revisão → Publicado.

**O card nasce sozinho** quando a Checagem aprova um fato — já com o título, a
fonte e o responsável colados nele. É essa ligação que justifica ter o quadro
aqui dentro em vez de num Trello: lá o link é copiado à mão e ninguém confere.

- Só o card de **roteiro** nasce automático. Arte e vídeo se abrem a partir dele,
  quando o roteiro pedir.
- **Publicar é diferente de mover:** pede o link do post (é o que o Acervo indexa)
  e passa pela **regra do ledger** — se o mesmo responsável já foi alvo principal
  de algo publicado há menos de 48h, aparece o aviso e é preciso marcar ciência.
  Avisa, não bloqueia: às vezes o desdobramento do mesmo caso é a pauta certa.
- O **nome de arquivo** do manual (`AAAA-MM-DD_tipo_assunto`) é gerado pelo card.
  Padrão só sobrevive quando ninguém precisa lembrar dele.

Sem arrastar e soltar de propósito: a maioria abre no celular, onde arrastar
entre quatro colunas briga com a rolagem da página.

## Encontros

As cinco peças do manual (Local & Hora, Logística, Divulgação, Gravação,
Recepção), cada uma com o checklist de `checklists.php` — o mesmo texto que a
aula ensina. Escolher a família carrega o playbook e as travas dela.

**Uma lista de pessoas por encontro, não duas.** O manual tem duas planilhas —
RSVP da Divulgação e leads da Recepção — mas elas descrevem a mesma pessoa em
dois momentos. Aqui a mesma ficha ganha *confirmou* e *compareceu*.

**Quem faz o quê:**

| Ação | Precisa de |
|---|---|
| Marcar checklist, confirmar presença, cadastrar quem chegou | `eventos` |
| Criar, editar e cancelar encontro | `agenda` |
| Ver a lista inteira com telefone, cobrar o follow-up | `agenda` |

Quem cadastrou uma pessoa continua enxergando o telefone dela — foi essa pessoa
que digitou o número, esconder dela não protege ninguém. Para os demais o
telefone aparece encoberto (`(85) 9••••-••63`).

**Follow-up:** D+0 agradecer, D+3 mandar conteúdo, D+7 convidar para o próximo.
A tela lista quem está vencido. Só entra no funil quem compareceu.

### A página pública de presença

`/presenca?e=<token>` é o QR da mesa da Recepção: a pessoa se cadastra no
próprio celular. É o **segundo e último** ponto do sistema aberto sem login, e
segue as mesmas regras do formulário de inscrição — honeypot silencioso, teto de
envios por visitante (IP embaralhado), conferência de `Origin`, consentimento
LGPD registrado com data e versão. Sem CSRF, porque visitante anônimo não tem
sessão para proteger.

O token é conferido antes de o formulário aparecer: link velho ou de encontro
cancelado não pede dado de ninguém.

## URLs

O `.htaccess` gerado no workflow mapeia as URLs limpas:

```
/painel/            → index.php
/painel/agenda      → agenda.php
/painel/estudio     → estudio.php
/painel/aulas       → aulas.php
/painel/fatos       → fatos.php
/painel/producao    → producao.php
/painel/eventos     → eventos.php
/painel/usuarios    → usuarios.php
/painel/conta       → conta.php
```

Os endpoints em `public/painel/api/` não têm URL limpa — não são feitos para
digitar no navegador, só para o Next.js chamar pelo caminho real
(`/painel/api/sessao.php`). Como são arquivos de verdade no `out/`, o Apache já
os serve direto pela primeira regra do `.htaccess` (arquivo existe → serve),
sem precisar de `RewriteRule` específica.

O `estudio.html` gerado pelo Next fica bloqueado no `.htaccess` de `/painel`:
a única forma de recebê-lo é pelo `estudio.php`, depois da conferência de sessão.
