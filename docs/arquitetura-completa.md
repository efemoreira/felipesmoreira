# Arquitetura — mapa geral

Este arquivo é o ponto de entrada curto da documentação. O detalhamento foi
quebrado por tema para reduzir custo de leitura e facilitar busca por assunto.

## Como ler a arquitetura

- `docs/site-publico.md`
  Quando a tarefa tocar em rotas públicas, `src/`, tema, programação,
  candidatos públicos, Munição ou responsividade do site.

- `docs/dominio-e-fluxos.md`
  Quando a tarefa tocar em pessoas, inscrição, presença, origem, contato,
  cidades, contrato Next ↔ PHP e regras de dado pessoal.

- `docs/painel-ui-e-permissoes.md`
  Quando a tarefa tocar em layout do painel, navegação, busca, filtros, abas,
  modais, rascunho local, permissões, áreas e convenções de telas grandes.

- `docs/painel.md`
  Quando a tarefa for operacional: primeiro acesso, senhas, armazenamento de
  dados, URLs do painel e fluxo administrativo do dia a dia.

- `docs/deploy-testes-e-limites.md`
  Quando a tarefa tocar em testes, publish, `.htaccess`, imagens, convenções de
  nome e arquivos que não devem ser alterados sem alinhamento.

## Regras de alto sinal

- Site público: Next.js exportado estaticamente.
- Backend real: PHP em `public/painel/`.
- Não existe `app/api` para lógica dinâmica do produto.
- Fonte visual: `src/lib/theme.ts`.
- Fonte única de pessoa: `dados/pessoas.php`.
- Tela grande do painel segue, por padrão: rota + `-acoes` + `-tela` + `-comum`.
- Toda chamada do Next para o painel passa por `apiFetch`.

## Referência integral

Se você precisar do rational longo, do histórico mais detalhado ou quiser ler a
versão extensa quase palavra por palavra, consulte:

- `docs/arquitetura-referencia.md`

Esse arquivo preserva a versão longa anterior, mas não deve mais ser o ponto de
entrada padrão da documentação.