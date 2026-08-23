# Domínio e fluxos

## Contrato Next ↔ PHP

- O backend real está em `public/painel/`.
- Endpoints novos reaproveitam `sessao.php`.
- Chamadas do Next passam por `@/lib/api/client.ts` (`apiFetch`).
- Endpoints públicos atuais: inscrição e presença.

## Onde guardar dado pessoal

- Dados sensíveis ficam em arquivos `.php` retornando array.
- `agenda.json` é a exceção pública do painel.
- Imagens da agenda continuam públicas por extensão.

## Uma pessoa, não vários cadastros

- A base unificada é `dados/pessoas.php`.
- `tipo` diz o que a pessoa é.
- `funcoes` diz o que ela faz.
- `capacidades` diz o que ela abre.
- Presença é relação entre pessoa e encontro, não cópia do cadastro.

## Inscrição

- `/queroajudar` cria ou reaproveita uma pessoa com `status = 'pendente'`.
- Aprovação **dá conta à ficha existente**.
- Senha provisória aparece uma vez.
- Quem não escolheu função pode entrar como `onde-precisar`.

## Vão entre inscrição e aprovação

- É um dos pontos de maior perda.
- O sistema tenta amortecer isso com tela de confirmação mais útil, urgência no hub e convite do Dia 0.

## Convite do Dia 0

- `link_convite()` libera só o Dia 0 de `/aulas`.
- O token é derivado do segredo do site, não armazenado como cadastro separado.

## Presença

- Um token para confirmação (`confirmou`) e outro para presença real (`compareceu`).
- A busca pública procura pelo telefone já conhecido no sistema.
- Quando não conhece, pede a ficha curta.
- Quem confirma e ainda não é do movimento pode ir para `/queroajudar` com prefill por `sessionStorage`.

## Cidade e origem

- `src/data/municipios-ce.json` é a fonte única dos municípios.
- `cidade_valida()` devolve a grafia do catálogo.
- `origem` é opcional e entra slugificada por `normalizar_origem()`.
- `slugDe()` (TS) e `normalizar_origem()` (PHP) têm de concordar.

## Relatório de origem

- A aba “De onde vêm” mede `chegaram` → `aprovadas` → `militaram`.
- A ordem correta é por quem militou, com total só para desempate.
- Quem veio pela URL limpa fica fora da tabela principal.

## Contato

- `GRUPO_GERAL` é o único divulgado publicamente.
- `GRUPO_TRABALHO` só existe no painel.
- A coordenação responde conversas já abertas; não deve iniciar abordagens em massa.

## Invariantes importantes

- Toda conta de tempo sai de `inicio`, não de `data`.
- `estadoDe()` (TS) e `estado_do_evento()` (PHP) têm de concordar.
- `nome_de_arquivo()`/`apelido()` da Produção e do Estúdio têm de concordar.
- `sem_acento()` no PHP e `normalize("NFD")` no JS são o par correto para slug e nome de arquivo.