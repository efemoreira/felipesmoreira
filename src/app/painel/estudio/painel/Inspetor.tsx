"use client";

/** Propriedades da camada selecionada — muda conforme o tipo. */
import { useState } from "react";
import { medirTexto } from "../texto";
import { FONTES, FUNDOS, TINTAS } from "../paleta";
import { ROTULO_TEXTURA } from "../textura";
import type {
  Ajustes,
  Camada,
  CamadaAvatar,
  CamadaFoto,
  CamadaFundo,
  CamadaMoldura,
  CamadaPadrao,
  CamadaPessoa,
  CamadaSombreado,
  CamadaTextura,
  CamadaTexto,
  ChaveFonte,
  Esmaecimento,
  Mistura,
  Sombra,
} from "../tipos";
import { ROTULO_TIPO, temImagem } from "../tipos";

/** As mesmas opções de mistura em foto, padrão e textura. */
const MISTURAS: { valor: Mistura; rotulo: string }[] = [
  { valor: "normal", rotulo: "Normal" },
  { valor: "multiply", rotulo: "Multiplicar" },
  { valor: "screen", rotulo: "Clarear" },
  { valor: "overlay", rotulo: "Sobrepor" },
  { valor: "soft-light", rotulo: "Luz suave" },
  { valor: "luminosity", rotulo: "Luminosidade" },
];
import {
  AreaTexto,
  Aviso,
  Botoes,
  Chave,
  Cor,
  Deslizante,
  Escolha,
  Lados,
  Numero,
  Presets,
  Secao,
  Texto as CampoTexto,
} from "./Controles";

interface Props {
  camada: Camada | null;
  /** quando há mais de uma selecionada, elas vêm aqui e `camada` é null */
  varias: Camada[] | null;
  medidas: { largura: number; altura: number };
  onAlterar: (mudanca: Partial<Camada>) => void;
  onAlterarVarias: (mudanca: Partial<Camada>) => void;
  onAlinhar: (onde: "esq" | "centroX" | "dir" | "topo" | "centroY" | "base") => void;
  onDistribuir: (eixo: "x" | "y") => void;
  onOrdenar: (passo: number | "topo" | "fundo") => void;
  onDuplicarSelecao: () => void;
  onExcluirSelecao: () => void;
  onTrocarImagem: () => void;
  onDuplicarFantasma: () => void;
  onAjustarProporcao: () => void;
  onPreencherQuadro: () => void;
  onRemoverFundo: () => void;
}

export default function Inspetor({
  camada,
  varias,
  medidas,
  onAlterar,
  onAlterarVarias,
  onAlinhar,
  onDistribuir,
  onOrdenar,
  onDuplicarSelecao,
  onExcluirSelecao,
  onTrocarImagem,
  onDuplicarFantasma,
  onAjustarProporcao,
  onPreencherQuadro,
  onRemoverFundo,
}: Props) {
  if (varias?.length) {
    return (
      <PainelVarios
        camadas={varias}
        onAlterar={onAlterarVarias}
        onAlinhar={onAlinhar}
        onDistribuir={onDistribuir}
        onOrdenar={onOrdenar}
        onDuplicar={onDuplicarSelecao}
        onExcluir={onExcluirSelecao}
      />
    );
  }

  if (!camada) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm leading-relaxed text-white/35">
          Escolha uma camada no palco ou na lista à esquerda para editar.
        </p>
        <p className="mt-4 text-[11px] leading-relaxed text-white/25">
          Arraste uma imagem para o palco ou cole com ⌘V — PNG entra como pessoa
          recortada, JPG como foto de contexto.
          <br />
          <span className="mt-2 block">
            ⇧ ou ⌘ + clique junta camadas · Alt + clique pega a de baixo · P vê sem guias
          </span>
        </p>
      </div>
    );
  }

  const alterar = onAlterar as (m: Record<string, unknown>) => void;
  const { largura: L, altura: A } = medidas;

  return (
    <div className="flex flex-col">
      <Secao titulo="Camada">
        <CampoTexto rotulo="Nome" valor={camada.nome} onMudar={(nome) => alterar({ nome })} />
        <Deslizante
          rotulo="Opacidade"
          valor={camada.opacidade}
          min={0}
          max={1}
          passo={0.01}
          onMudar={(opacidade) => alterar({ opacidade })}
        />
        <div className="flex gap-2">
          <BotaoMenor onClick={() => onOrdenar("fundo")}>⤓ Para o fundo</BotaoMenor>
          <BotaoMenor onClick={() => onOrdenar("topo")}>⤒ Para a frente</BotaoMenor>
        </div>
      </Secao>

      {"largura" in camada && (
        <Secao titulo="Posição e tamanho">
          <div className="grid grid-cols-2 gap-2">
            <Numero rotulo="X" valor={camada.x} onMudar={(x) => alterar({ x })} />
            <Numero rotulo="Y" valor={camada.y} onMudar={(y) => alterar({ y })} />
            <Numero
              rotulo="Largura"
              valor={camada.largura}
              onMudar={(largura) => alterar({ largura: Math.max(8, largura) })}
            />
            {camada.tipo !== "texto" && (
              <Numero
                rotulo="Altura"
                valor={(camada as CamadaFoto).altura}
                onMudar={(altura) => alterar({ altura: Math.max(8, altura) })}
              />
            )}
          </div>
          <Deslizante
            rotulo="Rotação"
            valor={camada.rotacao}
            min={-180}
            max={180}
            sufixo="°"
            onMudar={(rotacao) => alterar({ rotacao })}
          />
          <div className="flex gap-2">
            <BotaoMenor onClick={() => alterar({ x: Math.round(L / 2) })}>
              Centralizar ↔
            </BotaoMenor>
            <BotaoMenor onClick={() => alterar({ y: Math.round(A / 2) })}>
              Centralizar ↕
            </BotaoMenor>
          </div>
        </Secao>
      )}

      {temImagem(camada) && (
        <Secao titulo="Imagem">
          <BotaoMenor onClick={onTrocarImagem} destaque>
            {camada.ativoId ? "Trocar imagem" : "Escolher imagem"}
          </BotaoMenor>
          {camada.tipo !== "avatar" && (
            <Chave
              rotulo="Espelhar"
              ligada={camada.espelhado}
              onMudar={(espelhado) => alterar({ espelhado })}
            />
          )}
          {camada.ativoId && (
            <>
              <BotaoMenor onClick={onRemoverFundo}>✂ Remover o fundo</BotaoMenor>
              <BotaoMenor onClick={onAjustarProporcao}>Ajustar à proporção original</BotaoMenor>
              <BotaoMenor onClick={onPreencherQuadro}>Preencher o quadro</BotaoMenor>
            </>
          )}
        </Secao>
      )}

      {temImagem(camada) && <PainelBordas esmaecer={camada.esmaecer} alterar={alterar} />}

      {camada.tipo === "fundo" && <PainelFundo camada={camada} alterar={alterar} />}
      {camada.tipo === "padrao" && <PainelPadrao camada={camada} alterar={alterar} />}
      {camada.tipo === "textura" && (
        <PainelTextura camada={camada} alterar={alterar} onTrocarImagem={onTrocarImagem} />
      )}
      {camada.tipo === "sombreado" && <PainelSombreado camada={camada} alterar={alterar} />}
      {camada.tipo === "moldura" && <PainelMoldura camada={camada} alterar={alterar} />}
      {camada.tipo === "texto" && <PainelTexto camada={camada} alterar={alterar} />}
      {camada.tipo === "foto" && <PainelFoto camada={camada} alterar={alterar} />}
      {camada.tipo === "avatar" && <PainelAvatar camada={camada} alterar={alterar} />}
      {camada.tipo === "pessoa" && (
        <PainelPessoa
          camada={camada}
          alterar={alterar}
          onDuplicarFantasma={onDuplicarFantasma}
        />
      )}
    </div>
  );
}

/* ===== auxiliares ===== */

type Alterar = (m: Record<string, unknown>) => void;

function BotaoMenor({
  children,
  onClick,
  destaque,
  risco,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destaque?: boolean;
  risco?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md px-3 py-2 text-xs font-medium transition ${
        destaque
          ? "bg-[#FFCB05] text-[#14110C] hover:bg-[#ffd63a]"
          : risco
            ? "border border-red-400/40 text-red-200 hover:border-red-400 hover:bg-red-500/10"
            : "border border-white/12 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * O que dá para fazer com várias camadas de uma vez.
 *
 * Alinhar duas pessoas pela base, ou esconder o trio de fantasmas, era item a
 * item antes disto — e é justamente o que mais se repete montando uma arte.
 */
function PainelVarios({
  camadas,
  onAlterar,
  onAlinhar,
  onDistribuir,
  onOrdenar,
  onDuplicar,
  onExcluir,
}: {
  camadas: Camada[];
  onAlterar: (m: Partial<Camada>) => void;
  onAlinhar: (onde: "esq" | "centroX" | "dir" | "topo" | "centroY" | "base") => void;
  onDistribuir: (eixo: "x" | "y") => void;
  onOrdenar: (passo: number | "topo" | "fundo") => void;
  onDuplicar: () => void;
  onExcluir: () => void;
}) {
  const alterar = onAlterar as Alterar;
  const todasVisiveis = camadas.every((c) => c.visivel);
  const todasTravadas = camadas.every((c) => c.travada);
  const tipos = [...new Set(camadas.map((c) => ROTULO_TIPO[c.tipo]))];

  return (
    <div className="flex flex-col">
      <Secao titulo={`${camadas.length} camadas`}>
        <p className="text-[11px] leading-relaxed text-white/35">{tipos.join(" · ")}</p>
        <Deslizante
          rotulo="Opacidade"
          valor={camadas[0].opacidade}
          min={0}
          max={1}
          passo={0.01}
          onMudar={(opacidade) => alterar({ opacidade })}
        />
        <Chave
          rotulo="Visíveis"
          ligada={todasVisiveis}
          onMudar={() => alterar({ visivel: !todasVisiveis })}
        />
        <Chave
          rotulo="Travadas"
          ligada={todasTravadas}
          onMudar={() => alterar({ travada: !todasTravadas })}
        />
      </Secao>

      <Secao titulo="Alinhar">
        <div className="grid grid-cols-3 gap-1.5">
          <BotaoMenor onClick={() => onAlinhar("esq")}>⇤ Esq.</BotaoMenor>
          <BotaoMenor onClick={() => onAlinhar("centroX")}>↔ Centro</BotaoMenor>
          <BotaoMenor onClick={() => onAlinhar("dir")}>⇥ Dir.</BotaoMenor>
          <BotaoMenor onClick={() => onAlinhar("topo")}>⇡ Topo</BotaoMenor>
          <BotaoMenor onClick={() => onAlinhar("centroY")}>↕ Meio</BotaoMenor>
          <BotaoMenor onClick={() => onAlinhar("base")}>⇣ Base</BotaoMenor>
        </div>
        {camadas.length >= 3 && (
          <div className="flex gap-2">
            <BotaoMenor onClick={() => onDistribuir("x")}>Distribuir ↔</BotaoMenor>
            <BotaoMenor onClick={() => onDistribuir("y")}>Distribuir ↕</BotaoMenor>
          </div>
        )}
      </Secao>

      <Secao titulo="Ordem e ações">
        <div className="flex gap-2">
          <BotaoMenor onClick={() => onOrdenar("fundo")}>⤓ Fundo</BotaoMenor>
          <BotaoMenor onClick={() => onOrdenar("topo")}>⤒ Frente</BotaoMenor>
        </div>
        <BotaoMenor onClick={onDuplicar}>⧉ Duplicar todas</BotaoMenor>
        <BotaoMenor onClick={onExcluir} risco>
          ✕ Excluir todas
        </BotaoMenor>
      </Secao>
    </div>
  );
}

function PainelAjustes({
  ajustes,
  alterar,
}: {
  ajustes: Ajustes;
  alterar: Alterar;
}) {
  const set = (m: Partial<Ajustes>) => alterar({ ajustes: { ...ajustes, ...m } });
  return (
    <Secao titulo="Ajustes de imagem" aberta={false}>
      <Deslizante rotulo="Brilho" valor={ajustes.brilho} min={-1} max={1} passo={0.02} onMudar={(brilho) => set({ brilho })} />
      <Deslizante rotulo="Contraste" valor={ajustes.contraste} min={-70} max={70} onMudar={(contraste) => set({ contraste })} />
      <Deslizante rotulo="Saturação" valor={ajustes.saturacao} min={-2} max={4} passo={0.1} onMudar={(saturacao) => set({ saturacao })} />
      <Deslizante rotulo="Desfoque" valor={ajustes.desfoque} min={0} max={60} onMudar={(desfoque) => set({ desfoque })} />
      <Chave rotulo="Preto e branco" ligada={ajustes.cinza} onMudar={(cinza) => set({ cinza })} />
    </Secao>
  );
}

/**
 * Como a imagem termina.
 *
 * Uma foto que acaba num retângulo duro nunca se compõe com o fundo — é o que
 * mais salta numa arte montada às pressas. Aqui dá para dissolver cada lado no
 * seu ritmo, apagar só os cantos, ou fechar tudo numa vinheta oval.
 */
function PainelBordas({ esmaecer, alterar }: { esmaecer: Esmaecimento; alterar: Alterar }) {
  const set = (m: Partial<Esmaecimento>) => alterar({ esmaecer: { ...esmaecer, ...m } });
  const [ligados, setLigados] = useState(
    esmaecer.topo === esmaecer.direita &&
      esmaecer.direita === esmaecer.base &&
      esmaecer.base === esmaecer.esquerda,
  );

  return (
    <Secao titulo="Bordas" aberta={esmaecer.ativo}>
      <Chave rotulo="Esmaecer as bordas" ligada={esmaecer.ativo} onMudar={(ativo) => set({ ativo })} />
      {esmaecer.ativo && (
        <>
          <Presets
            rotulo="Começar de"
            opcoes={[
              { nome: "Suave", valor: { modo: "lados", topo: 0.3, direita: 0.3, base: 0.3, esquerda: 0.3, cantos: 0, dureza: 0.5 } },
              { nome: "Só a base", valor: { modo: "lados", topo: 0, direita: 0, base: 0.45, esquerda: 0, cantos: 0, dureza: 0.4 } },
              { nome: "Cantos", valor: { modo: "lados", topo: 0.08, direita: 0.08, base: 0.08, esquerda: 0.08, cantos: 0.35, dureza: 0.5 } },
              { nome: "Vinheta", valor: { modo: "elipse", topo: 0.5, direita: 0.5, base: 0.5, esquerda: 0.5, cantos: 0, dureza: 0.6 } },
            ]}
            onAplicar={(v) => {
              const p = v as Partial<Esmaecimento>;
              setLigados(p.topo === p.base && p.base === p.esquerda);
              set(p);
            }}
          />
          <Botoes
            rotulo="Modo"
            valor={esmaecer.modo}
            opcoes={[
              { valor: "lados", rotulo: "Lados" },
              { valor: "elipse", rotulo: "Oval" },
            ]}
            onMudar={(modo) => set({ modo })}
          />
          {esmaecer.modo === "lados" ? (
            <>
              <Lados
                valores={esmaecer}
                ligados={ligados}
                onLigados={setLigados}
                onMudar={(m) => set(m)}
              />
              <Deslizante
                rotulo="Cantos"
                valor={esmaecer.cantos}
                min={0}
                max={1}
                passo={0.02}
                onMudar={(cantos) => set({ cantos })}
              />
            </>
          ) : (
            <Deslizante
              rotulo="Abertura"
              valor={esmaecer.topo}
              min={0.05}
              max={1}
              passo={0.02}
              onMudar={(v) => set({ topo: v, direita: v, base: v, esquerda: v })}
            />
          )}
          <Deslizante
            rotulo="Dureza"
            valor={esmaecer.dureza}
            min={0}
            max={1}
            passo={0.02}
            onMudar={(dureza) => set({ dureza })}
          />
        </>
      )}
    </Secao>
  );
}

function PainelSombra({
  titulo,
  sombra,
  alterar,
  campo = "sombra",
}: {
  titulo: string;
  sombra: Sombra;
  alterar: Alterar;
  campo?: string;
}) {
  const set = (m: Partial<Sombra>) => alterar({ [campo]: { ...sombra, ...m } });
  return (
    <Secao titulo={titulo} aberta={false}>
      <Chave rotulo="Ligada" ligada={sombra.ativa} onMudar={(ativa) => set({ ativa })} />
      {sombra.ativa && (
        <>
          <Cor rotulo="Cor" valor={sombra.cor} onMudar={(cor) => set({ cor })} />
          <div className="grid grid-cols-2 gap-2">
            <Numero rotulo="Desloca X" valor={sombra.x} onMudar={(x) => set({ x })} />
            <Numero rotulo="Desloca Y" valor={sombra.y} onMudar={(y) => set({ y })} />
          </div>
          <Deslizante rotulo="Desfoque" valor={sombra.desfoque} min={0} max={80} onMudar={(desfoque) => set({ desfoque })} />
        </>
      )}
    </Secao>
  );
}

/* ===== por tipo ===== */

function PainelFundo({ camada, alterar }: { camada: CamadaFundo; alterar: Alterar }) {
  return (
    <Secao titulo="Fundo">
      <Botoes
        rotulo="Modo"
        valor={camada.modo}
        opcoes={[
          { valor: "solida", rotulo: "Cor sólida" },
          { valor: "gradiente", rotulo: "Degradê" },
        ]}
        onMudar={(modo) => alterar({ modo })}
      />
      <Cor rotulo={camada.modo === "solida" ? "Cor" : "Cor de cima"} valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      {camada.modo === "gradiente" && (
        <>
          <Cor rotulo="Cor de baixo" valor={camada.cor2} onMudar={(cor2) => alterar({ cor2 })} />
          <Deslizante rotulo="Ângulo" valor={camada.angulo} min={0} max={360} sufixo="°" onMudar={(angulo) => alterar({ angulo })} />
        </>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {FUNDOS.map((f) => (
          <button
            key={f.nome}
            type="button"
            onClick={() => alterar({ modo: "gradiente", cor: f.cor, cor2: f.cor2, angulo: f.angulo })}
            style={{ background: `linear-gradient(${180 - f.angulo}deg, ${f.cor}, ${f.cor2})` }}
            className="h-8 flex-1 rounded border border-white/15 text-[10px] text-white/80 hover:border-[#FFCB05]"
          >
            {f.nome}
          </button>
        ))}
      </div>
    </Secao>
  );
}

function PainelSombreado({ camada, alterar }: { camada: CamadaSombreado; alterar: Alterar }) {
  const lateral = camada.direcao === "esquerda" || camada.direcao === "direita";
  const foco = camada.direcao === "foco";
  const setCentro = (m: Partial<CamadaSombreado["centro"]>) =>
    alterar({ centro: { ...camada.centro, ...m } });

  return (
    <Secao titulo="Sombreado">
      <Escolha
        rotulo="Direção"
        valor={camada.direcao}
        opcoes={[
          { valor: "base", rotulo: "Base pesada" },
          { valor: "topo", rotulo: "Topo suave" },
          { valor: "ambos", rotulo: "Topo e base" },
          { valor: "esquerda", rotulo: "Lateral esquerda" },
          { valor: "direita", rotulo: "Lateral direita" },
          { valor: "vinheta", rotulo: "Vinheta" },
          { valor: "foco", rotulo: "Holofote (clareia)" },
        ]}
        onMudar={(direcao) => alterar({ direcao })}
      />
      {lateral && (
        <p className="text-[11px] leading-snug text-white/35">
          Abre uma coluna escura de um lado — é o que dá leitura ao texto numa arte
          em paisagem, com a pessoa do outro lado.
        </p>
      )}
      {foco && (
        <p className="text-[11px] leading-snug text-white/35">
          Ao contrário das outras direções, esta <strong>soma</strong> luz. Ponha o
          centro atrás das pessoas para elas não ficarem boiando num fundo morto.
        </p>
      )}
      <Cor rotulo="Cor" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      <Deslizante rotulo="Força" valor={camada.forca} min={0} max={1} passo={0.02} onMudar={(forca) => alterar({ forca })} />
      <Deslizante
        rotulo={lateral ? "Largura" : foco ? "Alcance" : "Extensão"}
        valor={camada.extensao}
        min={0.05}
        max={1}
        passo={0.01}
        onMudar={(extensao) => alterar({ extensao })}
      />
      {foco && (
        <div className="grid grid-cols-2 gap-3">
          <Deslizante rotulo="Centro ↔" valor={camada.centro.x} min={0} max={1} passo={0.01} onMudar={(x) => setCentro({ x })} />
          <Deslizante rotulo="Centro ↕" valor={camada.centro.y} min={0} max={1} passo={0.01} onMudar={(y) => setCentro({ y })} />
        </div>
      )}
    </Secao>
  );
}

/**
 * O padrão geométrico do fundo.
 *
 * É a camada mais barata de todas em esforço e a que mais muda a arte: sem ela o
 * fundo é uma chapa de cor, e nenhuma quantidade de sombreado disfarça isso.
 */
function PainelPadrao({ camada, alterar }: { camada: CamadaPadrao; alterar: Alterar }) {
  return (
    <Secao titulo="Padrão">
      <Escolha
        rotulo="Forma"
        valor={camada.forma}
        opcoes={[
          { valor: "chevron", rotulo: "Chevron (o X)" },
          { valor: "raios", rotulo: "Raios" },
          { valor: "diagonais", rotulo: "Diagonais" },
          { valor: "grade", rotulo: "Grade" },
          { valor: "pontos", rotulo: "Pontos" },
        ]}
        onMudar={(forma) => alterar({ forma })}
      />
      <Cor rotulo="Cor" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      <Deslizante rotulo="Tamanho do motivo" valor={camada.escala} min={8} max={600} onMudar={(escala) => alterar({ escala })} />
      <Deslizante rotulo="Espessura" valor={camada.espessura} min={1} max={60} onMudar={(espessura) => alterar({ espessura })} />
      <Deslizante rotulo="Rotação" valor={camada.angulo} min={-180} max={180} sufixo="°" onMudar={(angulo) => alterar({ angulo })} />
      <Escolha rotulo="Mistura" valor={camada.mistura} opcoes={MISTURAS} onMudar={(mistura) => alterar({ mistura })} />
      <p className="text-[11px] leading-snug text-white/35">
        Em opacidade baixa (0,08 a 0,15) ele dá profundidade sem disputar com o
        título. Acima disso vira estampa.
      </p>
    </Secao>
  );
}

/** Grão, riscos e desgaste por cima de tudo — o acabamento final da arte. */
function PainelTextura({
  camada,
  alterar,
  onTrocarImagem,
}: {
  camada: CamadaTextura;
  alterar: Alterar;
  onTrocarImagem: () => void;
}) {
  const proprio = !!camada.ativoId;

  return (
    <Secao titulo="Textura">
      {!proprio && (
        <Escolha
          rotulo="Tipo"
          valor={camada.modo}
          opcoes={(Object.keys(ROTULO_TEXTURA) as CamadaTextura["modo"][]).map((k) => ({
            valor: k,
            rotulo: ROTULO_TEXTURA[k],
          }))}
          onMudar={(modo) => alterar({ modo })}
        />
      )}
      {!proprio && camada.modo !== "grao" && (
        <Cor rotulo="Cor" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      )}
      <Deslizante rotulo="Tamanho do desenho" valor={camada.escala} min={0.2} max={6} passo={0.1} onMudar={(escala) => alterar({ escala })} />
      {!proprio && (
        <Deslizante
          rotulo="Semente"
          valor={camada.semente}
          min={1}
          max={99}
          onMudar={(semente) => alterar({ semente })}
        />
      )}
      <Escolha rotulo="Mistura" valor={camada.mistura} opcoes={MISTURAS} onMudar={(mistura) => alterar({ mistura })} />
      <BotaoMenor onClick={onTrocarImagem}>
        {proprio ? "Trocar a imagem" : "Usar uma imagem minha"}
      </BotaoMenor>
      {proprio && (
        <BotaoMenor onClick={() => alterar({ ativoId: "" })}>Voltar à textura do estúdio</BotaoMenor>
      )}
      <p className="text-[11px] leading-snug text-white/35">
        {camada.modo === "grao" && !proprio
          ? "O grão vive de opacidade baixa (0,06 a 0,14) em Sobrepor. Cor não se aplica: ele soma e subtrai luz em torno do cinza."
          : "Ponha esta camada por último, à frente de tudo."}
      </p>
    </Secao>
  );
}

function PainelMoldura({ camada, alterar }: { camada: CamadaMoldura; alterar: Alterar }) {
  return (
    <Secao titulo="Moldura">
      <Cor rotulo="Cor" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      <Deslizante rotulo="Espessura" valor={camada.espessura} min={1} max={40} onMudar={(espessura) => alterar({ espessura })} />
      <Deslizante rotulo="Recuo" valor={camada.recuo} min={0} max={120} onMudar={(recuo) => alterar({ recuo })} />
      <Deslizante rotulo="Cantos" valor={camada.raio} min={0} max={80} onMudar={(raio) => alterar({ raio })} />
      <Deslizante rotulo="Chanfro" valor={camada.chanfro} min={0} max={200} onMudar={(chanfro) => alterar({ chanfro })} />
      {camada.chanfro > 0 && (
        <p className="text-[11px] leading-snug text-white/35">
          Com chanfro as quinas viram cortes de 45° e o arredondamento é ignorado —
          é o acabamento de placa, no lugar do canto de botão.
        </p>
      )}
      <Chave rotulo="Linha dupla" ligada={camada.dupla} onMudar={(dupla) => alterar({ dupla })} />
    </Secao>
  );
}

function PainelTexto({ camada, alterar }: { camada: CamadaTexto; alterar: Alterar }) {
  /* mede com as métricas reais para avisar quando as linhas vão se encostar —
     é o "Â" de MILITÂNCIA batendo na linha de cima */
  let apertado = 0;
  try {
    const m = medirTexto(camada);
    if (m.linhas.length > 1 && m.alturaMinima > m.alturaLinha) {
      apertado = Number((m.alturaMinima / m.tamanho).toFixed(2));
    }
  } catch {
    // medir depende do canvas: no primeiro render do servidor não existe
  }

  return (
    <>
      <Secao titulo="Texto">
        <AreaTexto
          rotulo="Conteúdo"
          valor={camada.texto}
          dica="*palavra* pinta na cor de destaque · ==palavra== põe sobre tarja · ^palavra^ sai pequena · :pin: e :building: viram ícone · | vira filete divisor · Enter quebra a linha"
          onMudar={(texto) => alterar({ texto })}
        />
        <Escolha
          rotulo="Fonte"
          valor={camada.fonte}
          opcoes={(Object.keys(FONTES) as ChaveFonte[]).map((k) => ({
            valor: k,
            rotulo: FONTES[k].rotulo,
          }))}
          onMudar={(fonte) => alterar({ fonte })}
        />
        <Deslizante rotulo="Corpo" valor={camada.tamanho} min={16} max={420} onMudar={(tamanho) => alterar({ tamanho })} />
        <Deslizante rotulo="Entrelinha" valor={camada.entrelinha} min={0.7} max={2} passo={0.02} onMudar={(entrelinha) => alterar({ entrelinha })} />
        {apertado > 0 && (
          <Aviso
            texto="As linhas estão se tocando — com acento em caixa alta o circunflexo encosta na linha de cima."
            acao={`Abrir p/ ${apertado}`}
            onAcao={() => alterar({ entrelinha: apertado })}
          />
        )}
        <Deslizante rotulo="Entre letras" valor={camada.espacamento} min={-8} max={30} onMudar={(espacamento) => alterar({ espacamento })} />
        <Botoes
          rotulo="Alinhamento"
          valor={camada.alinhamento}
          opcoes={[
            { valor: "left", rotulo: "Esq." },
            { valor: "center", rotulo: "Centro" },
            { valor: "right", rotulo: "Dir." },
          ]}
          onMudar={(alinhamento) => alterar({ alinhamento })}
        />
        <Chave rotulo="Caixa alta" ligada={camada.caixaAlta} onMudar={(caixaAlta) => alterar({ caixaAlta })} />
        <Chave rotulo="Encolher p/ caber" ligada={camada.autoAjuste} onMudar={(autoAjuste) => alterar({ autoAjuste })} />
      </Secao>

      <Secao titulo="Cores">
        <Cor rotulo="Cor base" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
        <Cor rotulo="Destaque *assim*" valor={camada.corDestaque} onMudar={(corDestaque) => alterar({ corDestaque })} />
        <Cor rotulo="Pequena ^assim^" valor={camada.menor.cor} onMudar={(cor) => alterar({ menor: { ...camada.menor, cor } })} />
        <Deslizante
          rotulo="Corpo do ^assim^"
          valor={camada.menor.escala}
          min={0.15}
          max={1}
          passo={0.01}
          onMudar={(escala) => alterar({ menor: { ...camada.menor, escala } })}
        />
        <Cor rotulo="Tarja ==assim==" valor={camada.corTarja} onMudar={(corTarja) => alterar({ corTarja })} />
        <Cor rotulo="Texto na tarja" valor={camada.corTextoTarja} onMudar={(corTextoTarja) => alterar({ corTextoTarja })} />
      </Secao>

      <PainelAcabamentoTexto camada={camada} alterar={alterar} />
      <PainelFundoTexto camada={camada} alterar={alterar} />
      <PainelTarja camada={camada} alterar={alterar} />

      <PainelSombra titulo="Sombra dura" sombra={camada.sombra} alterar={alterar} />

      <Secao titulo="Contorno" aberta={false}>
        <Chave
          rotulo="Ligado"
          ligada={camada.contorno.ativo}
          onMudar={(ativo) => alterar({ contorno: { ...camada.contorno, ativo } })}
        />
        {camada.contorno.ativo && (
          <>
            <Cor
              rotulo="Cor"
              valor={camada.contorno.cor}
              onMudar={(cor) => alterar({ contorno: { ...camada.contorno, cor } })}
            />
            <Deslizante
              rotulo="Espessura"
              valor={camada.contorno.espessura}
              min={1}
              max={30}
              onMudar={(espessura) => alterar({ contorno: { ...camada.contorno, espessura } })}
            />
          </>
        )}
      </Secao>
    </>
  );
}

/**
 * De que material o glifo é feito.
 *
 * Cor chapada é o que entrega uma arte feita no automático. Nas referências o
 * título vai de ouro claro a bronze, leva desgaste por cima e ainda tem um
 * brilho quente atrás — três ajustes que, juntos, valem mais que qualquer
 * mudança de fonte.
 */
function PainelAcabamentoTexto({ camada, alterar }: { camada: CamadaTexto; alterar: Alterar }) {
  const p = camada.preenchimento;
  const t = camada.textura;
  const b = camada.brilho;
  const ligado = p.modo === "gradiente" || t.ativa || b.ativo;

  const setP = (m: Partial<CamadaTexto["preenchimento"]>) =>
    alterar({ preenchimento: { ...p, ...m } });
  const setT = (m: Partial<CamadaTexto["textura"]>) => alterar({ textura: { ...t, ...m } });
  const setB = (m: Partial<CamadaTexto["brilho"]>) => alterar({ brilho: { ...b, ...m } });

  return (
    <Secao titulo="Acabamento do glifo" aberta={ligado}>
      <Presets
        rotulo="Começar de"
        opcoes={[
          {
            nome: "Metal gasto",
            valor: {
              preenchimento: { ...p, modo: "gradiente" as const, cor2: "#8A6A0B", angulo: 0 },
              textura: { ...t, ativa: true, forca: 0.3, escala: 0.6 },
              brilho: { ...b, ativo: true, forca: 0.35 },
            },
          },
          {
            nome: "Só gradiente",
            valor: {
              preenchimento: { ...p, modo: "gradiente" as const },
              textura: { ...t, ativa: false },
              brilho: { ...b, ativo: false },
            },
          },
          {
            nome: "Chapado",
            valor: {
              preenchimento: { ...p, modo: "solido" as const },
              textura: { ...t, ativa: false },
              brilho: { ...b, ativo: false },
            },
          },
        ]}
        onAplicar={(v) => alterar(v as Record<string, unknown>)}
      />

      <Botoes
        rotulo="Preenchimento"
        valor={p.modo}
        opcoes={[
          { valor: "solido", rotulo: "Cor chapada" },
          { valor: "gradiente", rotulo: "Gradiente" },
        ]}
        onMudar={(modo) => setP({ modo })}
      />
      {p.modo === "gradiente" && (
        <>
          <Cor rotulo="Cor do fim" valor={p.cor2} onMudar={(cor2) => setP({ cor2 })} />
          <Deslizante rotulo="Ângulo" valor={p.angulo} min={-180} max={180} sufixo="°" onMudar={(angulo) => setP({ angulo })} />
          <p className="text-[11px] leading-snug text-white/35">
            Vai da cor base à cor do fim, atravessando o bloco inteiro. As palavras
            marcadas com *, ^ e == mantêm a cor delas.
          </p>
        </>
      )}

      <Chave rotulo="Desgaste nas letras" ligada={t.ativa} onMudar={(ativa) => setT({ ativa })} />
      {t.ativa && (
        <>
          <Deslizante rotulo="Força" valor={t.forca} min={0} max={1} passo={0.02} onMudar={(forca) => setT({ forca })} />
          <Deslizante rotulo="Tamanho da mancha" valor={t.escala} min={0.2} max={4} passo={0.1} onMudar={(escala) => setT({ escala })} />
          <Deslizante rotulo="Semente" valor={t.semente} min={1} max={99} onMudar={(semente) => setT({ semente })} />
        </>
      )}

      <Chave rotulo="Brilho em volta" ligada={b.ativo} onMudar={(ativo) => setB({ ativo })} />
      {b.ativo && (
        <>
          <Cor rotulo="Cor do brilho" valor={b.cor} onMudar={(cor) => setB({ cor })} />
          <Deslizante rotulo="Desfoque" valor={b.desfoque} min={2} max={120} onMudar={(desfoque) => setB({ desfoque })} />
          <Deslizante rotulo="Força" valor={b.forca} min={0} max={1} passo={0.02} onMudar={(forca) => setB({ forca })} />
        </>
      )}
    </Secao>
  );
}

/**
 * A caixa atrás do texto inteiro.
 *
 * É o que faltava para pôr "SEXTA 18:30" em cima de uma foto e continuar legível
 * sem depender de a roupa da pessoa ser escura. Tudo na mão do artista: bloco ou
 * faixa por linha, respiro, cantos, chanfro, filete e inclinação.
 */
function PainelFundoTexto({ camada, alterar }: { camada: CamadaTexto; alterar: Alterar }) {
  const f = camada.fundo;
  const set = (m: Partial<CamadaTexto["fundo"]>) => alterar({ fundo: { ...f, ...m } });

  return (
    <Secao titulo="Tarja atrás do texto" aberta={f.ativo}>
      <Chave rotulo="Ligada" ligada={f.ativo} onMudar={(ativo) => set({ ativo })} />
      {f.ativo && (
        <>
          <Presets
            rotulo="Começar de"
            opcoes={[
              { nome: "Sólida", valor: { modo: "bloco", opacidade: 1, raio: 0, inclinacao: 0, larguraTotal: false } },
              { nome: "Véu", valor: { modo: "bloco", opacidade: 0.62, raio: 0, inclinacao: 0, larguraTotal: true } },
              { nome: "Faixa por linha", valor: { modo: "linha", opacidade: 1, raio: 0, inclinacao: 0, larguraTotal: false } },
              { nome: "Torta", valor: { modo: "linha", opacidade: 1, raio: 4, inclinacao: -2.5, larguraTotal: false } },
              {
                nome: "Placa",
                valor: {
                  modo: "bloco",
                  cor: "#0D0B07",
                  opacidade: 0.82,
                  raio: 0,
                  chanfro: 46,
                  inclinacao: 0,
                  larguraTotal: false,
                  borda: { ativa: true, cor: "#FFCB05", espessura: 3 },
                },
              },
            ]}
            onAplicar={(v) => set(v as Partial<CamadaTexto["fundo"]>)}
          />
          <Botoes
            rotulo="Formato"
            valor={f.modo}
            opcoes={[
              { valor: "bloco", rotulo: "Uma caixa" },
              { valor: "linha", rotulo: "Por linha" },
            ]}
            onMudar={(modo) => set({ modo })}
          />
          <Cor rotulo="Cor" valor={f.cor} onMudar={(cor) => set({ cor })} />
          <Deslizante rotulo="Opacidade" valor={f.opacidade} min={0} max={1} passo={0.02} onMudar={(opacidade) => set({ opacidade })} />
          <div className="grid grid-cols-2 gap-2">
            <Numero rotulo="Respiro ↔" valor={f.padX} onMudar={(padX) => set({ padX: Math.max(0, padX) })} />
            <Numero rotulo="Respiro ↕" valor={f.padY} onMudar={(padY) => set({ padY: Math.max(0, padY) })} />
          </div>
          <Deslizante rotulo="Cantos" valor={f.raio} min={0} max={120} onMudar={(raio) => set({ raio })} />
          <Deslizante rotulo="Chanfro" valor={f.chanfro} min={0} max={160} onMudar={(chanfro) => set({ chanfro })} />
          {f.chanfro > 0 && (
            <p className="text-[11px] leading-snug text-white/35">
              Quinas cortadas em 45° — vira placa. Com chanfro, o arredondamento é
              ignorado.
            </p>
          )}
          <Chave
            rotulo="Filete em volta"
            ligada={f.borda.ativa}
            onMudar={(ativa) => set({ borda: { ...f.borda, ativa } })}
          />
          {f.borda.ativa && (
            <>
              <Cor
                rotulo="Cor do filete"
                valor={f.borda.cor}
                onMudar={(cor) => set({ borda: { ...f.borda, cor } })}
              />
              <Deslizante
                rotulo="Espessura do filete"
                valor={f.borda.espessura}
                min={1}
                max={20}
                onMudar={(espessura) => set({ borda: { ...f.borda, espessura } })}
              />
            </>
          )}
          <Deslizante rotulo="Inclinação" valor={f.inclinacao} min={-15} max={15} passo={0.5} sufixo="°" onMudar={(inclinacao) => set({ inclinacao })} />
          <Chave
            rotulo="Ocupar a largura toda"
            ligada={f.larguraTotal}
            onMudar={(larguraTotal) => set({ larguraTotal })}
          />
        </>
      )}
    </Secao>
  );
}

/** Acabamento das tarjas por palavra — antes eram números fixos no código. */
function PainelTarja({ camada, alterar }: { camada: CamadaTexto; alterar: Alterar }) {
  const t = camada.tarja;
  const set = (m: Partial<CamadaTexto["tarja"]>) => alterar({ tarja: { ...t, ...m } });
  const usa = camada.texto.includes("==");

  return (
    <Secao titulo="Acabamento do ==assim==" aberta={false}>
      {!usa && (
        <p className="text-[11px] leading-snug text-white/35">
          Escreva <code className="text-[#FFCB05]">==uma palavra==</code> no conteúdo para
          ela sair sobre tarja. Estes ajustes valem para essas marcações.
        </p>
      )}
      <Botoes
        rotulo="Altura da banda"
        valor={t.ajuste}
        opcoes={[
          { valor: "metricas", rotulo: "Abraçar letras" },
          { valor: "fixo", rotulo: "Fixa" },
        ]}
        onMudar={(ajuste) => set({ ajuste })}
      />
      <Deslizante rotulo="Respiro ↔" valor={t.padX} min={0} max={0.6} passo={0.01} onMudar={(padX) => set({ padX })} />
      <Deslizante rotulo="Respiro ↕" valor={t.padY} min={0} max={0.6} passo={0.01} onMudar={(padY) => set({ padY })} />
      <Deslizante rotulo="Cantos" valor={t.raio} min={0} max={80} onMudar={(raio) => set({ raio })} />
      <Deslizante rotulo="Inclinação" valor={t.inclinacao} min={-15} max={15} passo={0.5} sufixo="°" onMudar={(inclinacao) => set({ inclinacao })} />
    </Secao>
  );
}

function PainelFoto({ camada, alterar }: { camada: CamadaFoto; alterar: Alterar }) {
  return (
    <>
      <Secao titulo="Mistura">
        <Escolha
          rotulo="Modo"
          valor={camada.mistura}
          opcoes={[
            { valor: "normal", rotulo: "Normal" },
            { valor: "multiply", rotulo: "Multiplicar" },
            { valor: "screen", rotulo: "Clarear" },
            { valor: "overlay", rotulo: "Sobrepor" },
            { valor: "soft-light", rotulo: "Luz suave" },
            { valor: "luminosity", rotulo: "Luminosidade" },
          ]}
          onMudar={(mistura) => alterar({ mistura })}
        />
      </Secao>
      <PainelAjustes ajustes={camada.ajustes} alterar={alterar} />
    </>
  );
}

function PainelAvatar({ camada, alterar }: { camada: CamadaAvatar; alterar: Alterar }) {
  return (
    <>
      <Secao titulo="Anel">
        <Chave
          rotulo="Ligado"
          ligada={camada.anel.ativo}
          onMudar={(ativo) => alterar({ anel: { ...camada.anel, ativo } })}
        />
        {camada.anel.ativo && (
          <>
            <Cor rotulo="Cor" valor={camada.anel.cor} onMudar={(cor) => alterar({ anel: { ...camada.anel, cor } })} />
            <Deslizante
              rotulo="Espessura"
              valor={camada.anel.espessura}
              min={1}
              max={30}
              onMudar={(espessura) => alterar({ anel: { ...camada.anel, espessura } })}
            />
          </>
        )}
      </Secao>
      <PainelSombra titulo="Sombra" sombra={camada.sombra} alterar={alterar} />
      <PainelAjustes ajustes={camada.ajustes} alterar={alterar} />
    </>
  );
}

function PainelPessoa({
  camada,
  alterar,
  onDuplicarFantasma,
}: {
  camada: CamadaPessoa;
  alterar: Alterar;
  onDuplicarFantasma: () => void;
}) {
  const setTinta = (m: Partial<CamadaPessoa["tinta"]>) =>
    alterar({ tinta: { ...camada.tinta, ...m } });
  const setHalo = (m: Partial<CamadaPessoa["halo"]>) =>
    alterar({ halo: { ...camada.halo, ...m } });
  const setGradiente = (m: Partial<CamadaPessoa["gradiente"]>) =>
    alterar({ gradiente: { ...camada.gradiente, ...m } });
  const setLuz = (m: Partial<CamadaPessoa["luzBorda"]>) =>
    alterar({ luzBorda: { ...camada.luzBorda, ...m } });
  const setContato = (m: Partial<CamadaPessoa["contato"]>) =>
    alterar({ contato: { ...camada.contato, ...m } });

  return (
    <>
      <Secao titulo="Silhueta">
        <Chave rotulo="Pintar de uma cor" ligada={camada.tinta.ativa} onMudar={(ativa) => setTinta({ ativa })} />
        {camada.tinta.ativa && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {TINTAS.map((t) => (
                <button
                  key={t.cor}
                  type="button"
                  title={t.nome}
                  aria-label={t.nome}
                  onClick={() => setTinta({ cor: t.cor })}
                  style={{ background: t.cor }}
                  className={`h-7 w-7 rounded-full border transition hover:scale-110 ${
                    camada.tinta.cor.toLowerCase() === t.cor.toLowerCase()
                      ? "border-[#FFCB05] ring-2 ring-[#FFCB05]/60"
                      : "border-white/25"
                  }`}
                />
              ))}
            </div>
            <Cor rotulo="Outra cor" valor={camada.tinta.cor} onMudar={(cor) => setTinta({ cor })} />
            <Deslizante
              rotulo="Força"
              valor={camada.tinta.forca}
              min={0}
              max={1}
              passo={0.02}
              onMudar={(forca) => setTinta({ forca })}
            />
          </>
        )}
        <BotaoMenor onClick={onDuplicarFantasma}>Duplicar como fantasma atrás</BotaoMenor>
      </Secao>

      <Secao titulo="Gradiente na base">
        <Chave
          rotulo="Ligado"
          ligada={camada.gradiente.ativo}
          onMudar={(ativo) => setGradiente({ ativo })}
        />
        {camada.gradiente.ativo && (
          <>
            <Botoes
              rotulo="Modo"
              valor={camada.gradiente.modo}
              opcoes={[
                { valor: "dissolver", rotulo: "Dissolver" },
                { valor: "pintar", rotulo: "Pintar" },
              ]}
              onMudar={(modo) => setGradiente({ modo })}
            />
            {camada.gradiente.modo === "pintar" && (
              <Cor
                rotulo="Cor da base"
                valor={camada.gradiente.cor}
                onMudar={(cor) => setGradiente({ cor })}
              />
            )}
            <Deslizante
              rotulo="Altura do gradiente"
              valor={camada.gradiente.extensao}
              min={0.05}
              max={1}
              passo={0.01}
              onMudar={(extensao) => setGradiente({ extensao })}
            />
            <Deslizante
              rotulo="Força"
              valor={camada.gradiente.forca}
              min={0}
              max={1}
              passo={0.02}
              onMudar={(forca) => setGradiente({ forca })}
            />
          </>
        )}
      </Secao>

      <Secao titulo="Halo de luz" aberta={false}>
        <Chave rotulo="Ligado" ligada={camada.halo.ativo} onMudar={(ativo) => setHalo({ ativo })} />
        {camada.halo.ativo && (
          <>
            <Cor rotulo="Cor" valor={camada.halo.cor} onMudar={(cor) => setHalo({ cor })} />
            <Deslizante rotulo="Tamanho" valor={camada.halo.tamanho} min={1} max={60} onMudar={(tamanho) => setHalo({ tamanho })} />
            <Deslizante rotulo="Desfoque" valor={camada.halo.desfoque} min={0} max={80} onMudar={(desfoque) => setHalo({ desfoque })} />
            <Deslizante rotulo="Força" valor={camada.halo.forca} min={0} max={1} passo={0.02} onMudar={(forca) => setHalo({ forca })} />
            <p className="text-[11px] leading-snug text-white/35">
              A engorda é medida no contorno, então sai igual em volta do corpo
              todo — cabeça e ombros ganham a mesma espessura.
            </p>
          </>
        )}
      </Secao>

      <Secao titulo="Luz de contorno" aberta={camada.luzBorda.ativa}>
        <Chave rotulo="Ligada" ligada={camada.luzBorda.ativa} onMudar={(ativa) => setLuz({ ativa })} />
        {camada.luzBorda.ativa && (
          <>
            <Cor rotulo="Cor" valor={camada.luzBorda.cor} onMudar={(cor) => setLuz({ cor })} />
            <Deslizante rotulo="De onde vem" valor={camada.luzBorda.angulo} min={0} max={360} sufixo="°" onMudar={(angulo) => setLuz({ angulo })} />
            <Deslizante rotulo="Espessura" valor={camada.luzBorda.espessura} min={1} max={40} onMudar={(espessura) => setLuz({ espessura })} />
            <Deslizante rotulo="Força" valor={camada.luzBorda.forca} min={0} max={1} passo={0.02} onMudar={(forca) => setLuz({ forca })} />
            <p className="text-[11px] leading-snug text-white/35">
              Acende só a borda virada para a luz. Aponte para o mesmo lado do
              holofote do fundo e o recorte deixa de parecer colado por cima.
            </p>
          </>
        )}
      </Secao>

      <Secao titulo="Sombra de contato" aberta={camada.contato.ativa}>
        <Chave rotulo="Ligada" ligada={camada.contato.ativa} onMudar={(ativa) => setContato({ ativa })} />
        {camada.contato.ativa && (
          <>
            <Cor rotulo="Cor" valor={camada.contato.cor} onMudar={(cor) => setContato({ cor })} />
            <Deslizante rotulo="Largura" valor={camada.contato.largura} min={0.2} max={2} passo={0.02} onMudar={(largura) => setContato({ largura })} />
            <Deslizante rotulo="Achatamento" valor={camada.contato.altura} min={0.04} max={0.6} passo={0.01} onMudar={(altura) => setContato({ altura })} />
            <Deslizante rotulo="Força" valor={camada.contato.forca} min={0} max={1} passo={0.02} onMudar={(forca) => setContato({ forca })} />
            <p className="text-[11px] leading-snug text-white/35">
              A mancha no chão, na base do recorte. Sem ela a pessoa flutua, por
              melhor que esteja o resto.
            </p>
          </>
        )}
      </Secao>

      <PainelSombra titulo="Sombra" sombra={camada.sombra} alterar={alterar} />
      <PainelAjustes ajustes={camada.ajustes} alterar={alterar} />
    </>
  );
}
