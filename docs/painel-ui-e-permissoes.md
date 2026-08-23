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