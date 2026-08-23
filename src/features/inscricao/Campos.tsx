"use client";
import React from "react";
import { Icon, IconName } from "@/components/icons";
import type { CampoTexto, Funcao } from "./tipos";
import { MUNICIPIOS_CE, FORA_DO_CEARA } from "@/lib/municipios";

/**
 * Os controles do formulário de `/queroajudar`, longe do fluxo que os usa.
 *
 * Os três são peças de interface sem nenhuma regra de inscrição dentro: o
 * cartão de função, o campo de texto com erro e dica, e o campo de cidade com
 * as suas 184 opções. Ficavam no mesmo arquivo do fluxo de três passos, que é
 * onde mora a regra — e é a regra que se lê quando alguma coisa está errada,
 * não o desenho de um `<input>`.
 */

/** O rótulo visível de cada campo — usado no campo e na revisão do passo 3. */
export const ROTULOS: Record<CampoTexto, string> = {
  nome: "Nome completo",
  telefone: "WhatsApp",
  email: "E-mail",
  cidade: "Cidade",
  bairro: "Bairro",
};

export const CartaoFuncao: React.FC<{
  funcao: Funcao;
  marcada: boolean;
  aberta: boolean;
  aoMarcar: () => void;
  aoAbrir: () => void;
}> = ({ funcao, marcada, aberta, aoMarcar, aoAbrir }) => {
  const idDetalhe = `detalhe-${funcao.id}`;
  return (
    <div className={`in-cartao${marcada ? " marcado" : ""}`}>
      <label className="in-cartao-topo" htmlFor={`f-${funcao.id}`}>
        <input
          id={`f-${funcao.id}`}
          type="checkbox"
          checked={marcada}
          onChange={aoMarcar}
        />
        <span className="in-cartao-icone" aria-hidden="true">
          <Icon name={funcao.icone as IconName} size={22} />
        </span>
        <span className="in-cartao-texto">
          <span className="in-cartao-nome">{funcao.nome}</span>
          <span className="in-cartao-resumo">{funcao.resumo}</span>
        </span>
      </label>

      <p className="in-cartao-ritmo">
        <Icon name="clock" size={14} />
        <span>{funcao.ritmo}</span>
      </p>

      <button
        type="button"
        className="in-cartao-mais"
        onClick={aoAbrir}
        aria-expanded={aberta}
        aria-controls={idDetalhe}
      >
        {aberta ? "Esconder detalhes" : "Ver detalhes"}
      </button>

      {aberta && (
        <div className="in-cartao-detalhe" id={idDetalhe}>
          <p className="in-detalhe-entrega">
            <strong>O que você entrega:</strong> {funcao.entrega}
          </p>
          <p className="in-detalhe-rotulo">No dia a dia:</p>
          <ul>
            {funcao.detalhe.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Campo: React.FC<{
  campo: CampoTexto;
  valor: string;
  erro?: string;
  dica?: string;
  opcional?: boolean;
  tipo?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "email";
  aoMudar: (c: CampoTexto, v: string) => void;
  aoSair: (c: CampoTexto) => void;
  refs: React.MutableRefObject<Partial<Record<CampoTexto, HTMLElement | null>>>;
}> = ({ campo, valor, erro, dica, opcional, tipo = "text", autoComplete, inputMode, aoMudar, aoSair, refs }) => {
  const idErro = `erro-${campo}`;
  const idDica = `dica-${campo}`;
  const descrito = [erro ? idErro : null, dica ? idDica : null].filter(Boolean).join(" ");
  return (
    <div className="in-campo">
      <label htmlFor={campo}>
        {ROTULOS[campo]}
        {opcional && <span className="in-opcional">opcional</span>}
      </label>
      <input
        id={campo}
        ref={(el) => {
          refs.current[campo] = el;
        }}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito || undefined}
        className={erro ? "com-erro" : undefined}
        onChange={(e) => aoMudar(campo, e.target.value)}
        onBlur={() => aoSair(campo)}
      />
      {dica && !erro && (
        <p className="in-dica" id={idDica}>{dica}</p>
      )}
      {erro && (
        <p className="in-erro" id={idErro}>{erro}</p>
      )}
    </div>
  );
};

/**
 * A cidade é escolha, não digitação.
 *
 * São 184 municípios no Ceará — uma lista fechada, que o `<select>` nativo
 * resolve sem uma linha de JavaScript e que no celular abre a roleta do próprio
 * aparelho, com busca por letra. Digitar produzia "Juazeiro do Norte",
 * "juazeiro" e "JUAZEIRO" na mesma coluna do relatório.
 *
 * **A primeira opção é para quem não é do Ceará.** Sem ela, quem está de
 * passagem — ou mora em outro estado e acompanha de longe — não teria o que
 * escolher e inventaria a cidade mais parecida, que é pior do que "de fora".
 *
 * Ele não usa o `Campo` acima porque `Campo` guarda um `ref` de `<input>` para
 * o foco do primeiro erro; o `<select>` registra o dele por conta própria, no
 * mesmo mapa, para o "leve-me ao erro" continuar funcionando.
 */
export const CampoCidade: React.FC<{
  valor: string;
  erro?: string;
  aoMudar: (c: CampoTexto, v: string) => void;
  aoSair: (c: CampoTexto) => void;
  refs: React.MutableRefObject<Partial<Record<CampoTexto, HTMLElement | null>>>;
}> = ({ valor, erro, aoMudar, aoSair, refs }) => {
  const idErro = "erro-cidade";
  return (
    <div className="in-campo">
      <label htmlFor="cidade">{ROTULOS.cidade}</label>
      <select
        id="cidade"
        ref={(el) => {
          refs.current.cidade = el;
        }}
        value={valor}
        autoComplete="address-level2"
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={erro ? "com-erro" : undefined}
        onChange={(e) => aoMudar("cidade", e.target.value)}
        onBlur={() => aoSair("cidade")}
      >
        <option value="">Escolha sua cidade</option>
        <option value={FORA_DO_CEARA}>{FORA_DO_CEARA} — estou de fora</option>
        <optgroup label="Ceará">
          {MUNICIPIOS_CE.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </optgroup>
      </select>
      {erro && (
        <p className="in-erro" id={idErro}>{erro}</p>
      )}
    </div>
  );
};
