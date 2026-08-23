"use client";
import React from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/icons";
import type { CampoTexto, Funcao, GrupoFuncao } from "./tipos";
import { CartaoFuncao, Campo, CampoCidade, ROTULOS } from "./Campos";
import { WHATSAPP_COORDENACAO, TELEFONE_COORDENACAO } from "@/lib/contato";

/**
 * OS TRÊS PASSOS de `/queroajudar`, um componente cada.
 *
 * O fluxo (`InscricaoClient`) guarda o estado e decide o que acontece; estes
 * três só desenham o que o passo pergunta. A divisão é a mesma que a pessoa vê
 * na barra de progresso — "Como ajudar", "Seus dados", "Confirmar" —, e é essa
 * a divisão que importa: quando alguém reclama de um passo, é este arquivo, e
 * só ele, que se abre.
 *
 * Todos recebem o que precisam por props explícitas, e nenhum guarda estado
 * próprio: um passo que lembrasse de alguma coisa por conta própria esqueceria
 * na hora de voltar, que é exatamente o que o rascunho do fluxo evita.
 */

/** Passo 1 — onde você quer ajudar. Não avança em branco; "Onde precisar" é a saída. */
export const PassoFuncoes: React.FC<{
  porGrupo: Map<GrupoFuncao, Funcao[]>;
  grupos: Record<GrupoFuncao, { nome: string; resumo: string }>;
  ordem: GrupoFuncao[];
  marcadas: string[];
  aberta: string | null;
  aoAlternar: (id: string) => void;
  aoAbrir: (id: string | null) => void;
  foco: React.RefObject<HTMLDivElement | null>;
}> = ({ porGrupo, grupos, ordem, marcadas, aberta, aoAlternar, aoAbrir, foco }) => (
  <div
    ref={foco}
    tabIndex={-1}
    className="in-grupos"
  >
    <p className="in-ajuda">
      Não precisa ter experiência — o movimento ensina quem chega. Toque
      em <strong>ver detalhes</strong> pra saber o que cada função faz.
    </p>
    {ordem.map((g) => {
      const lista = porGrupo.get(g) ?? [];
      if (lista.length === 0) return null;
      const info = grupos[g];
      return (
        <fieldset key={g} className="in-grupo">
          <legend className="in-grupo-nome">{info.nome}</legend>
          <p className="in-grupo-resumo">{info.resumo}</p>
          <div className="in-cartoes">
            {lista.map((f) => (
              <CartaoFuncao
                key={f.id}
                funcao={f}
                marcada={marcadas.includes(f.id)}
                aberta={aberta === f.id}
                aoMarcar={() => aoAlternar(f.id)}
                aoAbrir={() => aoAbrir(aberta === f.id ? null : f.id)}
              />
            ))}
          </div>
        </fieldset>
      );
    })}
  </div>
);

/** Passo 2 — os quatro campos obrigatórios, mais o e-mail opcional. */
export const PassoDados: React.FC<{
  campos: Record<CampoTexto, string>;
  erros: Partial<Record<CampoTexto, string>>;
  tocado: Partial<Record<CampoTexto, boolean>>;
  aoMudar: (campo: CampoTexto, valor: string) => void;
  aoSair: (campo: CampoTexto) => void;
  refs: React.RefObject<Partial<Record<CampoTexto, HTMLElement | null>>>;
}> = ({ campos, erros, tocado, aoMudar, aoSair, refs }) => (
  <div className="in-campos">
    <p className="in-ajuda">
      O <strong>WhatsApp</strong> é o mais importante: é por ele que a
      coordenação manda seu acesso.
    </p>

    <Campo
      campo="nome" valor={campos.nome} erro={tocado.nome ? erros.nome : ""}
      dica="Como você é chamado no documento."
      autoComplete="name" inputMode="text"
      aoMudar={aoMudar} aoSair={aoSair} refs={refs}
    />
    <Campo
      campo="telefone" valor={campos.telefone} erro={tocado.telefone ? erros.telefone : ""}
      dica="Com DDD. Exemplo: (85) 91234-5678"
      tipo="tel" autoComplete="tel-national" inputMode="numeric"
      aoMudar={aoMudar} aoSair={aoSair} refs={refs}
    />
    <div className="in-linha-dupla">
      <CampoCidade
        valor={campos.cidade} erro={tocado.cidade ? erros.cidade : ""}
        aoMudar={aoMudar} aoSair={aoSair} refs={refs}
      />
      <Campo
        campo="bairro" valor={campos.bairro} erro={tocado.bairro ? erros.bairro : ""}
        autoComplete="address-level3" inputMode="text"
        aoMudar={aoMudar} aoSair={aoSair} refs={refs}
      />
    </div>
    <Campo
      campo="email" valor={campos.email} erro={tocado.email ? erros.email : ""}
      dica="Opcional — só como segunda forma de contato."
      opcional tipo="email" autoComplete="email" inputMode="email"
      aoMudar={aoMudar} aoSair={aoSair} refs={refs}
    />
  </div>
);

/** Passo 3 — a conferência e o consentimento de LGPD. */
export const PassoConfirmar: React.FC<{
  campos: Record<CampoTexto, string>;
  escolhidas: Funcao[];
  consentimento: boolean;
  aoConsentir: (v: boolean) => void;
  aoVoltarPara: (passo: number) => void;
  refConsentimento: React.RefObject<HTMLInputElement | null>;
}> = ({ campos, escolhidas, consentimento, aoConsentir, aoVoltarPara, refConsentimento }) => (
  <div className="in-confirma">
    <div className="in-resumo">
      <h3 className="in-resumo-titulo">Você escolheu ajudar em</h3>
      <ul className="in-resumo-funcoes">
        {escolhidas.map((f) => (
          <li key={f.id}>
            <Icon name={f.icone as IconName} size={18} />
            <span>{f.nome}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="in-editar" onClick={() => aoVoltarPara(1)}>
        Mudar as funções
      </button>
    </div>

    <div className="in-resumo">
      <h3 className="in-resumo-titulo">Seus dados</h3>
      <dl className="in-resumo-dados">
        {(["nome", "telefone", "cidade", "bairro", "email"] as CampoTexto[])
          .filter((c) => campos[c].trim() !== "")
          .map((c) => (
            <div key={c}>
              <dt>{ROTULOS[c]}</dt>
              <dd>{campos[c]}</dd>
            </div>
          ))}
      </dl>
      <button type="button" className="in-editar" onClick={() => aoVoltarPara(2)}>
        Corrigir meus dados
      </button>
    </div>

    {/* ===== LGPD ===== */}
    <section className="in-lgpd" aria-labelledby="in-lgpd-titulo">
      <h3 id="in-lgpd-titulo" className="in-resumo-titulo">
        <Icon name="book" size={18} />
        Uso dos seus dados
      </h3>
      <ul className="in-lgpd-lista">
        <li>
          <strong>O que a gente guarda:</strong> seu nome, WhatsApp, cidade,
          bairro, e-mail (se você preencheu) e as funções que você escolheu.
        </li>
        <li>
          <strong>Pra quê:</strong> falar com você sobre a militância, te
          mandar seu acesso e organizar os times por região e função.
        </li>
        <li>
          <strong>Quem vê:</strong> só a coordenação da Missão Ceará.
          Seus dados <strong>não são vendidos nem compartilhados</strong> com
          ninguém de fora.
        </li>
        <li>
          <strong>Você manda neles:</strong> pode pedir pra ver, corrigir ou
          apagar tudo, e pode desistir quando quiser — é só falar no{" "}
          <a href={WHATSAPP_COORDENACAO} target="_blank" rel="noopener noreferrer">
            WhatsApp {TELEFONE_COORDENACAO}
          </a>
          .
        </li>
      </ul>
      <p className="in-lgpd-link">
        Detalhes completos na{" "}
        <Link href="/privacy" target="_blank">Política de Privacidade</Link>.
      </p>

      <label className="in-consentimento" htmlFor="in-consentimento">
        <input
          ref={refConsentimento}
          id="in-consentimento"
          type="checkbox"
          checked={consentimento}
          onChange={(e) => aoConsentir(e.target.checked)}
        />
        <span>
          Li e concordo que a Missão Ceará use meus dados para falar comigo
          sobre a militância, como está explicado acima.
        </span>
      </label>
    </section>
  </div>
);
