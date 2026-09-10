# Painel: UI e permissões

## Navegação

- A navegação mora em `layout.php`, e só lá.
- Desktop: lateral fixa por grupos.
- Celular: barra fixa no rodapé + “Mais”.
- Contadores vêm de `agora.php`.

## Cabeçalho e explicação

- `cabecalho_pagina()` centraliza título, subtítulo e explicação curta.
- O `<details class="explicacao">` explica o que a tela faz; a aula explica como fazer.

## Busca, filtros e abas

- `barra_busca()` para telas que só procuram.
- `barra_filtros()` para telas que procuram e recortam.
- `barra_abas()` para listas empilhadas que viraram seções com URL própria.
- A busca recorta as duas abas antes de desenhar uma delas.

## Modais e rascunho

- `botao_modal()`, `abrir_modal()` e `fechar_modal()` são a peça única do painel.
- Formulário longo usa `data-rascunho`.
- O rascunho nunca se aplica sozinho.
- Modal fica no fim do documento, nunca dentro de tabela ou fieldset problemático.

## Mobile first

- Priorize scroll vertical em telas de trabalho.
- Tabelas operacionais são suspeitas; converta para cards/listas quando esconderem ação ou identidade.
- A barra do celular, as abas e os grids principais já estão no caminho certo.

## Temas e visual

- O painel compartilha a linguagem do site: borda grossa, sombra dura, nada arredondado.
- Há três temas: claro, escuro e sistema.
- Cor nova entra como token nos dois temas.
- O ouro não vira texto no tema claro; ele é bloco, fundo ou borda.

## Áreas e capacidades

- Permissão normal é por capacidade.
- Áreas são ajuste fino.
- `pessoas` é restrita a `adm` por conter dado pessoal completo.
- Área nova exige: `AREAS`, `DESTINO_AREA`, `GRUPOS_NAV`, `ROTULO_CURTO`, ícone e regra de URL limpa.
- **Tela pessoal não é área.** `conta.php` e `gente.php` abrem por
  `exigir_login()` mais uma regra própria (`pode_liderar()` no caso de Sua
  gente), entram como item solto em `menu_do_painel()` e não tocam `AREAS`.
  `gente.php` lê só por `minha_gente($eu)` — o recorte é sempre o de quem está
  logado; `testes/fumaca/gente.test.ts` semeia duas líderes e procura o nome
  da gente da outra no HTML.

### A ficha de pessoa

- `pessoas?p=<id>` é uma tela, não um bloco em cima da lista: abas Ficha ·
  Encontros · Acesso · Histórico (`tela_da_ficha()` em `pessoas-ficha.php`).
  A lista (`pessoas-lista.php`) só lista; Duplicatas é aba dela, e só aparece
  quando há par. `?p=X&editar=X` abre o modal de edição por cima da ficha.

### Leituras

- `/painel/leituras` é a mesa de olhar: Origem (o funil por `?de=`),
  Território (aprovadas por cidade e bairro), Semana (os medidores de
  `panorama_de()`, o mutirão, os caixas só para `adm`) e Atividade (a linha do
  tempo inteira, com busca e recorte por área). Não tem `-acoes.php`, de
  propósito; `testes/acoes/leituras.test.ts` fotografa `/dados` antes e depois.
- Leitura não mora dentro de mesa. "De onde vêm" e "Onde a militância mora"
  saíram de Inscrições; `inscricoes?aba=origens` redireciona.

### O hub

- Quatro seções na coluna principal (fila, próximo encontro, formação, três
  linhas do que andou acontecendo) e até três cartões de ação na lateral (sua
  gente, peça da semana, grupo). O que cabe numa linha é
  `.hub-linha`: quem te acompanha, a operação hoje (só o que não está em dia),
  o grupo depois de marcar que entrou.
- `testes/fumaca/painel.test.ts` conta seções e cartões e trava o teto. Bloco
  novo no hub tem tela própria por trás, ou não entra.

### Nome e telefone

**Só `adm` e `coordenacao` leem nome e telefone de gente.** É regra do
movimento, não detalhe de tela, e vale para qualquer lugar que desenhe uma
pessoa — lista, seletor, linha do tempo, resultado de busca.

- Telefone: `pode_ver_telefone()` (`privacidade.php`). Fora da coordenação sai
  encoberto por `telefone_encoberto()`. A exceção é quem cadastrou aquela
  pessoa: ela acabou de digitar o número.
- Nome fora do contexto de uma pessoa (linha do tempo, recado): `nome_encoberto()`
  — primeiro nome e a inicial.
- `pessoas_ativas()` são **contas** ativas, não o cadastro inteiro. Seletor que
  lista gente lista quem tem login.

Não confira essa regra lendo a função: `testes/fumaca/acessos.test.ts` troca a
capacidade da conta, abre a tela e procura o telefone no HTML. Foi assim que se
descobriu que `pode_ver_telefone()` perguntava `pode('agenda')` — uma área que a
capacidade Eventos concede junto —, e por isso não travava ninguém.

### A porta de primeiro acesso

`/painel/` mostra "criar o primeiro administrador" quando **não há conta E o
`dados/pessoas.php` não existe**. As duas metades importam: `ler_pessoas()` usa
`@include` e devolve vazio calado em falha de leitura, e sem o `is_file()` isso
abria a criação de admin para qualquer visitante. `criar_admin` acrescenta ao
cadastro; nunca o substitui. Zerar Pessoas na Manutenção preserva a ficha de
quem zerou, justamente para não haver janela sem dono.

## Padrão das telas grandes

```text
<area>.php          rota
<area>-acoes.php    POST
<area>-tela.php     tela principal
<area>-comum.php    modelo/regras
```

Quando houver blocos grandes independentes, extraia também arquivos por bloco.

O POST-redirect-GET mora em `acoes-comum.php`: `avisar()` guarda o recado,
`ir_para()` manda o 302, `exigir_token_de_acao()` é a trava de CSRF e
`recado_pendente()` lê o recado na rota. Cada `-acoes.php` inclui esse arquivo e
define só o seu `voltar()` — para onde a ação volta (aba, âncora, encontro
aberto) é decisão da tela. Exemplo completo: `municao.php` + `municao-acoes.php`
+ `municao-tela.php` + `municao-mutirao.php` + `municao-pecas.php`.

## Linha do tempo e panorama

- `agora.php` responde o que está esperando e como está a operação.
- `atividade-comum.php` deriva a linha do tempo dos carimbos existentes.
- Não crie arquivo de log paralelo para atividade.