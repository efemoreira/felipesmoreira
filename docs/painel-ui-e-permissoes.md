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

### Nome e telefone

**Só `adm` e `coordenacao` leem nome e telefone de gente.** É regra do
movimento, não detalhe de tela, e vale para qualquer lugar que desenhe uma
pessoa — lista, seletor, linha do tempo, resultado de busca.

- Telefone: `pode_ver_telefone()` (`eventos-comum.php`). Fora da coordenação sai
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

## Linha do tempo e panorama

- `agora.php` responde o que está esperando e como está a operação.
- `atividade-comum.php` deriva a linha do tempo dos carimbos existentes.
- Não crie arquivo de log paralelo para atividade.