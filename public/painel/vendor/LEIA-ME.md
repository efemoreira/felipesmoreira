# Biblioteca de terceiro do painel

Uma só, e servida daqui pelo mesmo motivo das fontes: a Política de Privacidade
promete que nada do visitante vai para fora, e um `<script>` apontando para CDN
entrega o IP de quem acessa. O painel é PHP, fora do build do Next, então precisa
da própria cópia.

| Arquivo | O que é | Versão | Licença |
|---|---|---|---|
| `qrcode.js` | Gerador de QR Code, de Kazuhiko Arase | 2.0.4 | MIT |

## Para que serve

O QR da mesa da Recepção, em `/painel/eventos.php`. Ele leva para
`/presenca?e=<token>`, onde quem chega ao encontro se cadastra no próprio
celular — sem fila para alguém digitar.

Desenha em SVG (`createSvgTag`), não em canvas: SVG imprime nítido em qualquer
tamanho, e a mesa da Recepção quase sempre usa o QR impresso e colado num papel.

## Como atualizar

O arquivo vem do pacote npm `qrcode-generator`, declarado em `devDependencies`
para a versão ficar rastreável — ele **não** entra no build do Next, é só a
origem da cópia.

```bash
npm install --save-dev qrcode-generator@latest
cp node_modules/qrcode-generator/dist/qrcode.js public/painel/vendor/qrcode.js
```

Depois, **suba a `VERSAO_ESTILO` no `layout.php`**: o `.htaccess` põe cache
imutável de 1 ano em `.js`, e sem trocar a versão o navegador de quem já entrou
continua com o arquivo antigo.

Usamos `dist/qrcode.js`, não o `qrcode_UTF8.js`: o que é codificado é sempre uma
URL do próprio site, que é ASCII puro.

## Como conferir que o código lê

Depois de trocar a versão ou os parâmetros (`cellSize`, `margin`, nível de
correção), vale confirmar que o QR realmente decodifica de volta — olhar e achar
que "parece um QR" não é conferir:

```bash
npm install --save-dev jsqr
node -e '
const qrcode = require("qrcode-generator"), jsQR = require("jsqr").default;
const url = "https://felipesmoreira.com/presenca?e=teste";
const qr = qrcode(0, "M"); qr.addData(url); qr.make();
const n = qr.getModuleCount(), e = 6, m = 2, lado = (n + m*2) * e;
const d = new Uint8ClampedArray(lado*lado*4).fill(255);
for (let y=0; y<lado; y++) for (let x=0; x<lado; x++) {
  const c = Math.floor(x/e)-m, r = Math.floor(y/e)-m;
  if (c>=0 && c<n && r>=0 && r<n && qr.isDark(r,c)) {
    const i=(y*lado+x)*4; d[i]=d[i+1]=d[i+2]=0;
  }
}
console.log(jsQR(d, lado, lado).data === url ? "ok" : "NAO LEU");'
npm uninstall jsqr
```

> "QR Code" é marca registrada da DENSO WAVE INCORPORATED. O uso da sigla para
> descrever o código é livre; a nota existe no cabeçalho do arquivo original e é
> repetida aqui para não se perder.
