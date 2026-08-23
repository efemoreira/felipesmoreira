# Testes

Dois tipos, e a divisão é o que importa:

| pasta | responde | roda em |
|---|---|---|
| `contrato/` | as duas cópias da mesma regra continuam concordando? | ~1s |
| `fumaca/` | toda tela do painel abre inteira e em silêncio? | ~4s |

```sh
npm test              # os dois
npm run test:contrato
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

**Estes testes já pagaram o próprio custo.** Na primeira execução, o de origem
achou duas divergências reais em `slugDe()`: o corte em 60 acontecia depois de
montar o slug (e não sobre o texto cru, como no PHP), e o hífen das pontas era
tirado *antes* do corte — então um slug cortado em 60 saía terminando em `-`,
que é exatamente o que aquela linha existe para impedir. O de painel achou um
comentário do `sessao.php` prometendo um par em TypeScript que não existe (e
que não pode existir).

### Como acrescentar um par

1. exponha a função PHP em `contrato/ponte.php`, na lista `PONTES` — ela é
   explícita de propósito: aceitar qualquer nome transformaria a ponte numa
   porta para executar o que estiver carregado;
2. escreva o teste com **entradas difíceis**, não com o caso feliz: acento,
   aspas, espaço em excesso, vazio, e o comprimento exato do limite. Foi no
   limite que os dois lados discordaram.

## `sandbox.ts` — o painel de mentira

Os dois tipos de teste usam a mesma peça: uma **cópia** do painel num diretório
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
