/**
 * Build a fully-formed product webpage that demonstrates a design system in
 * action — not just a list of tokens, but a real-feeling marketing /
 * product page (nav, hero, social proof, feature grid, dashboard preview,
 * pricing, testimonials, FAQ, CTA, footer) styled entirely from the
 * tokens we extract from the system's DESIGN.md.
 *
 * Same parsing utilities as preview.js — kept inline rather
 * than imported so the two views can evolve independently.
 */
type ColorToken = {
    name: string;
    value: string;
    role: string;
};
export declare function renderDesignSystemShowcase(id: string, raw: string): string;
export declare function extractColors(raw: string): ColorToken[];
export {};
