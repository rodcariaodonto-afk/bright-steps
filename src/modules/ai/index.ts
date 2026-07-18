/**
 * Client-safe exports do módulo AI.
 * Componentes importam DAQUI — nunca de `./gateway` (server-only).
 */
export { PERSONAS, PERSONA_IDS, getPersona, type PersonaId, type PersonaConfig } from "./personas";
export {
  AVAILABLE_INTERESTS,
  getInterestBundle,
  getChildInterest,
  setChildInterest,
  type InterestTheme,
  type PersonalizationBundle,
} from "./personalization/interest-engine";
export {
  decideNextChallenge,
  type AdaptiveSignals,
  type AdaptiveDecision,
} from "./adaptive/difficulty-engine";
export {
  loadSnapshot,
  saveSnapshot,
  clearSnapshot,
  type ChatSnapshot,
} from "./memory/short-term";
