/**
 * Build a showcase HTML page from a DESIGN.md so the user can see what each
 * design system looks like *before* generating anything. We don't try to
 * render a unique product mockup — we extract the palette, typography, and
 * a couple of component conventions, then drop them into one fixed
 * template. The full DESIGN.md is rendered below as prose for reference.
 *
 * Parsing is deliberately permissive: imported systems vary in section
 * naming and bullet style, so we use loose regexes and fall back to sane
 * defaults when a token isn't found.
 */
export declare function renderDesignSystemPreview(id: string, raw: string): string;
