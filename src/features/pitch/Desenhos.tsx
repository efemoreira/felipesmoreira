import estilos from "./Apresentacao.module.css";

/**
 * Desenhos em HTML para os projetos que ainda não têm captura de tela (Fluux e
 * Meu Frete). São ilustração — o slide diz isso embaixo —, não print do produto.
 * As cores vêm das variáveis da marca do pitch.
 */

const HORA = 64;
const INICIO = 8;

/** A grade do dia do Fluux: eventos no horário, sobrepostos lado a lado, e a linha do agora. */
export function GradeDoDia() {
  const eventos = [
    { titulo: "🐸 Proposta do cliente", detalhe: "🍅🍅 de 4", de: 8, ate: 10, lado: "esquerda", cor: "var(--marca)" },
    { titulo: "Reunião", detalhe: "fixo", de: 9.5, ate: 10.5, lado: "direita", cor: "var(--marca-escuro)" },
    { titulo: "Inglês", detalhe: "meta: 40 h no trimestre", de: 10.75, ate: 11.5, cor: "var(--marca)" },
    { titulo: "Almoço", detalhe: "", de: 12, ate: 13, cor: "var(--marca-escuro)" },
    { titulo: "Treino ✓", detalhe: "Saúde", de: 13, ate: 14, cor: "var(--acento)", tinta: "var(--tinta-acento)" },
  ];
  const agora = 11.25;

  return (
    <div className={estilos.desenho} role="img" aria-label="Grade do dia: eventos de 8h às 14h, a proposta do cliente e uma reunião lado a lado, e a linha do agora às 11h15">
      <p className={estilos.rota}>Hoje · quinta</p>
      <p className={estilos.rotaDetalhe}>Expediente 8h–18h · 6 h planejadas · 2 lacunas livres</p>
      <div className={estilos.dia} style={{ marginTop: 16 }}>
        <div className={estilos.horas}>
          {[8, 9, 10, 11, 12, 13].map((h) => <span key={h}>{String(h).padStart(2, "0")}:00</span>)}
        </div>
        <div className={estilos.colunaDia}>
          {eventos.map((e) => (
              /* sobrepostos dividem a coluna: um à esquerda, outro à direita */
              <div
                key={e.titulo}
                className={estilos.evento}
                style={{
                  top: (e.de - INICIO) * HORA + 2,
                  height: (e.ate - e.de) * HORA - 4,
                  left: e.lado === "direita" ? "calc(50% + 2px)" : 4,
                  right: e.lado === "esquerda" ? "calc(50% + 2px)" : 4,
                  background: e.cor,
                  color: e.tinta,
                }}
              >
                <strong>{e.titulo}</strong>
                {e.detalhe}
              </div>
          ))}
          <div className={estilos.agora} style={{ top: (agora - INICIO) * HORA }} />
        </div>
      </div>
    </div>
  );
}

/** O preço sugerido do Meu Frete: a faixa e do que ela é feita. */
export function PrecoExplicado() {
  const composicao: [string, string][] = [
    ["Saída do fretista até a coleta (6 km)", "R$ 24"],
    ["Trajeto Montese → Messejana (14 km)", "R$ 98"],
    ["Caminhão 3/4 · tarifa base", "R$ 120"],
    ["2 ajudantes", "R$ 140"],
    ["3º andar sem elevador", "R$ 60"],
    ["Montagem de 2 móveis", "R$ 50"],
  ];

  return (
    <div className={estilos.desenho} role="img" aria-label="Pedido de mudança com faixa de preço: mínimo R$ 430, sugerido R$ 492, máximo R$ 580, e a composição do valor">
      <p className={estilos.rota}>Mudança · apartamento de 2 quartos</p>
      <p className={estilos.rotaDetalhe}>Fortaleza · sábado, 8h · 23 itens, 4 frágeis</p>
      <div className={estilos.faixa}>
        <div><small>Mínimo</small><b>R$ 430</b></div>
        <div className={estilos.sugerido}><small>Sugerido</small><b>R$ 492</b></div>
        <div><small>Máximo</small><b>R$ 580</b></div>
      </div>
      <ul className={estilos.composicao}>
        {composicao.map(([o, v]) => (
          <li key={o}><span>{o}</span><span>{v}</span></li>
        ))}
      </ul>
    </div>
  );
}
