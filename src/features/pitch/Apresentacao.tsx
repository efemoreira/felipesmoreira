import type { CSSProperties, ReactNode } from "react";
import { WHATSAPP_COORDENACAO } from "@/lib/contato";
import { C, FONT_DADOS, PAINEL_DADOS } from "@/lib/theme";
import estilos from "./Apresentacao.module.css";
import { GradeDoDia, PrecoExplicado } from "./Desenhos";
import { NavegacaoPitch } from "./NavegacaoPitch";
import type { Item, Pitch, Slide, Tela } from "./tipos";

/**
 * O PITCH DE UM PROJETO PESSOAL: slides de tela cheia, um embaixo do outro,
 * encaixados no scroll — o mesmo formato da apresentação do Guardião Predial.
 *
 * Fica fora da moldura do site (sem `PaginaDoSite`) e fora da busca: é apoio
 * de fala, mandado por link. A cor é a do produto (`pitch.marca`); a superfície
 * é a neutra de `PAINEL_DADOS`.
 */
export function Apresentacao({ pitch }: { pitch: Pitch }) {
  const { marca } = pitch;
  const variaveis = {
    "--marca": marca.primaria,
    "--marca-escuro": marca.escuro,
    "--acento": marca.acento,
    "--tinta-acento": marca.tintaAcento,
    "--fundo": PAINEL_DADOS.fundo,
    "--superficie": PAINEL_DADOS.superficie,
    "--linha": PAINEL_DADOS.linha,
    "--tinta": PAINEL_DADOS.tinta,
    "--tinta-suave": PAINEL_DADOS.tintaSuave,
    "--dor": C.erroTinta,
    "--fonte": FONT_DADOS,
  } as CSSProperties;

  return (
    <main className={estilos.palco} style={variaveis}>
      {pitch.slides.map((slide, i) => (
        <SlideDoPitch key={i} slide={slide} nome={pitch.nome} />
      ))}
      <NavegacaoPitch />
    </main>
  );
}

function SlideDoPitch({ slide, nome }: { slide: Slide; nome: string }) {
  switch (slide.tipo) {
    case "capa":
      return (
        <Quadro escuro>
          <div className={estilos.capaMarca}>
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem já otimizada */}
            {slide.logo ? <img src={slide.logo} alt={nome} /> : <><span className={estilos.capaPonto} aria-hidden />{nome}</>}
          </div>
          <p className={estilos.selo}>{slide.selo}</p>
          <h1 className={estilos.capaTitulo}>{slide.titulo}</h1>
          <p className={estilos.capaSubtitulo}>{slide.subtitulo}</p>
          <p className={estilos.assinatura}>Um projeto de Felipe Moreira</p>
        </Quadro>
      );

    case "cartoes":
      return (
        <Quadro {...slide}>
          <div className={classes(estilos.grade, slide.itens.length === 4 ? estilos.duas : estilos.tres, slide.dor && estilos.dor)}>
            {slide.itens.map((item) => <Cartao key={item.titulo} item={item} />)}
          </div>
        </Quadro>
      );

    case "painel":
      return (
        <Quadro {...slide}>
          <div className={estilos.painel}>
            <Captura tela={slide.principal} />
            <div className={estilos.painelLado}>
              {slide.lado.map((t) => <Captura key={t.src} tela={t} />)}
            </div>
          </div>
        </Quadro>
      );

    case "celulares":
      return (
        <Quadro {...slide}>
          <div className={estilos.celulares}>
            {slide.telas.map((t) => (
              <figure key={t.src} className={estilos.celular}>
                <div className={estilos.celularMoldura}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem já otimizada */}
                  <img src={t.src} alt={t.legenda} width={600} height={1304} loading="lazy" />
                </div>
                <figcaption>{t.legenda}</figcaption>
              </figure>
            ))}
          </div>
        </Quadro>
      );

    case "ilustracao":
      return (
        <Quadro {...slide}>
          <div className={estilos.ilustracao}>
            <div>
              {slide.desenho === "grade-do-dia" ? <GradeDoDia /> : <PrecoExplicado />}
              <p className={estilos.aviso}>Ilustração com dados de exemplo</p>
            </div>
            <div className={classes(estilos.grade, estilos.duas)}>
              {slide.itens.map((item) => <Cartao key={item.titulo} item={item} />)}
            </div>
          </div>
        </Quadro>
      );

    case "planos":
      return (
        <Quadro {...slide}>
          <div className={classes(estilos.grade, slide.planos.length === 4 ? estilos.quatro : slide.planos.length === 3 ? estilos.tres : estilos.duas)}>
            {slide.planos.map((p) => (
              <div key={p.nome} className={classes(estilos.cartao, estilos.plano, p.recomendado && estilos.recomendado)}>
                <div className={estilos.planoTopo}>
                  <h3 className={estilos.cartaoTitulo} style={{ margin: 0 }}>{p.nome}</h3>
                  {p.recomendado && <span className={estilos.etiqueta}>Recomendado</span>}
                </div>
                <p className={estilos.preco}>{p.preco}</p>
                {p.unidade && <p className={estilos.unidade}>{p.unidade}</p>}
                <p className={estilos.cartaoTexto}>{p.resumo}</p>
                <ul className={estilos.lista}>
                  {p.itens.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
          {slide.nota && <p className={estilos.nota}>{slide.nota}</p>}
        </Quadro>
      );

    case "comparacao":
      return (
        <Quadro {...slide}>
          <div className={estilos.comparacao}>
            <div className={estilos.tabela}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{slide.colunas[0]}</th>
                    <th scope="col">{slide.colunas[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {slide.linhas.map(([a, b]) => (
                    <tr key={a}>
                      <th scope="row">{a}</th>
                      <td>{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {slide.nota && <p className={estilos.tabelaNota}>{slide.nota}</p>}
            </div>
            {slide.posicao && <p className={estilos.posicao}>{slide.posicao}</p>}
          </div>
        </Quadro>
      );

    case "numeros":
      return (
        <Quadro {...slide}>
          <div className={classes(estilos.grade, estilos.quatro)}>
            {slide.itens.map((n) => (
              <div key={n.rotulo} className={estilos.cartao}>
                <p className={estilos.valor}>{n.valor}</p>
                <p className={estilos.rotulo}>{n.rotulo}</p>
              </div>
            ))}
          </div>
        </Quadro>
      );

    case "etapas":
      return (
        <Quadro {...slide}>
          <div className={classes(estilos.grade, estilos.tres)}>
            {slide.itens.map((e) => (
              <div key={e.etapa} className={classes(estilos.cartao, e.pronto && estilos.pronto)}>
                <p className={estilos.etapa}>
                  {e.etapa}
                  <span className={estilos.estado}>{e.pronto ? "Pronto" : "Próximo"}</span>
                </p>
                <h3 className={estilos.cartaoTitulo}>{e.titulo}</h3>
                <p className={estilos.cartaoTexto}>{e.texto}</p>
              </div>
            ))}
          </div>
        </Quadro>
      );

    case "pedido":
      return (
        <Quadro {...slide} escuro>
          <div className={classes(estilos.grade, estilos.tres)}>
            {slide.itens.map((item) => <Cartao key={item.titulo} item={item} />)}
          </div>
          <div className={estilos.acoes}>
            <a className={estilos.botao} href={WHATSAPP_COORDENACAO} target="_blank" rel="noopener noreferrer">
              Falar com o Felipe no WhatsApp
            </a>
          </div>
        </Quadro>
      );
  }
}

/** Uma seção de tela cheia: selo, título, subtítulo e o conteúdo. */
function Quadro({ selo, titulo, subtitulo, escuro, children }: { selo?: string; titulo?: string; subtitulo?: string; escuro?: boolean; children: ReactNode }) {
  return (
    <section data-slide className={classes(estilos.slide, escuro && estilos.escuro)}>
      <div className={estilos.miolo}>
        {titulo ? (
          <>
            {selo && <p className={estilos.selo}>{selo}</p>}
            <h2 className={estilos.titulo}>{titulo}</h2>
            {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
            <div className={estilos.corpo}>{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Cartao({ item }: { item: Item }) {
  return (
    <div className={estilos.cartao}>
      <h3 className={estilos.cartaoTitulo}>{item.titulo}</h3>
      <p className={estilos.cartaoTexto}>{item.texto}</p>
    </div>
  );
}

function Captura({ tela }: { tela: Tela }) {
  return (
    <figure className={estilos.tela}>
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático, imagem já otimizada */}
      <img src={tela.src} alt={tela.legenda} width={1600} height={1000} loading="lazy" />
      <figcaption>{tela.legenda}</figcaption>
    </figure>
  );
}

const classes = (...nomes: (string | false | undefined)[]) => nomes.filter(Boolean).join(" ");
