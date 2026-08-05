"use client";

/** Propriedades da camada selecionada — muda conforme o tipo. */
import { FONTES, FUNDOS, TINTAS } from "../paleta";
import type {
  Ajustes,
  Camada,
  CamadaAvatar,
  CamadaFoto,
  CamadaFundo,
  CamadaMoldura,
  CamadaPessoa,
  CamadaSombreado,
  CamadaTexto,
  ChaveFonte,
  Formato,
  Sombra,
} from "../tipos";
import { FORMATOS, temImagem } from "../tipos";
import {
  AreaTexto,
  Botoes,
  Chave,
  Cor,
  Deslizante,
  Escolha,
  Numero,
  Secao,
  Texto as CampoTexto,
} from "./Controles";

interface Props {
  camada: Camada | null;
  formato: Formato;
  onAlterar: (mudanca: Partial<Camada>) => void;
  onTrocarImagem: () => void;
  onDuplicarFantasma: () => void;
  onAjustarProporcao: () => void;
  onRemoverFundo: () => void;
}

export default function Inspetor({
  camada,
  formato,
  onAlterar,
  onTrocarImagem,
  onDuplicarFantasma,
  onAjustarProporcao,
  onRemoverFundo,
}: Props) {
  if (!camada) {
    return (
      <p className="px-4 py-8 text-center text-sm leading-relaxed text-white/35">
        Escolha uma camada no palco ou na lista à esquerda para editar.
      </p>
    );
  }

  const alterar = onAlterar as (m: Record<string, unknown>) => void;
  const { largura: L, altura: A } = FORMATOS[formato];

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
            </>
          )}
        </Secao>
      )}

      {camada.tipo === "fundo" && <PainelFundo camada={camada} alterar={alterar} />}
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md px-3 py-2 text-xs font-medium transition ${
        destaque
          ? "bg-[#FFCB05] text-[#14110C] hover:bg-[#ffd63a]"
          : "border border-white/12 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
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
  return (
    <Secao titulo="Sombreado">
      <Escolha
        rotulo="Direção"
        valor={camada.direcao}
        opcoes={[
          { valor: "base", rotulo: "Base pesada" },
          { valor: "topo", rotulo: "Topo suave" },
          { valor: "ambos", rotulo: "Topo e base" },
          { valor: "vinheta", rotulo: "Vinheta" },
        ]}
        onMudar={(direcao) => alterar({ direcao })}
      />
      <Cor rotulo="Cor" valor={camada.cor} onMudar={(cor) => alterar({ cor })} />
      <Deslizante rotulo="Força" valor={camada.forca} min={0} max={1} passo={0.02} onMudar={(forca) => alterar({ forca })} />
      <Deslizante rotulo="Extensão" valor={camada.extensao} min={0.05} max={1} passo={0.01} onMudar={(extensao) => alterar({ extensao })} />
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
      <Chave rotulo="Linha dupla" ligada={camada.dupla} onMudar={(dupla) => alterar({ dupla })} />
    </Secao>
  );
}

function PainelTexto({ camada, alterar }: { camada: CamadaTexto; alterar: Alterar }) {
  return (
    <>
      <Secao titulo="Texto">
        <AreaTexto
          rotulo="Conteúdo"
          valor={camada.texto}
          dica="*palavra* pinta na cor de destaque · ==palavra== põe sobre tarja · Enter quebra a linha"
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
        <Cor rotulo="Tarja ==assim==" valor={camada.corTarja} onMudar={(corTarja) => alterar({ corTarja })} />
        <Cor rotulo="Texto na tarja" valor={camada.corTextoTarja} onMudar={(corTextoTarja) => alterar({ corTextoTarja })} />
      </Secao>

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
        <Deslizante
          rotulo="Esmaecer bordas"
          valor={camada.esmaecer}
          min={0}
          max={1}
          passo={0.02}
          onMudar={(esmaecer) => alterar({ esmaecer })}
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
          </>
        )}
      </Secao>

      <PainelSombra titulo="Sombra" sombra={camada.sombra} alterar={alterar} />
      <PainelAjustes ajustes={camada.ajustes} alterar={alterar} />
    </>
  );
}
