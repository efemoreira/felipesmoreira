"use client";

/**
 * Estúdio de Artes — montagem de convites, avisos de reunião e manchetes.
 *
 * Tudo roda no navegador: as artes e a biblioteca de imagens ficam no
 * IndexedDB desta máquina e a entrega é o PNG baixado. Nada sobe para o
 * servidor — a página é estática, o PHP só confere a senha antes de servi-la.
 */
import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fontesProntas, limparCacheDeFontes } from "@/lib/fontes";
import { lerAtivo, listarProjetos, salvarProjeto } from "./armazenamento";
import { exportarPng } from "./exportar";
import {
  MODELOS,
  montarComBriefing,
  novaCamada,
  projetoDoModelo,
  type Briefing,
  type Modelo,
} from "./modelos";
import Palco from "./Palco";
import BarraSuperior from "./painel/BarraSuperior";
import Biblioteca from "./painel/Biblioteca";
import Inspetor from "./painel/Inspetor";
import ListaCamadas from "./painel/ListaCamadas";
import Assistente from "./painel/Assistente";
import Recorte from "./painel/Recorte";
import { useHistorico } from "./useHistorico";
import {
  FORMATOS,
  novoId,
  temImagem,
  type Ativo,
  type Camada,
  type Formato,
  type Projeto,
  type TipoCamada,
} from "./tipos";

const FORMATO_PADRAO: Formato = "4:5";

export default function Estudio() {
  const inicial = useMemo(
    () => projetoDoModelo(MODELOS[0], FORMATO_PADRAO),
    [],
  );

  const {
    estado: projeto,
    aplicar,
    fechar,
    desfazer,
    refazer,
    substituir,
    podeDesfazer,
    podeRefazer,
  } = useHistorico<Projeto>(inicial);

  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.4);
  const [selo, setSelo] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [bibliotecaPara, setBibliotecaPara] = useState<string | null>(null);
  const [recortando, setRecortando] = useState<Ativo | null>(null);
  const [gavetas, setGavetas] = useState<"camadas" | "inspetor" | null>(null);

  const palcoRef = useRef<Konva.Stage | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const camadaAtual = projeto.camadas.find((c) => c.id === selecionado) ?? null;

  /* ===== fontes: os textos precisam remedir quando elas chegam ===== */
  useEffect(() => {
    let vivo = true;
    void fontesProntas().then(() => {
      if (!vivo) return;
      limparCacheDeFontes(); // o que foi medido antes usou a fonte de reserva
      setSelo((s) => s + 1);
    });
    return () => {
      vivo = false;
    };
  }, []);

  /* ===== retoma o último projeto guardado ===== */
  useEffect(() => {
    let vivo = true;
    void listarProjetos().then((lista) => {
      if (vivo && lista.length) substituir(lista[0]);
    });
    return () => {
      vivo = false;
    };
  }, [substituir]);

  /* ===== autosave ===== */
  useEffect(() => {
    setSalvando(true);
    const id = window.setTimeout(() => {
      void salvarProjeto({ ...projeto, atualizadoEm: Date.now() }).finally(() =>
        setSalvando(false),
      );
    }, 700);
    return () => window.clearTimeout(id);
  }, [projeto]);

  /* ===== zoom que cabe na janela ===== */
  const ajustarZoom = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const { largura, altura } = FORMATOS[projeto.formato];
    const cabe = Math.min(
      (area.clientWidth - 64) / largura,
      (area.clientHeight - 64) / altura,
    );
    setZoom(Math.max(0.08, Math.min(1, cabe)));
  }, [projeto.formato]);

  useEffect(() => {
    ajustarZoom();
    window.addEventListener("resize", ajustarZoom);
    return () => window.removeEventListener("resize", ajustarZoom);
  }, [ajustarZoom]);

  /* ===== operações sobre camadas ===== */
  const mudarProjeto = useCallback(
    (fn: (p: Projeto) => Projeto, efemera = false) => aplicar((p) => fn(p), efemera),
    [aplicar],
  );

  const alterarCamada = useCallback(
    (id: string, mudanca: Partial<Camada>, efemera = false) =>
      mudarProjeto(
        (p) => ({
          ...p,
          camadas: p.camadas.map((c) => (c.id === id ? ({ ...c, ...mudanca } as Camada) : c)),
        }),
        efemera,
      ),
    [mudarProjeto],
  );

  const adicionar = useCallback(
    (tipo: TipoCamada) => {
      const nova = novaCamada(tipo, projeto.formato);
      mudarProjeto((p) => ({ ...p, camadas: [...p.camadas, nova] }));
      setSelecionado(nova.id);
    },
    [mudarProjeto, projeto.formato],
  );

  const duplicar = useCallback(
    (id: string) =>
      mudarProjeto((p) => {
        const i = p.camadas.findIndex((c) => c.id === id);
        if (i < 0) return p;
        const copia = {
          ...p.camadas[i],
          id: novoId(),
          nome: `${p.camadas[i].nome} (cópia)`,
          x: p.camadas[i].x + 24,
          y: p.camadas[i].y + 24,
        } as Camada;
        const camadas = [...p.camadas];
        camadas.splice(i + 1, 0, copia);
        return { ...p, camadas };
      }),
    [mudarProjeto],
  );

  /** A cópia esmaecida atrás da pessoa — o efeito das referências com 2 e 3 rostos. */
  const duplicarFantasma = useCallback(() => {
    if (!camadaAtual || camadaAtual.tipo !== "pessoa") return;
    const fantasma: Camada = {
      ...camadaAtual,
      id: novoId(),
      nome: `${camadaAtual.nome} (fantasma)`,
      x: camadaAtual.x - Math.round(camadaAtual.largura * 0.28),
      y: camadaAtual.y - Math.round(camadaAtual.altura * 0.1),
      largura: Math.round(camadaAtual.largura * 0.82),
      altura: Math.round(camadaAtual.altura * 0.82),
      opacidade: 0.2,
      tinta: { ativa: true, cor: "#FFFFFF", forca: 1 },
      halo: { ...camadaAtual.halo, ativo: false },
      sombra: { ...camadaAtual.sombra, ativa: false },
    };
    mudarProjeto((p) => {
      const i = p.camadas.findIndex((c) => c.id === camadaAtual.id);
      const camadas = [...p.camadas];
      camadas.splice(Math.max(0, i), 0, fantasma);
      return { ...p, camadas };
    });
    setSelecionado(fantasma.id);
  }, [camadaAtual, mudarProjeto]);

  const excluir = useCallback(
    (id: string) => {
      mudarProjeto((p) => ({ ...p, camadas: p.camadas.filter((c) => c.id !== id) }));
      setSelecionado((atual) => (atual === id ? null : atual));
    },
    [mudarProjeto],
  );

  const mover = useCallback(
    (id: string, destino: number) =>
      mudarProjeto((p) => {
        const origem = p.camadas.findIndex((c) => c.id === id);
        if (origem < 0 || origem === destino) return p;
        const camadas = [...p.camadas];
        const [item] = camadas.splice(origem, 1);
        camadas.splice(destino, 0, item);
        return { ...p, camadas };
      }),
    [mudarProjeto],
  );

  const deslocarZ = useCallback(
    (passo: number) => {
      if (!selecionado) return;
      const i = projeto.camadas.findIndex((c) => c.id === selecionado);
      const destino = Math.max(0, Math.min(projeto.camadas.length - 1, i + passo));
      if (i >= 0 && destino !== i) mover(selecionado, destino);
    },
    [mover, projeto.camadas, selecionado],
  );

  /* ===== imagens ===== */

  /** Aplica um ativo à camada corrigindo a altura pela proporção da imagem. */
  const aplicarAtivo = useCallback(
    (camadaId: string, ativoId: string) => {
      void lerAtivo(ativoId).then((ativo) => {
        const camada = projeto.camadas.find((c) => c.id === camadaId);
        if (!camada || !temImagem(camada) || !ativo) return;

        const altura =
          camada.tipo === "avatar"
            ? camada.altura
            : Math.round((camada.largura * ativo.altura) / ativo.largura);
        alterarCamada(camadaId, { ativoId, altura } as Partial<Camada>);
      });
    },
    [alterarCamada, projeto.camadas],
  );

  const escolherImagem = useCallback(
    (ativoId: string) => {
      const alvo = bibliotecaPara;
      setBibliotecaPara(null);
      if (alvo) aplicarAtivo(alvo, ativoId);
    },
    [aplicarAtivo, bibliotecaPara],
  );

  const abrirRecorte = useCallback(() => {
    if (!camadaAtual || !temImagem(camadaAtual) || !camadaAtual.ativoId) return;
    void lerAtivo(camadaAtual.ativoId).then((ativo) => ativo && setRecortando(ativo));
  }, [camadaAtual]);

  const ajustarProporcao = useCallback(() => {
    if (!camadaAtual || !temImagem(camadaAtual) || !camadaAtual.ativoId) return;
    void lerAtivo(camadaAtual.ativoId).then((ativo) => {
      if (!ativo) return;
      alterarCamada(camadaAtual.id, {
        altura: Math.round((camadaAtual.largura * ativo.altura) / ativo.largura),
      } as Partial<Camada>);
    });
  }, [alterarCamada, camadaAtual]);

  /* ===== formato, modelo, exportação ===== */
  /**
   * Todos os formatos têm 1080 de largura, então só a altura muda: as camadas
   * acompanham na proporção. Sem isso, trocar de 4:5 para 9:16 deixaria tudo
   * amontoado em cima, com a arte inteira para refazer.
   */
  const trocarFormato = useCallback(
    (formato: Formato) =>
      mudarProjeto((p) => {
        const razao = FORMATOS[formato].altura / FORMATOS[p.formato].altura;
        if (razao === 1) return { ...p, formato };
        return {
          ...p,
          formato,
          camadas: p.camadas.map((c) =>
            "largura" in c ? ({ ...c, y: Math.round(c.y * razao) } as Camada) : c,
          ),
        };
      }),
    [mudarProjeto],
  );

  /**
   * Troca a arte inteira pelo que o assistente montou. O nome do projeto passa
   * a ser o título digitado — é assim que o PNG exportado já sai nomeado.
   */
  const montarArte = useCallback(
    (modelo: Modelo, formato: Formato, briefing: Briefing) => {
      setAssistenteAberto(false);
      setSelecionado(null);
      mudarProjeto((p) => ({
        ...p,
        nome: briefing.titulo.trim() ? briefing.titulo.trim().slice(0, 40) : modelo.nome,
        formato,
        camadas: montarComBriefing(modelo, formato, briefing),
      }));
    },
    [mudarProjeto],
  );

  const exportar = useCallback(
    async (escala: number) => {
      const palco = palcoRef.current;
      if (!palco) return;
      setSelecionado(null);
      setExportando(true);
      try {
        // um quadro para o palco redesenhar sem alças nem guias
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const { largura, altura } = FORMATOS[projeto.formato];
        await exportarPng(palco, largura, altura, escala, projeto.nome);
      } finally {
        setExportando(false);
      }
    },
    [projeto.formato, projeto.nome],
  );

  /* ===== atalhos ===== */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;

      const cmd = e.metaKey || e.ctrlKey;

      if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) refazer();
        else desfazer();
        return;
      }
      if (cmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selecionado) duplicar(selecionado);
        return;
      }
      if (cmd && e.key === "0") {
        e.preventDefault();
        ajustarZoom();
        return;
      }
      if (!selecionado) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (camadaAtual?.tipo !== "fundo") excluir(selecionado);
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        deslocarZ(e.key === "]" ? 1 : -1);
        return;
      }
      if (e.key.startsWith("Arrow") && camadaAtual && "largura" in camadaAtual) {
        e.preventDefault();
        const passo = e.shiftKey ? 10 : 1;
        const delta = {
          ArrowUp: { y: -passo },
          ArrowDown: { y: passo },
          ArrowLeft: { x: -passo },
          ArrowRight: { x: passo },
        }[e.key];
        if (delta) {
          alterarCamada(selecionado, {
            x: camadaAtual.x + ("x" in delta ? delta.x! : 0),
            y: camadaAtual.y + ("y" in delta ? delta.y! : 0),
          } as Partial<Camada>);
        }
      }
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [
    ajustarZoom,
    alterarCamada,
    camadaAtual,
    deslocarZ,
    desfazer,
    duplicar,
    excluir,
    refazer,
    selecionado,
  ]);

  const familiaBiblioteca =
    bibliotecaPara &&
    projeto.camadas.find((c) => c.id === bibliotecaPara)?.tipo === "foto"
      ? "fundo"
      : "pessoa";

  return (
    <div className="flex h-dvh flex-col bg-[#0D0B08] text-white">
      <BarraSuperior
        nome={projeto.nome}
        formato={projeto.formato}
        zoom={zoom}
        podeDesfazer={podeDesfazer}
        podeRefazer={podeRefazer}
        salvando={salvando}
        exportando={exportando}
        onNome={(nome) => mudarProjeto((p) => ({ ...p, nome }), true)}
        onFormato={trocarFormato}
        onZoom={setZoom}
        onAjustarZoom={ajustarZoom}
        onDesfazer={desfazer}
        onRefazer={refazer}
        onExportar={(escala) => void exportar(escala)}
        onAbrirModelos={() => setAssistenteAberto(true)}
      />

      <div className="flex min-h-0 flex-1">
        {/* colunas viram gavetas no celular */}
        <aside
          className={`w-60 shrink-0 border-r border-white/10 bg-[#14110C] lg:block ${
            gavetas === "camadas"
              ? "fixed inset-y-0 left-0 top-0 z-40 block pt-14"
              : "hidden"
          }`}
        >
          <ListaCamadas
            camadas={projeto.camadas}
            selecionado={selecionado}
            onSelecionar={setSelecionado}
            onAlterar={alterarCamada}
            onMover={mover}
            onDuplicar={duplicar}
            onExcluir={excluir}
            onAdicionar={adicionar}
          />
        </aside>

        <main
          ref={areaRef}
          className="grid min-w-0 flex-1 place-items-center overflow-auto bg-[#0D0B08] p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.055) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          <div className="shadow-[0_20px_60px_rgba(0,0,0,.6)]">
            <Palco
              projeto={projeto}
              selecionado={selecionado}
              onSelecionar={setSelecionado}
              onAlterar={(id, m) => alterarCamada(id, m, true)}
              onFimDeGesto={fechar}
              zoom={zoom}
              onZoom={setZoom}
              palcoRef={palcoRef}
              selo={selo}
              exportando={exportando}
            />
          </div>
        </main>

        <aside
          className={`w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-[#14110C] lg:block ${
            gavetas === "inspetor"
              ? "fixed inset-y-0 right-0 top-0 z-40 block pt-14"
              : "hidden"
          }`}
        >
          <Inspetor
            camada={camadaAtual}
            formato={projeto.formato}
            onAlterar={(m) => selecionado && alterarCamada(selecionado, m)}
            onTrocarImagem={() => selecionado && setBibliotecaPara(selecionado)}
            onDuplicarFantasma={duplicarFantasma}
            onAjustarProporcao={ajustarProporcao}
            onRemoverFundo={abrirRecorte}
          />
        </aside>
      </div>

      {/* barra de gavetas: só aparece em tela estreita */}
      <nav className="flex border-t border-white/10 bg-[#14110C] lg:hidden">
        {(["camadas", "inspetor"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGavetas((atual) => (atual === g ? null : g))}
            className={`flex-1 py-3 text-xs uppercase tracking-wider transition ${
              gavetas === g ? "bg-[#FFCB05] text-[#14110C]" : "text-white/50"
            }`}
          >
            {g === "camadas" ? "Camadas" : "Propriedades"}
          </button>
        ))}
      </nav>

      {assistenteAberto && (
        <Assistente
          formato={projeto.formato}
          onMontar={montarArte}
          onFechar={() => setAssistenteAberto(false)}
        />
      )}

      {bibliotecaPara && (
        <Biblioteca
          familia={familiaBiblioteca}
          onEscolher={escolherImagem}
          onFechar={() => setBibliotecaPara(null)}
        />
      )}

      {recortando && (
        <Recorte
          ativo={recortando}
          onFechar={() => setRecortando(null)}
          onPronto={(novo) => {
            setRecortando(null);
            if (selecionado) aplicarAtivo(selecionado, novo);
          }}
        />
      )}
    </div>
  );
}
