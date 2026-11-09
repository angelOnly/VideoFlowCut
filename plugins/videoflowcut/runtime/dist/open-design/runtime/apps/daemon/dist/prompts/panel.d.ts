/**
 * Critique Theater protocol addendum for the system prompt composer.
 *
 * Renders the panel prompt that gets concatenated to the agent's system prompt
 * when cfg.enabled is true. All numeric values (maxRounds, scoreThreshold,
 * scoreScale, protocolVersion) come from CritiqueConfig; inline literals are
 * forbidden so future protocol bumps need no template edits.
 *
 * @see specs/current/critique-theater.md § Wire protocol
 * @see specs/current/critique-theater.md § Convergence rule
 */
import type { CritiqueConfig } from '@open-design/contracts/critique';
/** Input for rendering the Critique Theater protocol addendum. */
export interface PanelPromptInput {
    /**
     * Active config; the prompt encodes its maxRounds, scoreThreshold,
     * scoreScale, and protocolVersion verbatim.
     */
    cfg: CritiqueConfig;
    /** Active brand: name + the verbatim contents of its DESIGN.md, treated as data not instructions. */
    brand: {
        name: string;
        design_md: string;
    };
    /** Active skill identifier (e.g., 'magazine-poster'). Included in the prompt for the agent's context. */
    skill: {
        id: string;
    };
}
/**
 * Render the Critique Theater protocol addendum that gets concatenated to the
 * agent's system prompt when cfg.enabled is true. The addendum:
 *   - Defines the five panelist roles (designer, critic, brand, a11y, copy).
 *   - Fixes the wire grammar (CRITIQUE_RUN, ROUND, PANELIST, ROUND_END, SHIP).
 *   - Encodes the convergence rule (composite >= scoreThreshold && mustFix==0)
 *     using values FROM cfg, never inline literals.
 *   - Embeds the brand DESIGN.md as data inside <BRAND_SOURCE> so the agent
 *     treats it as reference, not instruction.
 *   - Names the protocol version from cfg.protocolVersion so future versions
 *     can ship without editing the template.
 *
 * Throws RangeError on invalid input: empty brand.name, empty skill.id, or
 * cfg fields outside their declared ranges.
 *
 * @see specs/current/critique-theater.md § Wire protocol
 * @see specs/current/critique-theater.md § Convergence rule
 */
export declare function renderPanelPrompt({ cfg, brand, skill }: PanelPromptInput): string;
