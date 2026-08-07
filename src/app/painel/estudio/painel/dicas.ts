/**
 * O que cada controle do estúdio faz, em uma frase.
 *
 * A chave é o rótulo que aparece na tela: os primitivos do Controles.tsx
 * procuram aqui sozinhos, então um campo novo só precisa de uma linha neste
 * arquivo para ganhar explicação. Onde o mesmo rótulo significa coisas
 * diferentes em seções diferentes ("Força", "Cor", "Modo"), a frase fica no
 * próprio lugar de uso, via `dica=` — por isso esses rótulos genéricos não
 * aparecem aqui.
 *
 * As frases falam do efeito na arte, não do campo. "Aperta a transição" ajuda;
 * "define o valor da dureza" não ajuda ninguém.
 */
export const DICAS: Record<string, string> = {
  /* ===== títulos de seção =====
     São o melhor lugar para a explicação longa: quem para no cabeçalho está
     justamente perguntando "para que serve este bloco todo?". */
  Camada: "O que vale para a camada inteira, seja ela foto, texto ou enfeite.",
  "Posição e tamanho": "As medidas em pixels da arte. Dá para arrastar no palco, mas é aqui que se acerta no número.",
  Imagem: "A foto desta camada e o que dá para fazer com ela sem sair do estúdio.",
  Bordas: "Como a imagem termina. Uma foto que acaba num retângulo duro nunca se compõe com o fundo — é o que mais denuncia arte feita às pressas.",
  "Ajustes de imagem": "Brilho, contraste, cor e desfoque. Fotos de contexto costumam pedir menos brilho e menos cor, para não competir com quem está na frente.",
  Fundo: "A chapa que fica atrás de tudo. Cor sólida ou degradê.",
  Sombreado: "O escurecimento em degradê que dá leitura ao texto por cima da foto. Em toda arte existe, mesmo quando não se nota.",
  Padrão: "A geometria repetida no fundo — o X gigante das referências. É a camada mais barata em esforço e a que mais muda a arte.",
  Textura: "Grão, riscos e desgaste por cima da arte inteira. É o que separa uma arte que parece impressa de uma que parece exportada de um editor.",
  Moldura: "O filete em volta da arte, simples ou duplo.",
  Texto: "O conteúdo e a forma das letras. A marcação com *, == e ^ vale dentro do próprio texto.",
  Cores: "As cores do texto — a base e as das palavras marcadas.",
  Contorno: "Um filete em volta de cada letra. Sobre foto clara, é o que segura a leitura sem precisar de tarja.",
  "Acabamento do glifo": "O material das letras: gradiente por dentro, textura em cima ou comendo, e brilho em volta. Juntos valem mais que trocar de fonte.",
  "Tarja atrás do texto": "A caixa atrás do bloco inteiro. Diferente da tarja ==assim==, que marca palavras soltas.",
  "Acabamento do ==assim==": "A forma das tarjas que marcam palavras dentro da frase.",
  Mistura: "Como a camada se combina com o que está atrás. Multiplicar escurece, Clarear ilumina, Sobrepor faz as duas coisas conforme o tom.",
  Silhueta: "Pinta o recorte de uma cor só, preservando a transparência. Em força cheia a pessoa vira vulto.",
  "Dissolver a pessoa": "Faz o corpo se desfazer numa das bordas em vez de terminar num corte reto. Anda junto com o recorte, então vale por pessoa.",
  "Halo de luz": "Engorda a silhueta e pinta de uma cor só, atrás do recorte. É a luz que descola a pessoa do fundo.",
  "Luz de contorno": "Acende só a borda do corpo virada para a luz. É o que integra o recorte ao holofote em vez de deixá-lo colado por cima.",
  "Sombra de contato": "A mancha no chão sob a pessoa. Sem ela o recorte flutua.",
  Anel: "O aro em volta do retrato redondo.",
  Alinhar: "Encosta as camadas escolhidas na mesma borda ou no mesmo centro.",
  "Ordem e ações": "Quem fica na frente de quem, e o que fazer com a seleção inteira.",

  /* ===== camada ===== */
  Nome: "Só para você achar a camada na lista à esquerda. Não aparece na arte.",
  Opacidade: "Transparência da camada inteira. Em 0,15 a 0,25 uma cópia da pessoa vira fantasma atrás da principal.",
  "⤓ Para o fundo": "Manda a camada para trás de todas as outras.",
  "⤒ Para a frente": "Traz a camada para a frente de todas as outras. Também dá com ⇧ + ].",

  /* ===== posição e tamanho ===== */
  Rotação: "Gira a camada em torno do próprio centro. Pelo palco, é a alça de cima da seleção.",
  "Centralizar ↔": "Põe o centro da camada no meio da arte, na horizontal.",
  "Centralizar ↕": "Põe o centro da camada no meio da arte, na vertical.",

  /* ===== imagem ===== */
  Espelhar: "Vira a imagem da esquerda para a direita. Serve para a pessoa olhar para dentro da arte em vez de para fora.",
  "✂ Remover o fundo": "Abre o recorte automático: a pessoa fica e o resto vira transparência. Roda aqui no navegador mesmo.",
  "Ajustar à proporção original": "Corrige a altura pela proporção da foto, desfazendo qualquer esticada.",
  "Preencher o quadro": "Cresce a imagem até cobrir a arte inteira sem distorcer, e centraliza.",
  "Trocar imagem": "Abre a biblioteca deste navegador para escolher outra foto para esta camada.",
  "Escolher imagem": "Abre a biblioteca deste navegador. Sem imagem, a camada fica como espaço reservado.",

  /* ===== bordas / esmaecer ===== */
  "Esmaecer as bordas": "Dissolve as beiradas da imagem em vez de terminar num retângulo duro. É o que faz uma foto se compor com o fundo.",
  "A borda vira": "Transparência abre buraco e mostra o fundo; Uma cor leva a beirada até um tom, e aí ela some sem recortar forma nenhuma.",
  "Cor da borda": "O tom em que a beirada morre. Pondo o mesmo do fundo da arte, a foto desaparece sem deixar marca.",
  Cantos: "Apaga só as quinas, sem comer o meio dos lados. Arredonda a foto sem cantos redondos falsos.",
  Dureza: "Aperta a transição: perto de 0 ela se espalha bem macia, perto de 1 vira quase um corte seco.",
  Abertura: "Tamanho da área limpa no centro da oval. Quanto maior, mais imagem sobrevive.",
  Lados: "Cada beirada com o seu tanto. O cadeado fechado move as quatro juntas.",
  "Todos os lados": "Move as quatro beiradas ao mesmo tempo. Abra o cadeado para tratar uma por uma.",

  /* ===== dissolver a pessoa ===== */
  "Entra por": "De que borda do recorte o gradiente começa. Pela base é o corpo saindo do chão; pelo topo, a cabeça sumindo no escuro.",
  "Alcance do gradiente": "Quanto do recorte o efeito cobre, contado a partir da borda escolhida.",
  "Duplicar como fantasma atrás": "Cria uma cópia menor, clara e transparente atrás desta pessoa — o eco que aparece nas artes com dupla e trio.",

  /* ===== fundo ===== */
  "Cor de cima": "Onde o degradê começa. Ele atravessa a arte inteira até a cor de baixo.",
  "Cor de baixo": "Onde o degradê termina.",
  Ângulo: "Direção do degradê em graus. 0 é de cima para baixo.",

  /* ===== padrão geométrico ===== */
  Forma: "O desenho que se repete atrás de tudo. Em opacidade baixa ele dá profundidade sem competir com o título.",
  "Tamanho do motivo": "Distância entre as repetições. Maior deixa o desenho mais espaçado e calmo.",
  Espessura: "Grossura do traço do desenho.",

  /* ===== textura ===== */
  Tipo: "Grão de filme é chuvisco fino; Riscos são arranhões compridos; Desgaste são manchas comendo a superfície.",
  Semente: "Troca o sorteio do desenho sem mudar mais nada. Se a mancha caiu num lugar ruim, mexa aqui.",
  "Voltar à textura do estúdio": "Larga o PNG escolhido e volta ao desenho gerado por código.",

  /* ===== sombreado ===== */
  Direção: "De onde o escurecimento entra. É ele que dá leitura ao texto por cima da foto — em toda arte existe, mesmo sem se notar.",
  Extensão: "Que fatia da arte o degradê cobre.",
  Alcance: "Tamanho do clarão do holofote.",
  "Centro ↔": "Onde o holofote bate, na horizontal. Ponha atrás das pessoas.",
  "Centro ↕": "Onde o holofote bate, na vertical.",
  Largura: "Largura da coluna escura.",

  /* ===== moldura ===== */
  Recuo: "Distância da moldura até a borda da arte.",
  Dupla: "Acrescenta um segundo filete fino por dentro do primeiro — o acabamento de cordel.",
  Raio: "Arredonda as quinas.",
  Chanfro: "Corta as quinas em 45° em vez de arredondar. É o acabamento de placa.",

  /* ===== texto ===== */
  Fonte: "Anton, Bebas e Archivo são de título; Oswald e Bitter, de leitura; Alfa Slab e Playfair puxam para o cordel e a manchete; Special Elite e a Gótica são de época.",
  Entrelinha: "Distância entre as linhas, em múltiplos do corpo. Abaixo de 1 as linhas se aproximam.",
  Espaçamento: "Distância entre as letras. Um pouco de folga em caixa alta faz o chapéu respirar.",
  Alinhamento: "Onde as linhas se encostam dentro da caixa de texto.",
  "Caixa alta": "Escreve tudo em maiúscula sem mudar o que você digitou.",
  "Encolher p/ caber": "Diminui o corpo até a maior linha caber na largura da caixa, em vez de estourar para fora.",
  "Cor base": "A cor do texto comum — o que não estiver marcado com *, ^ ou ==.",
  "Destaque *assim*": "A cor das palavras entre asteriscos. É como o título alterna ouro e branco na mesma frase.",
  "Pequena ^assim^": "A cor do trecho entre acentos circunflexos, que sai em corpo menor dentro da mesma frase.",
  "Corpo do ^assim^": "O tamanho daquele trecho menor, em fração do corpo do texto.",
  "Fundo da ==tarja==": "A cor da faixa atrás das palavras marcadas com dois iguais.",
  "Texto da ==tarja==": "A cor das letras dentro da faixa.",

  /* ===== acabamento do glifo ===== */
  Preenchimento: "Cor chapada é o padrão; Gradiente atravessa o bloco inteiro, do ouro claro ao bronze — é o que tira a cara de automático.",
  "Cor do fim": "Onde o gradiente das letras termina. As palavras marcadas com *, ^ e == mantêm a cor delas.",
  "Textura nas letras": "Grão, riscos ou desgaste presos ao glifo. Fica dentro das letras: nada dela encosta na foto por baixo.",
  "Como aplicar": "Comer tira pedaços da letra, como tinta gasta. Cobrir põe o desenho por cima dela, na cor escolhida.",
  Desenho: "Qual textura entra nas letras: chuvisco fino, arranhões compridos ou manchas irregulares.",
  "Cor da textura": "A cor do que é posto por cima da letra. Não vale quando a textura está comendo o glifo.",
  "Tamanho da mancha": "Engrossa ou afina o desenho da textura sem trocá-lo.",
  "Brilho em volta": "Um clarão difuso atrás das letras. Diferente da sombra, que é dura e serve para descolar do fundo.",
  "Cor do brilho": "O tom do clarão. Em ouro, ele parece luz do próprio título.",

  /* ===== tarja atrás do texto ===== */
  Inclinação: "Deixa a placa levemente torta, como um carimbo colado à mão.",
  "Largura total": "A faixa ocupa a largura da caixa em vez de acompanhar cada linha.",
  "Respiro ↔": "Folga da placa para os lados do texto.",
  "Respiro ↕": "Folga da placa para cima e para baixo do texto.",

  /* ===== sombra ===== */
  "Desloca X": "Quanto a sombra anda para o lado. Sem desfoque, ela vira a sombra dura de cordel.",
  "Desloca Y": "Quanto a sombra anda para baixo.",
  Desfoque: "Espalha a sombra. Em 0 ela é uma cópia sólida deslocada.",

  /* ===== halo, luz e contato ===== */
  "Ângulo da luz": "De onde a luz vem, em graus. 0 é da direita, e cresce no sentido horário.",
  "Engorda do contorno": "Quantos pixels a silhueta cresce para fora antes de virar luz.",
  "Achatamento": "Quanto a elipse do chão é espremida. Quase zero para a pessoa parecer vista de frente.",
};
