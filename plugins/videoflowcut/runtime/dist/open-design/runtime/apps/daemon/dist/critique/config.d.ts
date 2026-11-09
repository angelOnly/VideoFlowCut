import type { CritiqueConfig } from '@open-design/contracts/critique';
/**
 * Load CritiqueConfig from process.env. Keys map 1:1 to OD_CRITIQUE_*.
 * Missing values fall back to defaultCritiqueConfig(). Invalid values
 * (non-numeric, negative, out-of-range) throw RangeError so misconfig
 * surfaces at boot, never silently.
 *
 * @see specs/current/critique-theater.md § Configuration (env vars)
 */
export declare function loadCritiqueConfigFromEnv(env?: NodeJS.ProcessEnv): CritiqueConfig;
