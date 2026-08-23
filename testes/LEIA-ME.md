# Testes

Três tipos, e a divisão é o que importa:

| pasta | responde | roda em |
|---|---|---|
| `contrato/` | as duas cópias da mesma regra continuam concordando? | ~1s |
| `acoes/` | a gravação faz o que promete, e recusa o que promete recusar? | ~35s |
| `fumaca/` | toda tela do painel abre inteira e em silêncio? | ~4s |

```sh
npm test              # os três
npm run test:contrato
npm run test:acoes
npm run test:fumaca
npm run test:tipos    # tsc do site e tsc dos testes
```

## Por que sem framework de teste

Node 24 traz `node:test` e roda `.ts` direto, sem etapa de compilação. Um
framework aqui seria uma dependência a mais para fazer o que já vem na caixa —
e este repositório publica um export estático numa hospedagem compartilhada:
cada dependência é uma que alguém vai ter de auditar antes de um deploy de
campanha.

O preço é um detalhe de configuração: os testes importam com a **extensão no
caminho** (`from "./ponte.ts"`), que é o que o Node exige. Por isso `testes/`
tem `tsconfig.json` próprio e está no `exclude` do da raiz.

## `contrato/` — o que os dois lados prometem um ao outro

O site é Next estático e o backend é PHP. Várias regras existem **duas vezes**,
uma em cada linguagem, e o `CLAUDE.md` registra cada par como "os dois têm de
concordar". Concordar por combinado é o que funciona até alguém mexer num lado
só — e a divergência é sempre silenciosa: as duas linhas existem, e as duas
parecem certas.

| teste | o par | o que dói se divergir |
|---|---|---|
| `origem` | `slugDe()` ↔ `normalizar_origem()` | o mesmo militante vira duas origens no relatório |
| `tempo` | `estadoDe()` ↔ `estado_do_evento()` | o painel diz que acabou e o site ainda mostra "AO VIVO" |
| `arquivo` | `apelido()` do Estúdio ↔ o da Produção | o Acervo recebe dois nomes para a mesma peça |
| `fontes-unicas` | `funcoes.json`, `municipios-ce.json` | o painel lê um arquivo que o `publish.yml` deixou de copiar |
| `painel` | o checklist de área nova, as rotas 301, o grupo de trabalho | área que não aparece no menu; URL antiga virando soft 404 |
| `inscricao` | `validacao.ts` ↔ `recusa_de_inscricao()`, e a passagem de `/presenca` para `/queroajudar` | a pessoa passa por todos os campos em verde e leva um "não deu" genérico no fim |

**Estes testes já pagaram o próprio custo.** Na primeira execução, o de origem
achou duas divergências reais em `slugDe()`: o corte em 60 acontecia depois de
montar o slug (e não sobre o texto cru, como no PHP), e o hífen das pontas era
tirado *antes* do corte — então um slug cortado em 60 saía terminando em `-`,
que é exatamente o que aquela linha existe para impedir. O de painel achou um
comentário do `sessao.php` prometendo um par em TypeScript que não existe (e
que não pode existir).

### A régua que a tela e o servidor dividem

O par de `inscricao` tem uma particularidade que vale registrar: **a divergência
que dói tem direção**. Se o servidor recusar algo que a tela deu como bom, a
pessoa preenche os três passos, vê marca verde em todo campo e leva um "não deu"
genérico no fim — e vai embora, no pico de entusiasmo que ela vai ter. O
contrário (o servidor aceitar mais do que a tela pede) é de propósito: função é
opcional lá e obrigatória aqui, porque a tela é mais dura para ajudar quem
digita, não para barrar.

A régua do servidor só virou testável quando saiu de dentro do endpoint: ela era
uma sequência de `if` no meio de `api/inscricao.php`, e o que está solto no meio
de um endpoint não se chama de fora. Hoje é `recusa_de_inscricao()`, em
`inscricoes-comum.php`.

**A passagem de bastão entre os dois fluxos também é um par**, e desses que nada
no TypeScript liga: a presença grava um objeto solto no `sessionStorage` e o
formulário lê o que quiser dele. Campo renomeado de um lado **some sem erro
nenhum** — e a pessoa redigita tudo em pé, na porta do encontro. Por isso o teste
lê as duas listas **do código**, e não de uma cópia escrita nele: cópia escrita à
mão documenta o combinado sem prendê-lo.

### Como acrescentar um par

1. exponha a função PHP em `contrato/ponte.php`, na lista `PONTES` — ela é
   explícita de propósito: aceitar qualquer nome transformaria a ponte numa
   porta para executar o que estiver carregado;
2. escreva o teste com **entradas difíceis**, não com o caso feliz: acento,
   aspas, espaço em excesso, vazio, e o comprimento exato do limite. Foi no
   limite que os dois lados discordaram.

## `acoes/` — a gravação faz o que promete?

`contrato/` e `fumaca/` cobrem o que o painel **diz**; nenhum dos dois abre um
POST. Com as telas grandes já cortadas por responsabilidade, o risco deixou de
ser "não consigo refatorar" e passou a ser **"refatorei e quebrei o POST"** — e
o POST é onde moram as regras que não têm desfazer: juntar duas fichas, apagar
uma pessoa, publicar um número de urna.

Cada teste faz uma ação de verdade e confere **as duas metades**: o que ficou no
arquivo em `/dados`, e o que a pessoa lê na tela seguinte.

| arquivo | as regras que ele prende |
|---|---|
| `inscricoes` | aprovar dá conta à ficha que já existe, e não cria uma segunda; recusar não apaga ninguém |
| `eventos` | `voltar()` leva a **aba** junto da âncora; encontro com gente na lista não se apaga; tirar alguém tira a linha, não a pessoa |
| `pessoas` | o último administrador não se rebaixa, não se desativa e não se apaga; juntar não sobrescreve o que já está preenchido; duas contas nunca se fundem |
| `fatos` | quem traz o fato não checa o fato — e o admin que destrava escreve o porquê; arquivar exige motivo |
| `producao` | a regra do ledger **avisa e não bloqueia**; card publicado é rastro, e rastro só o admin apaga |
| `candidatos` | o cargo confere os dígitos do número; sem número não vai ao ar; a ordem da lista é a da colinha |

### Por que a ação sobe num servidor, e a tela não

Toda ação do painel termina em `voltar()`, que é `header('Location: …')` mais
`exit`. **No SAPI de linha de comando o `header()` é um nada**: `headers_list()`
volta vazio, e o teste não teria como ver para onde a gravação mandou — que é
justamente a metade que a divisão em abas quebrou uma vez. Por isso `postar()`
sobe um `php -S` (que já vem na caixa, como o `node:test`) e faz o
POST-redirect-GET inteiro; `abrir()` continua no CLI, que é dez vezes mais
barato. O servidor sobe na primeira ação e não antes.

### Duas armadilhas que fizeram o teste mentir

As duas apareceram escrevendo estes arquivos, e as duas viraram erro em vez de
comentário:

1. **Caixa marcada várias vezes vai com `[]` no nome.** Sem o sufixo o PHP
   guarda só o último valor e `is_array($_POST[…])` dá `false`: a ação lê lista
   vazia, não reclama de nada e grava. O teste passava dizendo que a permissão
   tinha sido concedida quando nenhuma foi. Hoje `postar()` põe o `[]` sozinho
   quando o valor é um array.
2. **`dados/cards.php` não existe** — os cards do quadro moram em
   `producao.php`. Arquivo que não existe devolvia lista vazia sem reclamar, e o
   teste que contava cards comparava 0 com 0 e confirmava, sorridente, que
   nenhum card tinha sido aberto. Hoje `ler()` recusa um nome que não está na
   lista de arquivos do painel.

E um aviso do PHP durante uma ação **derruba o teste na hora**, sem ninguém
precisar pedir: é a mesma regra da fumaça, e pior aqui do que lá — o que sobra
no arquivo é um dado meio escrito, e quem só olha o redirecionamento diz que
deu certo.

> **O primeiro defeito que estes testes acharam** foi um nome só de espaços
> criando uma pessoa sem nome. `normalizar_pessoa()` conferia `empty($p['nome'])`
> sobre o campo cru — e `"   "` é string não-vazia —, e só depois `limpar_texto()`
> a reduzia a `''`. A ficha nascia em branco, sem erro nenhum aparecer, e pelo
> mesmo portão passava candidato: um número de urna na colinha sem nome ao lado.

## `sandbox.ts` — o painel de mentira

Os três tipos de teste usam a mesma peça: uma **cópia** do painel num diretório
temporário, com os catálogos ao lado. Nunca a árvore de trabalho, por dois
motivos:

1. o painel grava em `../dados` relativo a si mesmo — teste que suja o
   repositório é teste que a pessoa aprende a não rodar;
2. **`funcoes.json` e `municipios-ce.json` não estão versionados em `public/`.**
   Quem os põe onde o PHP procura é o `publish.yml`, copiando de `src/data` para
   `out/`. Rodar contra a árvore de trabalho lê o catálogo que sobrou de um
   `npm run build` local — passa na máquina de quem já rodou o painel e falha no
   CI.

O segundo só apareceu ao rodar a suíte num `git archive` limpo, e vale a pena
repetir isso ao mexer no sandbox. Sem o catálogo o painel **não quebra**:
`cidade_valida()` cai no caminho de "catálogo ausente não apaga cidade" e passa
a aceitar qualquer grafia — o defeito só aparece no relatório, semanas depois.

## `fumaca/` — abriu inteiro?

Renderiza cada tela do painel fora do servidor web e confere três coisas:
saiu `0`, não houve aviso do PHP, e o documento terminou (`</html>`).

É o teste mais barato que existe e o que mais pega. Aviso de PHP **não aparece
na tela** e em produção o `display_errors` está desligado; erro fatal corta a
resposta no meio e o navegador mostra meia página sem dizer nada. Foi rodando
isto antes e depois que a divisão de `eventos.php` em cinco arquivos foi
conferida — 30 telas, zero diferença de conteúdo.

O sandbox é uma **cópia** do painel num diretório temporário, nunca a árvore de
trabalho: o painel grava em `../dados` relativo a si mesmo, e teste que suja o
repositório é teste que a pessoa aprende a não rodar.
