export interface ResolveCraftRequirementsInput {
    isWebCloneRun?: boolean;
    metadataKind?: string | null;
    skillModes?: Iterable<string>;
    freeformDeckSignal?: boolean;
    skillRequires?: readonly string[];
    designSystemApplies?: readonly string[];
    designSystemExemptions?: readonly string[];
}
/**
 * Resolve the craft sections for one run.
 *
 * Deck typography is a runtime invariant, not only a skill opt-in: official
 * deck plugins keep `project.skill_id` empty and freeform deck prompts can do
 * the same. Without this fallback those paths miss the CJK leading rules in
 * craft/typography.md and can render multi-line Chinese headings at Latin
 * poster leading.
 */
export declare function resolveCraftRequirements({ isWebCloneRun, metadataKind, skillModes, freeformDeckSignal, skillRequires, designSystemApplies, designSystemExemptions, }: ResolveCraftRequirementsInput): string[];
/**
 * @param {string} craftDir absolute path to the craft/ directory
 * @param {string[]} requested slugs from `od.craft.requires`
 * @returns {Promise<{ body: string, sections: string[] }>}
 *   body is the concatenated markdown (each file preceded by a level-3
 *   section header). sections lists which slugs actually resolved.
 */
export declare function loadCraftSections(craftDir: string, requested: unknown[]): Promise<{
    body: string;
    sections: string[];
}>;
