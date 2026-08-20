"use client";

/**
 * Tela de recorte de fundo.
 *
 * O automático acerta o corpo mas erra em cabelo solto, óculos e vãos entre o
 * braço e o tronco — então limiar, suavização e os pincéis de retoque não são
 * enfeite: são o que decide se o recorte presta. Tudo roda no navegador.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { salvarAtivo, urlDoAtivo } from "../armazenamento";
import {
  alfaDaMascara,
  calcularMascara,
  canvasDeTrabalho,
  limitesVisiveis,
  modeloEmMemoria,
  montarPng,
  RECORTE_PADRAO,
  type AjustesRecorte,
} from "../recorte";
import { novoId, type Ativo } from "../tipos";
import { Botoes, Deslizante } from "./Controles";

interface Props {
  ativo: Ativo;
  onPronto: (novoAtivoId: string) => void;
  onFechar: () => void;
}

type Ferramenta = "nenhuma" | "apagar" | "restaurar";

export default function Recorte({ ativo, onPronto, onFechar }: Props) {
  const [fase, setFase] = useState<"carregando" | "pronto" | "erro" | "salvando">("carregando");
  const [recado, setRecado] = useState("");
  const [ajustes, setAjustes] = useState<AjustesRecorte>(RECORTE_PADRAO);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("nenhuma");
  const [pincel, setPincel] = useState(40);
  const [fundoClaro, setFundoClaro] = useState(false);

  const telaRef = useRef<HTMLCanvasElement>(null);
  const trabalho = useRef<HTMLCanvasElement | null>(null);
  const mascara = useRef<Float32Array | null>(null);
  /** retoque manual: -1 apaga, 0 deixa o automático decidir, 1 restaura */
  const retoque = useRef<Int8Array | null>(null);
  const pintando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);

  /* ===== carrega e segmenta ===== */
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        if (!modeloEmMemoria()) {
          setRecado("Baixando o modelo de recorte (~28 MB, só no primeiro uso)…");
        }
        const url = await urlDoAtivo(ativo.id);
        if (!url) throw new Error("Não achei essa imagem na biblioteca.");

        const img = await new Promise<HTMLImageElement>((ok, falhou) => {
          const el = new Image();
          el.onload = () => ok(el);
          el.onerror = () => falhou(new Error("Não consegui abrir a imagem."));
          el.src = url;
        });
        if (!vivo) return;

        const canvas = canvasDeTrabalho(img);
        trabalho.current = canvas;
        retoque.current = new Int8Array(canvas.width * canvas.height);

        setRecado("Procurando a pessoa na foto…");
        mascara.current = await calcularMascara(canvas);
        if (!vivo) return;

        setRecado("");
        setFase("pronto");
      } catch (e) {
        if (!vivo) return;
        setRecado(
          e instanceof Error
            ? `${e.message} Se não resolver, dá para recortar em outro app e subir o PNG pronto.`
            : "Falhou.",
        );
        setFase("erro");
      }
    })();

    return () => {
      vivo = false;
    };
  }, [ativo.id]);

  /* ===== alfa final = automático + retoque manual ===== */
  const alfaAtual = useCallback((): Uint8ClampedArray | null => {
    const canvas = trabalho.current;
    if (!canvas || !mascara.current || !retoque.current) return null;

    const alfa = alfaDaMascara(mascara.current, ajustes, canvas.width);
    const marcas = retoque.current;
    for (let i = 0; i < alfa.length; i++) {
      if (marcas[i] === -1) alfa[i] = 0;
      else if (marcas[i] === 1) alfa[i] = 255;
    }
    return alfa;
  }, [ajustes]);

  const redesenhar = useCallback(() => {
    const tela = telaRef.current;
    const canvas = trabalho.current;
    const alfa = alfaAtual();
    if (!tela || !canvas || !alfa) return;

    tela.width = canvas.width;
    tela.height = canvas.height;
    const ctx = tela.getContext("2d")!;
    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.drawImage(canvas, 0, 0);

    const quadro = ctx.getImageData(0, 0, tela.width, tela.height);
    const d = quadro.data;
    for (let i = 0, p = 3; i < alfa.length; i++, p += 4) d[p] = alfa[i];
    ctx.putImageData(quadro, 0, 0);
  }, [alfaAtual]);

  useEffect(() => {
    if (fase === "pronto") redesenhar();
  }, [fase, redesenhar]);

  /* ===== pincéis ===== */
  const coordenada = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const tela = telaRef.current!;
    const caixa = tela.getBoundingClientRect();
    return {
      x: ((e.clientX - caixa.left) / caixa.width) * tela.width,
      y: ((e.clientY - caixa.top) / caixa.height) * tela.height,
    };
  };

  /** Marca um disco no retoque, ligando ao ponto anterior para o traço não falhar. */
  const pintarEm = (x: number, y: number) => {
    const canvas = trabalho.current;
    const marcas = retoque.current;
    if (!canvas || !marcas) return;

    const valor = ferramenta === "apagar" ? -1 : 1;
    const raio = pincel / 2;
    const de = ultimo.current ?? { x, y };
    const passos = Math.max(1, Math.ceil(Math.hypot(x - de.x, y - de.y) / (raio / 2)));

    for (let s = 0; s <= passos; s++) {
      const cx = de.x + ((x - de.x) * s) / passos;
      const cy = de.y + ((y - de.y) * s) / passos;

      const x0 = Math.max(0, Math.floor(cx - raio));
      const x1 = Math.min(canvas.width - 1, Math.ceil(cx + raio));
      const y0 = Math.max(0, Math.floor(cy - raio));
      const y1 = Math.min(canvas.height - 1, Math.ceil(cy + raio));

      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          if ((px - cx) ** 2 + (py - cy) ** 2 <= raio * raio) {
            marcas[py * canvas.width + px] = valor;
          }
        }
      }
    }
    ultimo.current = { x, y };
    redesenhar();
  };

  const aoDescer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (ferramenta === "nenhuma") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pintando.current = true;
    ultimo.current = null;
    const { x, y } = coordenada(e);
    pintarEm(x, y);
  };

  const aoMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pintando.current) return;
    const { x, y } = coordenada(e);
    pintarEm(x, y);
  };

  const aoSubir = () => {
    pintando.current = false;
    ultimo.current = null;
  };

  const limparRetoque = () => {
    retoque.current?.fill(0);
    redesenhar();
  };

  /* ===== salvar ===== */
  const aplicar = async () => {
    const canvas = trabalho.current;
    const alfa = alfaAtual();
    if (!canvas || !alfa) return;

    setFase("salvando");
    try {
      const corte = limitesVisiveis(alfa, canvas.width, canvas.height);
      if (!corte) throw new Error("O recorte ficou vazio — ajuste o limiar.");

      const blob = await montarPng(canvas, alfa, corte);
      const id = novoId();
      await salvarAtivo({
        id,
        nome: `${ativo.nome} (recortado)`,
        familia: "pessoa",
        blob,
        largura: corte.largura,
        altura: corte.altura,
        criadoEm: Date.now(),
      });
      onPronto(id);
    } catch (e) {
      setRecado(e instanceof Error ? e.message : "Não consegui salvar.");
      setFase("pronto");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[color:var(--e-b1)] bg-[color:var(--e-superficie)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[color:var(--e-b1)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--e-t1)]">Remover o fundo</h2>
            <p className="mt-0.5 text-xs text-[color:var(--e-t3)]">
              Roda no seu navegador — a foto não sai daqui.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-md text-[color:var(--e-t3)] transition hover:bg-[color:var(--e-fill)] hover:text-[color:var(--e-t1)]"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div
            className={`grid min-h-[260px] flex-1 place-items-center overflow-auto p-4 ${
              fundoClaro
                ? "bg-[repeating-conic-gradient(#d8d8d8_0_25%,#f0f0f0_0_50%)]"
                : "bg-[repeating-conic-gradient(#1e1e1e_0_25%,#2a2a2a_0_50%)]"
            } bg-[length:22px_22px]`}
          >
            {fase === "carregando" || fase === "erro" ? (
              <p className="max-w-sm px-6 text-center text-sm leading-relaxed text-[color:var(--e-t2)]">
                {recado || "Preparando…"}
              </p>
            ) : (
              <canvas
                ref={telaRef}
                onPointerDown={aoDescer}
                onPointerMove={aoMover}
                onPointerUp={aoSubir}
                onPointerLeave={aoSubir}
                className="max-h-[58vh] max-w-full touch-none object-contain"
                style={{ cursor: ferramenta === "nenhuma" ? "default" : "crosshair" }}
              />
            )}
          </div>

          {fase !== "erro" && (
            <aside className="w-full shrink-0 overflow-y-auto border-t border-[color:var(--e-b1)] md:w-72 md:border-l md:border-t-0">
              <div className="flex flex-col gap-3 px-4 py-4">
                <Deslizante
                  rotulo="Limiar"
                  valor={ajustes.limiar}
                  min={0.05}
                  max={0.95}
                  passo={0.01}
                  onMudar={(limiar) => setAjustes((a) => ({ ...a, limiar }))}
                />
                <Deslizante
                  rotulo="Suavizar borda"
                  valor={ajustes.suavizacao}
                  min={0}
                  max={1}
                  passo={0.02}
                  onMudar={(suavizacao) => setAjustes((a) => ({ ...a, suavizacao }))}
                />
                <Deslizante
                  rotulo="Encolher / engordar"
                  valor={ajustes.ajusteBorda}
                  min={-20}
                  max={20}
                  sufixo="px"
                  onMudar={(ajusteBorda) => setAjustes((a) => ({ ...a, ajusteBorda }))}
                />

                <hr className="border-[color:var(--e-b1)]" />

                <Botoes
                  rotulo="Retoque"
                  valor={ferramenta}
                  opcoes={[
                    { valor: "nenhuma", rotulo: "Nenhum" },
                    { valor: "apagar", rotulo: "Apagar" },
                    { valor: "restaurar", rotulo: "Trazer" },
                  ]}
                  onMudar={setFerramenta}
                />
                {ferramenta !== "nenhuma" && (
                  <>
                    <Deslizante
                      rotulo="Tamanho do pincel"
                      valor={pincel}
                      min={6}
                      max={200}
                      onMudar={setPincel}
                    />
                    <button
                      type="button"
                      onClick={limparRetoque}
                      className="rounded-md border border-[color:var(--e-b1)] px-3 py-2 text-xs text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)]"
                    >
                      Desfazer todo o retoque
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setFundoClaro((v) => !v)}
                  className="rounded-md border border-[color:var(--e-b1)] px-3 py-2 text-xs text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)]"
                >
                  Conferir sobre fundo {fundoClaro ? "escuro" : "claro"}
                </button>
              </div>
            </aside>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--e-b1)] px-5 py-3">
          <span className="text-xs text-[color:var(--e-t3)]">
            {recado && fase !== "carregando" ? recado : "O original continua na biblioteca."}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-md border border-[color:var(--e-b1)] px-4 py-2 text-sm text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={aplicar}
              disabled={fase !== "pronto"}
              className="rounded-md bg-[#FFCB05] px-4 py-2 text-sm font-semibold text-[color:var(--e-tinta)] transition hover:bg-[#ffd63a] disabled:opacity-40"
            >
              {fase === "salvando" ? "Salvando…" : "Usar este recorte"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
