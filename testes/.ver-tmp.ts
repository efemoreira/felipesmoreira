import { montarSandbox } from "./sandbox.ts";
const s = montarSandbox();
for (const [tela, qs] of [["pessoas", ""], ["municao", ""]] as const) {
  const r = s.abrir(tela, qs);
  const i = r.html.indexOf("menu-acoes");
  console.log("=====", tela, "=====");
  console.log(r.html.slice(i - 200, i + 1500));
  if (r.erros.trim()) console.log("ERROS:", r.erros);
}
s.fechar();
