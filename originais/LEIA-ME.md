# Originais

Arquivos em resolução cheia que **não são publicados**. Só o que está em
`public/` vai para o build — daqui saem os recortes, à mão, quando precisar.

| Arquivo | O que é |
|---|---|
| `me.png` | Retrato original, 1472×1964 |

## Por que saiu de `public/image/`

Ele era servido direto na home para desenhar um avatar de 152 px. Como o site é
export estático (`images.unoptimized`), o Next não redimensiona nada: **todo
visitante baixava 4,4 MB para ver um círculo de 152 px**. A maioria chega de
celular, por link de WhatsApp.

## Como refazer os recortes

O recorte quadrado é centrado no rosto — 820×820 a partir de (x=195, y=300):

```sh
sips -c 820 820 --cropOffset 300 195 originais/me.png --out /tmp/quadrado.png

# avatar da home (exibido a 152 px; 320 cobre tela 2x)
sips -Z 320 /tmp/quadrado.png --out /tmp/q320.png
cwebp -q 82 /tmp/q320.png -o public/image/me-320.webp
sips -s format jpeg -s formatOptions 86 /tmp/q320.png --out public/image/me-320.jpg

# retrato do schema.org (Person.image, quadrado)
sips -Z 512 /tmp/quadrado.png --out /tmp/q512.png
sips -s format jpeg -s formatOptions 84 /tmp/q512.png --out public/image/me-512.jpg
```

Os ícones do PWA **não saem da foto**: saem da marca das onças em
`src/app/icon.png`, que o Next publica como `/icon.png`.

```sh
sips -Z 192 src/app/icon.png --out public/image/icone-192.png

# maskable: conteúdo em 78% da moldura, resto no preto-noite do cordel
sips -Z 400 src/app/icon.png --out /tmp/mk.png
sips -p 512 512 --padColor 14110C /tmp/mk.png --out public/image/icone-maskable-512.png
```

> Trocou o retrato? Refaça **os três** derivados da foto e confira a dimensão
> declarada em `Person.image` no `src/app/layout.tsx` — ela precisa bater com o
> arquivo, senão o schema mente.
