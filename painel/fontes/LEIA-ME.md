# Fontes do painel

As mesmas três fontes do site público, servidas daqui em vez de virem do Google
Fonts. Motivo: o site promete na Política de Privacidade que não manda dado do
visitante para terceiros — e um `<link>` para o Google entrega o IP de quem
acessa. Servindo do próprio domínio, isso não acontece.

No site público quem cuida disso é o `next/font` (que também auto-hospeda). O
painel é PHP, fora do build do Next, então precisa da própria cópia.

| Arquivo | Família | Uso no painel | Licença |
|---|---|---|---|
| `alfa-slab-one.woff2` | Alfa Slab One | títulos e nomes | SIL Open Font License 1.1 |
| `special-elite.woff2` | Special Elite | rótulos, botões, navegação | Apache License 2.0 |
| `bitter-400.woff2` | Bitter (regular) | texto corrido | SIL Open Font License 1.1 |
| `bitter-700.woff2` | Bitter (negrito) | destaque no texto | SIL Open Font License 1.1 |

As três permitem redistribuição, inclusive embutida num site. Só o subconjunto
latino foi baixado — daí o tamanho pequeno (116 KB no total).

Para atualizar, baixe o `woff2` do subconjunto `latin` em fonts.google.com e
troque o arquivo mantendo o nome. Depois **suba o `VERSAO_ESTILO` no
`layout.php`**, senão o navegador de quem já entrou continua com o CSS antigo.
