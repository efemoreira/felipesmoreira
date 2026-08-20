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
import {
  lerAtivo,
  listarProjetos,
  prepararAtivo,
  salvarAtivo,
  salvarProjeto,
} from "./armazenamento";
import { copiarPng, exportarPng } from "./exportar";
import {
  MODELOS,
  criarFoto,
  criarPessoa,
  montarComBriefing,
  novaCamada,
  projetoDoModelo,
  type Briefing,
  type Modelo,
} from "./modelos";
import Palco from "./Palco";
import Artes from "./painel/Artes";
import BarraSuperior from "./painel/BarraSuperior";
import Biblioteca from "./painel/Biblioteca";
import Inspetor from "./painel/Inspetor";
import ListaCamadas from "./painel/ListaCamadas";
import Assistente from "./painel/Assistente";
import Recorte from "./painel/Recorte";
import { useHistorico } from "./useHistorico";
import {
  FORMATOS,
  LIVRE_MAX,
  LIVRE_MIN,
  dimensoes,
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

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.4);
  const [selo, setSelo] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [escalaExport, setEscalaExport] = useState(0);
  const [recado, setRecado] = useState("");
  const [previa, setPrevia] = useState(false);
  const [guiasVisiveis, setGuiasVisiveis] = useState(true);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [artesAbertas, setArtesAbertas] = useState(false);
  const [bibliotecaPara, setBibliotecaPara] = useState<string | null>(null);
  const [recortando, setRecortando] = useState<Ativo | null>(null);
  const [gavetas, setGavetas] = useState<"camadas" | "inspetor" | null>(null);

  const palcoRef = useRef<Konva.Stage | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const camadaAtual =
    selecionados.length === 1
      ? projeto.camadas.find((c) => c.id === selecionados[0]) ?? null
      : null;
  const escolhidas = projeto.camadas.filter((c) => selecionados.includes(c.id));

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

  /* recado some sozinho: é aviso de passagem, não estado */
  useEffect(() => {
    if (!recado) return;
    const id = window.setTimeout(() => setRecado(""), 4000);
    return () => window.clearTimeout(id);
  }, [recado]);

  /* ===== zoom que cabe na janela ===== */
  const ajustarZoom = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const { largura, altura } = dimensoes(projeto);
    const cabe = Math.min(
      (area.clientWidth - 64) / largura,
      (area.clientHeight - 64) / altura,
    );
    setZoom(Math.max(0.08, Math.min(1, cabe)));
  }, [projeto]);

  useEffect(() => {
    ajustarZoom();
    window.addEventListener("resize", ajustarZoom);
    return () => window.removeEventListener("resize", ajustarZoom);
    // só as medidas da arte importam aqui, não cada mudança de camada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto.formato, projeto.tamanho?.largura, projeto.tamanho?.altura]);

  /* ===== seleção ===== */
  const selecionar = useCallback((id: string | null, juntar = false) => {
    setSelecionados((atual) => {
      if (id === null) return [];
      if (!juntar) return [id];
      return atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id];
    });
  }, []);

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

  /** A mesma mudança em todas as camadas selecionadas. */
  const alterarSelecionadas = useCallback(
    (mudanca: Partial<Camada>) =>
      mudarProjeto((p) => ({
        ...p,
        camadas: p.camadas.map((c) =>
          selecionados.includes(c.id) ? ({ ...c, ...mudanca } as Camada) : c,
        ),
      })),
    [mudarProjeto, selecionados],
  );

  const adicionar = useCallback(
    (tipo: TipoCamada) => {
      const nova = novaCamada(tipo, dimensoes(projeto));
      mudarProjeto((p) => ({ ...p, camadas: [...p.camadas, nova] }));
      setSelecionados([nova.id]);
    },
    [mudarProjeto, projeto],
  );

  const duplicar = useCallback(
    (ids: string[]) =>
      mudarProjeto((p) => {
        const camadas = [...p.camadas];
        // de trás para a frente, senão os índices já inseridos deslocam os próximos
        for (const id of [...ids].reverse()) {
          const i = camadas.findIndex((c) => c.id === id);
          if (i < 0) continue;
          camadas.splice(i + 1, 0, {
            ...camadas[i],
            id: novoId(),
            nome: `${camadas[i].nome} (cópia)`,
            x: camadas[i].x + 24,
            y: camadas[i].y + 24,
          } as Camada);
        }
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
    setSelecionados([fantasma.id]);
  }, [camadaAtual, mudarProjeto]);

  const excluir = useCallback(
    (ids: string[]) => {
      mudarProjeto((p) => ({ ...p, camadas: p.camadas.filter((c) => !ids.includes(c.id)) }));
      setSelecionados((atual) => atual.filter((s) => !ids.includes(s)));
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
    (passo: number | "topo" | "fundo") => {
      if (!selecionados.length) return;
      mudarProjeto((p) => {
        const escolhidas = p.camadas.filter((c) => selecionados.includes(c.id));
        const resto = p.camadas.filter((c) => !selecionados.includes(c.id));

        if (passo === "topo") return { ...p, camadas: [...resto, ...escolhidas] };
        if (passo === "fundo") return { ...p, camadas: [...escolhidas, ...resto] };

        // passo a passo: move uma de cada vez, na ordem que não atropela as outras
        const camadas = [...p.camadas];
        const ordem = passo > 0 ? [...selecionados].reverse() : selecionados;
        for (const id of ordem) {
          const i = camadas.findIndex((c) => c.id === id);
          const destino = Math.max(0, Math.min(camadas.length - 1, i + passo));
          if (i < 0 || destino === i) continue;
          const [item] = camadas.splice(i, 1);
          camadas.splice(destino, 0, item);
        }
        return { ...p, camadas };
      });
    },
    [mudarProjeto, selecionados],
  );

  /* ===== alinhar e distribuir (só faz sentido com várias) ===== */
  const alinhar = useCallback(
    (onde: "esq" | "centroX" | "dir" | "topo" | "centroY" | "base") => {
      const { largura: L, altura: A } = dimensoes(projeto);
      mudarProjeto((p) => ({
        ...p,
        camadas: p.camadas.map((c) => {
          if (!selecionados.includes(c.id) || !("largura" in c)) return c;
          const meiaL = c.largura / 2;
          const meiaA = "altura" in c ? (c as { altura: number }).altura / 2 : 0;
          switch (onde) {
            case "esq":
              return { ...c, x: Math.round(meiaL) };
            case "centroX":
              return { ...c, x: Math.round(L / 2) };
            case "dir":
              return { ...c, x: Math.round(L - meiaL) };
            case "topo":
              return { ...c, y: Math.round(meiaA) };
            case "centroY":
              return { ...c, y: Math.round(A / 2) };
            case "base":
              return { ...c, y: Math.round(A - meiaA) };
          }
        }) as Camada[],
      }));
    },
    [mudarProjeto, projeto, selecionados],
  );

  const distribuir = useCallback(
    (eixo: "x" | "y") => {
      if (selecionados.length < 3) return;
      mudarProjeto((p) => {
        const alvo = p.camadas.filter((c) => selecionados.includes(c.id) && "largura" in c);
        if (alvo.length < 3) return p;
        const ordenadas = [...alvo].sort((a, b) => a[eixo] - b[eixo]);
        const inicio = ordenadas[0][eixo];
        const fim = ordenadas[ordenadas.length - 1][eixo];
        const passo = (fim - inicio) / (ordenadas.length - 1);
        const posicoes = new Map(
          ordenadas.map((c, i) => [c.id, Math.round(inicio + passo * i)] as const),
        );
        return {
          ...p,
          camadas: p.camadas.map((c) =>
            posicoes.has(c.id) ? ({ ...c, [eixo]: posicoes.get(c.id) } as Camada) : c,
          ),
        };
      });
    },
    [mudarProjeto, selecionados],
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

  /**
   * Imagem que chega de fora — arrastada para o palco ou colada.
   *
   * PNG costuma ser recorte (vira `pessoa`); JPG e WEBP são cenário (viram
   * `foto`, atrás de tudo). Se a de cima é uma imagem já selecionada, a nova só
   * troca o conteúdo dela em vez de criar mais uma camada.
   */
  const receberArquivos = useCallback(
    async (arquivos: File[], ponto?: { x: number; y: number }) => {
      const imagens = arquivos.filter((a) => a.type.startsWith("image/"));
      if (!imagens.length) return;

      const trocar = camadaAtual && temImagem(camadaAtual) ? camadaAtual : null;
      const { largura: L, altura: A } = dimensoes(projeto);

      try {
        const novas: Camada[] = [];
        for (const arquivo of imagens) {
          const recorte = arquivo.type === "image/png";
          const ativo = await prepararAtivo(arquivo, recorte ? "pessoa" : "fundo", novoId());
          await salvarAtivo(ativo);

          if (trocar && imagens.length === 1) {
            aplicarAtivo(trocar.id, ativo.id);
            setRecado(`Imagem trocada em “${trocar.nome}”.`);
            return;
          }

          const molde = recorte ? criarPessoa({ largura: L, altura: A }) : criarFoto({ largura: L, altura: A });
          // cabe na arte sem distorcer, e cai onde foi solta
          const escala = Math.min((L * 0.8) / ativo.largura, (A * 0.8) / ativo.altura, 1);
          novas.push({
            ...molde,
            nome: ativo.nome,
            ativoId: ativo.id,
            largura: Math.max(8, Math.round(ativo.largura * escala)),
            altura: Math.max(8, Math.round(ativo.altura * escala)),
            x: Math.round(ponto?.x ?? L / 2),
            y: Math.round(ponto?.y ?? A / 2),
          } as Camada);
        }

        if (!novas.length) return;
        mudarProjeto((p) => ({ ...p, camadas: [...p.camadas, ...novas] }));
        setSelecionados(novas.map((c) => c.id));
        setRecado(
          novas.length === 1
            ? `“${novas[0].nome}” entrou como ${novas[0].tipo === "pessoa" ? "pessoa" : "foto de contexto"}.`
            : `${novas.length} imagens adicionadas.`,
        );
      } catch (e) {
        setRecado(e instanceof Error ? e.message : "Não consegui abrir essa imagem.");
      }
    },
    [aplicarAtivo, camadaAtual, mudarProjeto, projeto],
  );

  /** Onde o arquivo foi solto, em coordenadas da arte. */
  const soltarNoPalco = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const arquivos = Array.from(e.dataTransfer.files);
      if (!arquivos.length) return;
      const caixa = palcoRef.current?.container().getBoundingClientRect();
      const ponto = caixa
        ? { x: (e.clientX - caixa.left) / zoom, y: (e.clientY - caixa.top) / zoom }
        : undefined;
      void receberArquivos(arquivos, ponto);
    },
    [receberArquivos, zoom],
  );

  /* colar imagem da área de transferência */
  useEffect(() => {
    const aoColar = (e: ClipboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      const arquivos = Array.from(e.clipboardData?.files ?? []);
      if (!arquivos.length) return;
      e.preventDefault();
      void receberArquivos(arquivos);
    };
    window.addEventListener("paste", aoColar);
    return () => window.removeEventListener("paste", aoColar);
  }, [receberArquivos]);

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

  /** Cobre a arte inteira sem distorcer — o "object-fit: cover" da camada. */
  const preencherQuadro = useCallback(() => {
    if (!camadaAtual || !temImagem(camadaAtual) || !camadaAtual.ativoId) return;
    void lerAtivo(camadaAtual.ativoId).then((ativo) => {
      if (!ativo) return;
      const { largura: L, altura: A } = dimensoes(projeto);
      const escala = Math.max(L / ativo.largura, A / ativo.altura);
      alterarCamada(camadaAtual.id, {
        largura: Math.round(ativo.largura * escala),
        altura: Math.round(ativo.altura * escala),
        x: Math.round(L / 2),
        y: Math.round(A / 2),
      } as Partial<Camada>);
    });
  }, [alterarCamada, camadaAtual, projeto]);

  /* ===== formato, modelo, exportação ===== */
  /**
   * Trocar de formato reposiciona tudo em proporção nos dois eixos e escala os
   * tamanhos por igual (o menor dos dois fatores), para nada distorcer.
   * Antes só o eixo Y era mapeado, o que só funcionava porque todo formato tinha
   * 1080 de largura — com paisagem no meio, isso amontoaria a arte à esquerda.
   */
  const trocarFormato = useCallback(
    (formato: Formato, tamanho?: { largura: number; altura: number }) =>
      mudarProjeto((p) => {
        const antes = dimensoes(p);
        const alvo =
          formato === "livre"
            ? tamanho ?? p.tamanho ?? antes
            : FORMATOS[formato];

        const razaoL = alvo.largura / antes.largura;
        const razaoA = alvo.altura / antes.altura;
        const novoTamanho = formato === "livre" ? { ...alvo } : undefined;
        if (razaoL === 1 && razaoA === 1) {
          return { ...p, formato, tamanho: novoTamanho };
        }
        const escala = Math.min(razaoL, razaoA);

        return {
          ...p,
          formato,
          tamanho: novoTamanho,
          camadas: p.camadas.map((c) => {
            if (!("largura" in c)) return c; // fundo, sombreado e moldura são de borda a borda
            const base = {
              ...c,
              x: Math.round(c.x * razaoL),
              y: Math.round(c.y * razaoA),
              largura: Math.max(8, Math.round(c.largura * escala)),
            };
            if (c.tipo === "texto") {
              return { ...base, tamanho: Math.max(12, Math.round(c.tamanho * escala)) } as Camada;
            }
            return {
              ...base,
              altura: Math.max(8, Math.round((c as { altura: number }).altura * escala)),
            } as Camada;
          }),
        };
      }),
    [mudarProjeto],
  );

  const mudarTamanhoLivre = useCallback(
    (largura: number, altura: number) => {
      const limitar = (v: number) => Math.max(LIVRE_MIN, Math.min(LIVRE_MAX, Math.round(v || 0)));
      trocarFormato("livre", { largura: limitar(largura), altura: limitar(altura) });
    },
    [trocarFormato],
  );

  /* ===== trocar de arte =====
     `substituir` e não `mudarProjeto`: abrir outra arte não é um passo de
     edição, e ninguém espera que ⌘Z traga de volta a arte anterior. */

  const abrirArte = useCallback(
    (arte: Projeto) => {
      setArtesAbertas(false);
      setSelecionados([]);
      substituir(arte);
      setRecado(`Abri “${arte.nome}”.`);
    },
    [substituir],
  );

  /** Uma arte em branco, no formato de agora — o modelo "Do zero". */
  const novaArte = useCallback(() => {
    const limpo = MODELOS.find((m) => m.chave === "limpo") ?? MODELOS[0];
    const arte = projetoDoModelo(limpo, projeto.formato);
    setArtesAbertas(false);
    setSelecionados([]);
    substituir(
      projeto.formato === "livre" ? { ...arte, tamanho: projeto.tamanho } : arte,
    );
    setRecado("Arte nova. A anterior continua guardada em “Artes”.");
  }, [projeto.formato, projeto.tamanho, substituir]);

  /**
   * Troca a arte inteira pelo que o assistente montou. O nome do projeto passa
   * a ser o título digitado — é assim que o PNG exportado já sai nomeado.
   */
  const montarArte = useCallback(
    (modelo: Modelo, formato: Formato, briefing: Briefing) => {
      setAssistenteAberto(false);
      setSelecionados([]);
      mudarProjeto((p) => ({
        ...p,
        nome: briefing.titulo.trim() ? briefing.titulo.trim().slice(0, 40) : modelo.nome,
        formato,
        tamanho: formato === "livre" ? p.tamanho : undefined,
        camadas: montarComBriefing(modelo, formato, briefing),
      }));
    },
    [mudarProjeto],
  );

  /**
   * Gera o PNG. A `escalaExport` também sobe a resolução do cache dos filtros:
   * sem isso o 2× ampliava um bitmap de 1× e as camadas com ajuste, tinta ou
   * esmaecer saíam borradas justamente no arquivo de maior qualidade.
   */
  const entregar = useCallback(
    async (escala: number, copiar: boolean) => {
      const palco = palcoRef.current;
      if (!palco) return;
      setSelecionados([]);
      setEscalaExport(escala);
      try {
        // dois quadros para o palco redesenhar sem alças, guias nem cache antigo
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const { largura, altura } = dimensoes(projeto);
        if (copiar) {
          await copiarPng(palco, largura, altura, escala);
          setRecado("Imagem copiada — é só colar no WhatsApp ou no Instagram.");
        } else {
          await exportarPng(palco, largura, altura, escala, projeto.nome);
        }
      } catch (e) {
        setRecado(e instanceof Error ? e.message : "Não consegui gerar a imagem.");
      } finally {
        setEscalaExport(0);
      }
    },
    [projeto],
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
        if (selecionados.length) duplicar(selecionados);
        return;
      }
      if (cmd && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelecionados(projeto.camadas.filter((c) => !c.travada).map((c) => c.id));
        return;
      }
      if (cmd && e.key === "0") {
        e.preventDefault();
        ajustarZoom();
        return;
      }
      if (e.key === "Escape") {
        setSelecionados([]);
        setPrevia(false);
        return;
      }
      if (e.key.toLowerCase() === "p" && !cmd) {
        e.preventDefault();
        setPrevia((v) => !v);
        return;
      }
      if (!selecionados.length) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        excluir(escolhidas.filter((c) => c.tipo !== "fundo").map((c) => c.id));
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const paraFrente = e.key === "]";
        deslocarZ(e.shiftKey ? (paraFrente ? "topo" : "fundo") : paraFrente ? 1 : -1);
        return;
      }
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const passo = e.shiftKey ? 10 : 1;
        const delta = {
          ArrowUp: { x: 0, y: -passo },
          ArrowDown: { x: 0, y: passo },
          ArrowLeft: { x: -passo, y: 0 },
          ArrowRight: { x: passo, y: 0 },
        }[e.key];
        if (!delta) return;
        mudarProjeto((p) => ({
          ...p,
          camadas: p.camadas.map((c) =>
            selecionados.includes(c.id) && "largura" in c
              ? ({ ...c, x: c.x + delta.x, y: c.y + delta.y } as Camada)
              : c,
          ),
        }));
      }
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [
    ajustarZoom,
    deslocarZ,
    desfazer,
    duplicar,
    escolhidas,
    excluir,
    mudarProjeto,
    projeto.camadas,
    refazer,
    selecionados,
  ]);

  const familiaBiblioteca =
    bibliotecaPara &&
    projeto.camadas.find((c) => c.id === bibliotecaPara)?.tipo === "foto"
      ? "fundo"
      : "pessoa";

  return (
    /* --barra fica aqui, e não no <header>: as gavetas do celular são irmãs
       dele e precisam ler a mesma altura para não nascerem por baixo da barra */
    <div
      style={{ ["--barra" as string]: "3.25rem" }}
      className="flex h-dvh flex-col bg-[color:var(--e-fundo)] text-[color:var(--e-t1)]"
    >
      <BarraSuperior
        nome={projeto.nome}
        formato={projeto.formato}
        tamanho={dimensoes(projeto)}
        zoom={zoom}
        podeDesfazer={podeDesfazer}
        podeRefazer={podeRefazer}
        salvando={salvando}
        exportando={escalaExport > 0}
        previa={previa}
        guiasVisiveis={guiasVisiveis}
        onNome={(nome) => mudarProjeto((p) => ({ ...p, nome }), true)}
        onFormato={(f) => trocarFormato(f)}
        onTamanhoLivre={mudarTamanhoLivre}
        onZoom={setZoom}
        onAjustarZoom={ajustarZoom}
        onDesfazer={desfazer}
        onRefazer={refazer}
        onPrevia={() => setPrevia((v) => !v)}
        onGuias={() => setGuiasVisiveis((v) => !v)}
        onExportar={(escala) => void entregar(escala, false)}
        onCopiar={() => void entregar(1, true)}
        onAbrirModelos={() => setAssistenteAberto(true)}
        onAbrirArtes={() => setArtesAbertas(true)}
        onNovaArte={novaArte}
      />

      <div className="flex min-h-0 flex-1">
        {/* colunas viram gavetas no celular */}
        <aside
          className={`w-60 shrink-0 border-r border-[color:var(--e-b1)] bg-[color:var(--e-superficie)] lg:block ${
            gavetas === "camadas"
              ? "fixed bottom-0 left-0 top-[var(--barra)] z-40 block"
              : "hidden"
          }`}
        >
          <ListaCamadas
            camadas={projeto.camadas}
            selecionados={selecionados}
            formato={dimensoes(projeto)}
            onSelecionar={selecionar}
            onAlterar={alterarCamada}
            onMover={mover}
            onDuplicar={(id) => duplicar([id])}
            onExcluir={(id) => excluir([id])}
            onAdicionar={adicionar}
          />
        </aside>

        <main
          ref={areaRef}
          className="grid min-w-0 flex-1 place-items-center overflow-auto bg-[color:var(--e-fundo)] p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--e-grade) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={soltarNoPalco}
        >
          <div className="shadow-[0_20px_60px_var(--e-sombra-palco)]">
            <Palco
              projeto={projeto}
              selecionados={selecionados}
              onSelecionar={selecionar}
              onAlterar={(id, m) => alterarCamada(id, m, true)}
              onFimDeGesto={fechar}
              zoom={zoom}
              onZoom={setZoom}
              palcoRef={palcoRef}
              selo={selo}
              escalaExport={escalaExport}
              previa={previa}
              guiasVisiveis={guiasVisiveis}
            />
          </div>
        </main>

        <aside
          className={`w-72 shrink-0 overflow-y-auto border-l border-[color:var(--e-b1)] bg-[color:var(--e-superficie)] lg:block ${
            gavetas === "inspetor"
              ? "fixed bottom-0 right-0 top-[var(--barra)] z-40 block"
              : "hidden"
          }`}
        >
          <Inspetor
            camada={camadaAtual}
            varias={escolhidas.length > 1 ? escolhidas : null}
            medidas={dimensoes(projeto)}
            onAlterar={(m) => camadaAtual && alterarCamada(camadaAtual.id, m)}
            onAlterarVarias={alterarSelecionadas}
            onAlinhar={alinhar}
            onDistribuir={distribuir}
            onOrdenar={deslocarZ}
            onDuplicarSelecao={() => duplicar(selecionados)}
            onExcluirSelecao={() =>
              excluir(escolhidas.filter((c) => c.tipo !== "fundo").map((c) => c.id))
            }
            onTrocarImagem={() => camadaAtual && setBibliotecaPara(camadaAtual.id)}
            onDuplicarFantasma={duplicarFantasma}
            onAjustarProporcao={ajustarProporcao}
            onPreencherQuadro={preencherQuadro}
            onRemoverFundo={abrirRecorte}
          />
        </aside>
      </div>

      {/* Barra de gavetas: só em tela estreita. Mesma língua da barra inferior
          do painel — borda grossa em cima, Special Elite, alvo de 44px. */}
      <nav className="flex border-t-[3px] border-[color:var(--e-b2)] bg-[color:var(--e-superficie)] lg:hidden">
        {(["camadas", "inspetor"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGavetas((atual) => (atual === g ? null : g))}
            aria-pressed={gavetas === g}
            className={`min-h-[48px] flex-1 py-3 font-[family-name:var(--font-elite)] text-[11px] uppercase tracking-[.12em] transition ${
              gavetas === g
                ? "bg-[#FFCB05] text-[color:var(--e-tinta)]"
                : "text-[color:var(--e-t3)] hover:bg-[color:var(--e-fill)]"
            }`}
          >
            {g === "camadas" ? "Camadas" : "Propriedades"}
          </button>
        ))}
      </nav>

      {recado && (
        <p
          role="status"
          className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-md border border-[#FFCB05]/40 bg-[color:var(--e-superficie)] px-4 py-2 text-sm text-[color:var(--e-t1)] shadow-xl lg:bottom-6"
        >
          {recado}
        </p>
      )}

      {artesAbertas && (
        <Artes
          atual={projeto}
          onAbrir={abrirArte}
          onNova={novaArte}
          onFechar={() => setArtesAbertas(false)}
        />
      )}

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
            if (camadaAtual) aplicarAtivo(camadaAtual.id, novo);
          }}
        />
      )}
    </div>
  );
}
