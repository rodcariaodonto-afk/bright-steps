/**
 * Motor de personalização por interesse dominante.
 * Toda história/jogo/mensagem consulta este módulo antes de renderizar,
 * para que nenhuma criança receba exatamente o mesmo aplicativo.
 */

export type InterestTheme =
  | "dinosaurs"
  | "space"
  | "princesses"
  | "cars"
  | "animals"
  | "superheroes"
  | "ocean"
  | "music"
  | "sports"
  | "art"
  | "neutral";

export interface PersonalizationBundle {
  theme: InterestTheme;
  narrator: string;
  paletteHint: string; // dica para gerar ilustração
  rewardIcon: string;
  greeting: string;
}

const BUNDLES: Record<InterestTheme, PersonalizationBundle> = {
  dinosaurs: {
    theme: "dinosaurs",
    narrator: "Rex, o pequeno T-Rex explorador",
    paletteHint: "verde-jurássico, âmbar, terracota, folhagem viva",
    rewardIcon: "🦕",
    greeting: "Rugido! Pronto para uma nova aventura?",
  },
  space: {
    theme: "space",
    narrator: "Nova, a astronauta curiosa",
    paletteHint: "azul-cosmos, violeta profundo, estrelas prateadas",
    rewardIcon: "🚀",
    greeting: "Prepare os propulsores, decolagem em 3, 2, 1!",
  },
  princesses: {
    theme: "princesses",
    narrator: "Aurora, a princesa aventureira",
    paletteHint: "rosa suave, dourado, lavanda, brilho",
    rewardIcon: "👑",
    greeting: "Bem-vinda ao castelo! Que aventura vamos viver hoje?",
  },
  cars: {
    theme: "cars",
    narrator: "Turbo, o carrinho de corrida",
    paletteHint: "vermelho, preto, amarelo-sinalização, asfalto",
    rewardIcon: "🏎️",
    greeting: "Motores ligados! Bora acelerar juntos?",
  },
  animals: {
    theme: "animals",
    narrator: "Mila, a raposinha guia",
    paletteHint: "verde-floresta, mel, laranja-outono",
    rewardIcon: "🦊",
    greeting: "A floresta está te chamando! Vamos?",
  },
  superheroes: {
    theme: "superheroes",
    narrator: "Capitão Coragem",
    paletteHint: "azul-royal, vermelho vibrante, dourado",
    rewardIcon: "🦸",
    greeting: "Sua capa te espera, herói! Missão de hoje?",
  },
  ocean: {
    theme: "ocean",
    narrator: "Coral, a golfinha exploradora",
    paletteHint: "turquesa, azul-marinho, coral, areia",
    rewardIcon: "🐬",
    greeting: "Mergulhe comigo! Vamos descobrir o fundo do mar.",
  },
  music: {
    theme: "music",
    narrator: "Melô, o passarinho compositor",
    paletteHint: "roxo-violeta, rosa neon, tons de partitura",
    rewardIcon: "🎵",
    greeting: "Qual música vai embalar nosso dia?",
  },
  sports: {
    theme: "sports",
    narrator: "Fê, a treinadora animada",
    paletteHint: "verde-campo, laranja-sol, branco",
    rewardIcon: "⚽",
    greeting: "Aquecendo! Bora treinar juntos?",
  },
  art: {
    theme: "art",
    narrator: "Íris, a artista das cores",
    paletteHint: "arco-íris pastel, papel kraft, tinta",
    rewardIcon: "🎨",
    greeting: "A tela está em branco. O que vamos criar hoje?",
  },
  neutral: {
    theme: "neutral",
    narrator: "Azul",
    paletteHint: "verde-sálvia acolhedor, coral suave, off-white",
    rewardIcon: "⭐",
    greeting: "Olá! Que bom te ver por aqui.",
  },
};

const KEY = "atlas.child.interest.";

export function getInterestBundle(theme?: InterestTheme | null): PersonalizationBundle {
  return BUNDLES[theme ?? "neutral"];
}

export function setChildInterest(childId: string, theme: InterestTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${KEY}${childId}`, theme);
}

export function getChildInterest(childId: string): InterestTheme {
  if (typeof window === "undefined") return "neutral";
  const stored = window.localStorage.getItem(`${KEY}${childId}`) as InterestTheme | null;
  return stored && stored in BUNDLES ? stored : "neutral";
}

export const AVAILABLE_INTERESTS: InterestTheme[] = [
  "dinosaurs",
  "space",
  "princesses",
  "cars",
  "animals",
  "superheroes",
  "ocean",
  "music",
  "sports",
  "art",
];
