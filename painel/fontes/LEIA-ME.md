# Fontes do painel

As mesmas duas fontes do site público, servidas daqui em vez de virem do Google
Fonts. Motivo: o site promete na Política de Privacidade que não manda dado do
visitante para terceiros — e um `<link>` para o Google entrega o IP de quem
acessa. Servindo do próprio domínio, isso não acontece.

No site público quem cuida disso é o `next/font` (que também auto-hospeda). O
painel é PHP, fora do build do Next, então precisa da própria cópia.

| Arquivo | Família | Uso no painel | Licença |
|---|---|---|---|
| `alfa-slab-one.woff2` | Alfa Slab One | títulos grandes, de 24 px para cima | SIL Open Font License 1.1 |
| `figtree.woff2` | Figtree (variável, pesos 300 a 900) | todo o resto | SIL Open Font License 1.1 |

As duas permitem redistribuição, inclusive embutida num site. Só o subconjunto
latino está aqui — daí o tamanho pequeno (39 KB no total).

Para atualizar, baixe o `woff2` do subconjunto `latin` em fonts.google.com e
troque o arquivo mantendo o nome. Depois **suba o `VERSAO_ESTILO` no
`layout.php`**, senão o navegador de quem já entrou continua com o CSS antigo.
