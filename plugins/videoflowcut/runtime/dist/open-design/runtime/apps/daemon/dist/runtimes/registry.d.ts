import type { RuntimeAgentDef } from './types.js';
/**
 * The agents this build ships, before anything a particular machine adds.
 *
 * `AGENT_DEFS` below appends whatever local profiles the user has declared, so
 * it answers "what can this machine run" — a different question from "what do
 * we ship", and the wrong list for anything that must hold everywhere. A local
 * profile id is required not to collide with one of these (see
 * `createLocalAgentDef`), so it is always an id we have never heard of.
 */
export declare const SHIPPED_AGENT_DEFS: RuntimeAgentDef[];
export declare function readLocalAgentProfileDefs(baseDefs?: RuntimeAgentDef[]): RuntimeAgentDef[];
export declare const AGENT_DEFS: RuntimeAgentDef[];
export declare function getAgentDef(id: string): RuntimeAgentDef | null;
