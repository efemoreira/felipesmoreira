/**
 * Os canais de contato — fonte única.
 *
 * Antes, o mesmo `wa.me` com `?text=EQUIPE` estava literal em sete arquivos,
 * apesar do comentário da home prometer que bastava trocar uma constante. Era
 * mentira, e a prova é que o link mudou e sete lugares tiveram que mudar junto.
 *
 * **São dois grupos, e a linha divisória é a conta, não a intenção.** O site
 * público inteiro conhece só o grupo geral. O grupo de trabalho existe atrás do
 * login, no hub do painel — quem se inscreveu e ainda espera aprovação não
 * recebe o link, senão o grupo de trabalho enche de gente que a coordenação
 * ainda não conferiu e vira grupo de recados.
 *
 * **O grupo de trabalho NÃO mora aqui.** Ele vive só em
 * `public/painel/sessao.php`, e de propósito: este arquivo entra no bundle do
 * site público, e tudo que entra no bundle é público. Declará-lo aqui — mesmo
 * sem ninguém importar — colocaria o convite do grupo interno num JavaScript
 * que qualquer pessoa baixa.
 *
 * A regra é verificável: procurar o convite do grupo de trabalho dentro de
 * `src/` tem de não achar nada. O único lugar dele é o `sessao.php`.
 */

/**
 * Quem só quer acompanhar. É o único grupo que o site público divulga.
 *
 * O `?mode=gi_t` é parâmetro do próprio WhatsApp: o link fica exatamente como
 * veio do convite — reescrever é apostar que ele continua valendo.
 */
export const GRUPO_GERAL = "https://chat.whatsapp.com/LUVbUSlmogqBZ8EKDHusS0?mode=gi_t";

/**
 * O contato oficial, e o único: não há e-mail em lugar nenhum do site.
 *
 * É por aqui que a Política de Privacidade promete responder a pedido de
 * acesso, correção ou exclusão de dado — a LGPD exige um canal, não exige que
 * ele seja e-mail. Página legal sem canal nenhum é que não pode existir.
 */
export const WHATSAPP_COORDENACAO = "https://wa.me/5585981872972";

/** O mesmo número, do jeito que se lê em voz alta. */
export const TELEFONE_COORDENACAO = "(85) 98187-2972";

/** Formato do schema.org — E.164 com espaços, como o Google documenta. */
export const TELEFONE_E164 = "+55 85 98187-2972";
