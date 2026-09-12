/**
 * O sinal do site (public/painel/api/sinal.php) — "alguém abriu", "alguém
 * compartilhou", "alguém se inscreveu".
 *
 * É a medição mínima e sem terceiro: vai só a rota e o nome do evento, e o
 * painel guarda só a contagem por dia. Nenhum identificador, nenhum cookie.
 * Por `sendBeacon`, que não segura a página nem a saída dela; quando não há
 * (navegador velho), `fetch` com `keepalive`. **Nunca lança e nunca espera**:
 * a única coisa que um sinal não pode fazer é atrapalhar quem está usando.
 *
 * Fora do `apiFetch` de propósito — ele espera JSON de volta e lança em erro,
 * e aqui a resposta não interessa.
 */
export type EventoDeSinal = "abriu" | "compartilhou" | "passo-2" | "passo-3" | "enviou-inscricao";

const ENDPOINT = "/painel/api/sinal.php";

/** A rota como o painel a conhece: sem barras, "" para a raiz. */
function rotaAtual(): string {
  if (typeof location === "undefined") return "";
  return location.pathname.replace(/^\/|\/$/g, "").replace(/\.html$/, "");
}

export function sinal(evento: EventoDeSinal, rota: string = rotaAtual()): void {
  try {
    const corpo = JSON.stringify({ rota, evento, site: "" });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      /* text/plain, e não application/json: JSON faria o navegador mandar um
         preflight CORS antes, e o beacon simples não tem essa espera. O PHP lê
         o corpo cru de qualquer jeito. */
      if (navigator.sendBeacon(ENDPOINT, new Blob([corpo], { type: "text/plain" }))) return;
    }
    void fetch(ENDPOINT, { method: "POST", body: corpo, keepalive: true, credentials: "omit" }).catch(() => {});
  } catch {
    /* sem sinal — a página segue */
  }
}
