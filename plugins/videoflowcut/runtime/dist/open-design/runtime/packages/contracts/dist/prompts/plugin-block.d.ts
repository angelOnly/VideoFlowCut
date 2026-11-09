/**
 * Pure renderer for the `## Active plugin` / `## Plugin inputs` / `## Plugin atoms`
 * blocks injected into `composeSystemPrompt()` (spec §11.8 PB1).
 *
 * Lives in contracts so the daemon and the contracts-side composer share
 * one definition; spec §11.8 byte-equality CI fixture is replaced by a
 * single-import compile-time guarantee. This file MUST stay free of
 * runtime dependencies — it only consumes `AppliedPluginSnapshot`.
 */
import type { AppliedPluginSnapshot } from '../plugins/apply.js';
export declare function renderPluginBlock(snapshot: AppliedPluginSnapshot): string;
//# sourceMappingURL=plugin-block.d.ts.map