# felipesmoreira.com

Site pessoal/institucional de Felipe Moreira (Missão Ceará).

O projeto é dividido em duas metades:

- **site público** em Next.js 15 App Router, com `output: "export"`;
- **backend real** em PHP, dentro de `public/painel/`, para login, sessão,
  inscrições, encontros, candidatos, formação e demais dados dinâmicos.

## Arquitetura em uma frase

O site público é estático e vai para a Hostinger como build exportado; o painel
PHP roda ao lado e expõe as páginas administrativas e as APIs JSON consumidas
pelas features do front.

## Comandos principais

```bash
npm run dev
npm run build
npm test
npm run test:tipos
npm run lint
```

## Regras de alto sinal

- Não crie `app/api` para lógica de produto; o backend dinâmico está no painel PHP.
- `src/app/<rota>/page.tsx` deve ser fino: metadata + delegação para a feature.
- Cor, fonte, moldura e escala de texto saem de `src/lib/theme.ts`.
- Toda chamada do Next para o painel passa por `@/lib/api/client.ts` (`apiFetch`).
- Em tela de trabalho para celular, priorize scroll vertical e desconfie de tabela.

## Onde ler a documentação certa

- `CLAUDE.md` — contrato curto do repositório.
- `docs/arquitetura-completa.md` — mapa da arquitetura e índice temático.
- `docs/painel.md` — operação prática do painel.
- `docs/site-publico.md` — regras e estrutura do site público.
- `docs/dominio-e-fluxos.md` — pessoas, inscrição, presença, origem e contrato PHP ↔ Next.
- `docs/painel-ui-e-permissoes.md` — navegação, busca, modais, áreas e convenções de tela.
- `docs/deploy-testes-e-limites.md` — testes, deploy, limites e o que não mexer sem perguntar.
- `docs/arquitetura-referencia.md` — referência integral/histórica das decisões mais detalhadas.

## O que não mexer sem perguntar

- `next.config.ts` com `output: "export"`;
- `.github/workflows/publish.yml`;
- `conceito.html`.
