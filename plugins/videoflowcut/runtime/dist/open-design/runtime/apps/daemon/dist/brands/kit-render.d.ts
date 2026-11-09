import type { ProjectMetadata } from '@open-design/contracts';
import { brandKitCopy } from './kit-i18n.js';
/** The file the rendered kit is written to inside the extraction project. */
export declare const BRAND_KIT_FILE = "brand.html";
/** Token-engine fields the kit page surfaces as design-system chips. */
interface BrandKitTokenSubset {
    colorPrimary?: string;
    colorPrimaryBg?: string;
    colorPrimaryHover?: string;
    colorPrimaryActive?: string;
    fontSize?: number;
    borderRadius?: number;
}
interface BrandKitSystem {
    kitHref: string;
    kitDarkHref: string | null;
    themes: string[];
    tokens: BrandKitTokenSubset | null;
}
/** Read (and cache) the bundled brand-kit template from the skills root. */
export declare function loadBrandKitTemplate(skillsRoot: string): string;
export type BrandKitStatus = 'extracting' | 'ready' | 'draft' | 'failed';
export interface BrandKitPayload {
    status: BrandKitStatus;
    host: string;
    brand: Record<string, unknown>;
    assets: Array<{
        kind: string;
        label: string;
        desc: string;
        href: string;
        available: boolean;
    }>;
    system: BrandKitSystem | null;
    brandMd: {
        href: string;
    } | null;
    locale?: string;
    copy?: ReturnType<typeof brandKitCopy>;
}
/** Embed the payload (and optional self-hosted @font-face CSS) into the
 *  template, neutralizing any `</script>` in the JSON so the inline data block
 *  cannot break out of its own tag. */
export declare function renderBrandKitHtml(template: string, payload: BrandKitPayload, fontFace?: string): string;
export interface WriteBrandKitOptions {
    skillsRoot: string;
    projectsRoot: string;
    projectId: string;
    brand: Record<string, unknown>;
    status: BrandKitStatus;
    /** Fallback host label before brand.sourceUrl is known. */
    host?: string;
    metadata?: ProjectMetadata;
    locale?: string | null | undefined;
}
/**
 * Render `brand.html` from the given (partial) brand and write it into the
 * extraction project. Asset tiles light up automatically once the matching
 * `system/artifacts/<kind>.html` exists in the project (i.e. after finalize).
 * Best-effort: returns false (without throwing) when the template or project
 * dir cannot be resolved, so seeding/preview never blocks the main flow.
 */
export declare function writeBrandKitPreview(opts: WriteBrandKitOptions): Promise<boolean>;
export {};
