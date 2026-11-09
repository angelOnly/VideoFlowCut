import type { BrandDetailResponse, BrandFinalizeResponse, BrandMeta, BrandSummary, ProjectMetadata } from '@open-design/contracts';
import { createUserDesignSystem, deleteUserDesignSystem } from '../design-systems/index.js';
import { insertProject } from '../db.js';
import { type PrefetchResult } from './prefetch.js';
import { type BrandKitStatus } from './kit-render.js';
import { type LogoFallbackFn } from './logo-fallback.js';
import { type ImageryFallbackFn } from './imagery-fallback.js';
import { type SeedFallbackFn } from './seed-fallback.js';
export type { ColorCandidate, FontCandidate, LogoCandidate, PrefetchResult, } from './prefetch.js';
export { brandFromMaterial } from './provisional.js';
export { brandToDesignMd, brandGuideMd } from './design-md.js';
export { extractJsonBlock, validateBrand } from './validate.js';
export interface StartBrandExtractionOptions {
    /** Website/source URL. Optional when a pasted DESIGN.md is provided. */
    url?: string;
    /** Short human context; the fast path uses it as intro + voice. */
    description?: string;
    /** Pasted DESIGN.md content to parse locally before AI enrichment. */
    designMd?: string;
    brandsRoot: string;
    projectsRoot: string;
    /** Skills root so the seeded `brand.html` can be rendered from the bundled
     *  brand-extract template. */
    skillsRoot: string;
    db: Parameters<typeof insertProject>[0];
    randomId?: () => string;
    /** Override the deterministic logo harvester (tests inject a no-op / stub to
     *  avoid real network calls). Defaults to the live icon-fetching fallback. */
    logoFallback?: LogoFallbackFn;
    /** Override the deterministic palette/typography seed harvester (tests inject
     *  a no-op to avoid real network calls). Defaults to the live CSS harvester
     *  so the first paint already shows a real palette + fonts. */
    seedFallback?: SeedFallbackFn;
    /** Override the deterministic imagery harvester (tests inject a no-op to avoid
     *  real network calls). Defaults to the live cover/hero-image fallback so the
     *  first paint already shows representative images. */
    imageryFallback?: ImageryFallbackFn;
    /** `<dataDir>/design-systems` — registry root. Required to run the
     *  programmatic-first extraction (which registers a `user:<id>` design system
     *  in the background). When omitted, no programmatic finalize runs and the
     *  brand stays `extracting` for the agent to drive (the legacy behavior tests
     *  use). */
    userDesignSystemsRoot?: string;
    /** Workspace-aware creator supplied by the HTTP composition root. */
    createUserDesignSystem?: typeof createUserDesignSystem;
    /** Matching rollback for a workspace-aware draft creator. */
    deleteUserDesignSystem?: typeof deleteUserDesignSystem;
    /** Final synchronous creation fence; throws to roll back the whole startup. */
    bindCreatedProject?: (projectId: string) => void;
    /** Workspace to claim the extracted design system for (#145). Design systems
     *  share one directory, so the claim is what keeps a brand extracted in one
     *  workspace out of the next workspace's library. Omitted (signed out /
     *  single-player) leaves it unclaimed and visible everywhere. */
    designSystemWorkspaceId?: string | null;
    /** Runtime data dir so the programmatically-built design system is sedimented
     *  into memory. Optional. */
    dataDir?: string;
    /** Abort signal owned by the HTTP route Stop control for the programmatic
     *  first pass. Agent-driven finalize paths do not use it. */
    programmaticAbortSignal?: AbortSignal;
    /** Override the deterministic site harvester used by the programmatic-first
     *  extraction (tests inject a stub to stay offline). Defaults to the live
     *  network prefetch. */
    prefetch?: PrefetchFn;
    /** Deprecated no-op retained for older tests/callers. Brand starts now always
     *  return immediately after the project, transcript, and skeleton page are
     *  persisted; programmatic finalize settles in the background. */
    programmaticSyncBudgetMs?: number;
    /** Test/observability hook invoked with the background programmatic-extraction
     *  promise, so callers (tests) can await completion deterministically. */
    onBackgroundExtraction?: (settled: Promise<unknown>) => void;
    /** UI locale used to render static brand.html copy. */
    locale?: string;
    /** Agent identity to show on the programmatic transcript. No tokens are spent,
     *  but the synthetic turn should align with the user's selected code agent. */
    transcriptAgent?: {
        agentId?: string | null;
        agentName?: string | null;
    };
}
export interface StartBrandExtractionResult {
    id: string;
    projectId: string;
    conversationId: string;
    sourceUrl: string;
    status: BrandMeta['status'];
    designSystemId?: string;
    brandName?: string;
}
export interface ContinueBrandExtractionOptions {
    id: string;
    brandsRoot: string;
    projectsRoot: string;
    skillsRoot: string;
    db: Parameters<typeof insertProject>[0];
    userDesignSystemsRoot: string;
    dataDir?: string;
    randomId?: () => string;
    logoFallback?: LogoFallbackFn;
    imageryFallback?: ImageryFallbackFn;
    prefetch?: PrefetchFn;
    programmaticAbortSignal?: AbortSignal;
    onBackgroundExtraction?: (settled: Promise<unknown>) => void;
    locale?: string;
    transcriptAgent?: StartBrandExtractionOptions['transcriptAgent'];
}
/**
 * Reserve a brand and stand up the agent-driven extraction project. Throws on
 * an invalid URL (the route maps that to a 400). The caller navigates into the
 * returned project and auto-sends the seeded prompt to start the agent.
 */
export declare function startBrandExtraction(opts: StartBrandExtractionOptions): Promise<StartBrandExtractionResult>;
export declare function continueBrandExtraction(opts: ContinueBrandExtractionOptions): Promise<StartBrandExtractionResult>;
export declare function backfillBrandExtractionTranscriptForProject(input: {
    db: Parameters<typeof insertProject>[0];
    conversationId: string;
    randomId: () => string;
    brandsRoot: string;
    projectsRoot: string;
    project: {
        id: string;
        createdAt?: number | null;
        metadata?: ProjectMetadata | null;
    };
    transcriptAgent?: StartBrandExtractionOptions['transcriptAgent'];
}): Promise<void>;
/** The terminal outcomes the synthetic programmatic-extraction row settles into.
 *  `succeeded` overwrites any earlier card (a slow site that eventually lands);
 *  the others never clobber a recorded success. */
export type ProgrammaticExtractionOutcome = 'succeeded' | 'needs_attention' | 'stopped';
/**
 * Flip the seeded programmatic-extraction transcript row to a terminal run
 * status. This is the SINGLE authority that retires the synthetic
 * "AMR · Working 13m…" row, driven entirely by persisted brand meta + the
 * message itself, so it works from EVERY completion point — finalize success,
 * give-up / blocked / stall, and user stop — and survives a daemon restart.
 * Best-effort and idempotent; safe to call repeatedly.
 *
 * The bug this fixes: the row used to be reconciled only by a single racy timer
 * gated on re-reading `status === 'ready'`. A heavy site that finalized AFTER
 * the timer fired left the row "running" forever ("succeeded but never
 * terminated"); a blocked/failed origin left it "running" forever too ("stuck
 * running"). Anchoring the reconcile to the real terminal points removes the
 * race entirely.
 */
export declare function reconcileProgrammaticExtractionTranscript(input: {
    db: Parameters<typeof insertProject>[0];
    brandsRoot: string;
    projectsRoot: string;
    brandId: string;
    outcome: ProgrammaticExtractionOutcome;
    locale?: string;
}): Promise<void>;
export declare function isProgrammaticExtractionAbortError(err: unknown): boolean;
export interface FinalizeBrandOptions {
    id: string;
    brandsRoot: string;
    userDesignSystemsRoot: string;
    /** Workspace to claim a newly registered design system for (#145). A
     *  re-finalize reuses the draft, whose claim is already preserved, so this
     *  only matters on the agent-driven path that registers without a draft. */
    designSystemWorkspaceId?: string | null;
    projectsRoot: string;
    /** Skills root so the final `brand.html` re-render can read the template. */
    skillsRoot: string;
    db: Parameters<typeof insertProject>[0];
    /** Runtime data dir (`<dataDir>/memory` lives under it). When provided, the
     *  finalized brand is sedimented into the memory store so future chats can
     *  ground vague requests in the brand's palette, type, voice and rules.
     *  Omitted in unit tests that only exercise design-system registration. */
    dataDir?: string;
    /** Overrides the brand's recorded backing project. */
    projectId?: string;
    randomId?: () => string;
    /** Override the deterministic logo harvester (tests inject a no-op / stub to
     *  avoid real network calls). Defaults to the live icon-fetching fallback. */
    logoFallback?: LogoFallbackFn;
    /** Override the deterministic imagery harvester (tests inject a no-op / stub
     *  to avoid real network calls). Defaults to the live cover/hero-image
     *  fallback that runs when the agent captured too few `imagery.samples`. */
    imageryFallback?: ImageryFallbackFn;
    /** Optional override; defaults to the locale stored in brand meta. */
    locale?: string;
}
/**
 * Finalize an agent-extracted brand: read `brand.json` (+ optional BRAND.md,
 * logos, fonts) the agent wrote into the backing project, validate it, derive
 * the deterministic brand-system artifacts, and register the `user:<id>`
 * design system. Marks the brand `ready`. Throws with a precise message when
 * the agent output is missing or invalid.
 */
export declare function finalizeBrand(opts: FinalizeBrandOptions): Promise<BrandFinalizeResponse>;
/** Deterministic harvester that downloads a site's brand material into the
 *  brand workspace. Injectable so tests run offline. The optional signal lets a
 *  user Stop tear down in-flight fetches instead of waiting out their timeouts. */
export type PrefetchFn = (url: string, brandDir: string, opts?: {
    signal?: AbortSignal;
}) => Promise<PrefetchResult | null>;
export interface RunProgrammaticExtractionOptions {
    id: string;
    meta: BrandMeta;
    projectId: string;
    brandsRoot: string;
    userDesignSystemsRoot: string;
    projectsRoot: string;
    skillsRoot: string;
    db: Parameters<typeof insertProject>[0];
    dataDir?: string;
    description?: string;
    designMd?: string;
    hasWebsiteSource?: boolean;
    /** Deterministic material harvester; defaults to the live network prefetch. */
    prefetch?: PrefetchFn;
    logoFallback?: LogoFallbackFn;
    imageryFallback?: ImageryFallbackFn;
    locale?: string;
    abortSignal?: AbortSignal;
    extractionAttemptId?: string;
}
/**
 * Programmatic-first extraction: harvest the site deterministically (logo,
 * palette, typography, copy, cover imagery, source URL), synthesize a valid
 * design system with `brandFromMaterial` (NO LLM), and finalize it immediately
 * so the user lands on a usable, applyable design system within seconds — the
 * "aha". The async AI enrichment pass then refines it to full fidelity and
 * re-finalizes in place (reusing the same `user:<id>` design system).
 *
 * Best-effort: a blocked, too-thin, or unreachable origin yields `null` and
 * the brand stays `extracting`, so the AI pass can take over.
 */
export declare function runProgrammaticExtraction(opts: RunProgrammaticExtractionOptions): Promise<BrandFinalizeResponse | null>;
export interface ExtractBrandFromHtmlOptions extends Omit<RunProgrammaticExtractionOptions, 'prefetch' | 'designMd' | 'projectId'> {
    /** Backing project to sync the finalized system into; defaults to the brand's
     *  recorded project. */
    projectId?: string;
    /** Rendered DOM (`document.documentElement.outerHTML`) the web read out of the
     *  in-app browser tab after the user cleared an anti-bot wall. */
    html: string;
    /** Stylesheet text + computed-style harvest collected from the rendered page. */
    css?: string;
    /** Page URL used as the asset base; defaults to the brand's `sourceUrl`. */
    baseUrl?: string;
}
/**
 * Whether a harvest of already-rendered browser DOM produced essentially
 * nothing a brand can be synthesized from. Used only by the post-wall
 * `extract-from-html` path, where the page is real (the user cleared the wall),
 * so this is intentionally far more permissive than `PrefetchResult.thin`:
 *
 *  - A sparse palette (`< 3` non-extreme colors) is NOT disqualifying on its
 *    own. Minimalist brands (black/white/red) and transient computed-style
 *    reads routinely land few chromatic colors yet still describe a real site.
 *  - Missing headings/description is NOT disqualifying on its own either.
 *
 * We bail only when the harvest is `blocked` (the serialized DOM still looked
 * like the bare anti-bot wall, e.g. read too early) or when both real page copy
 * AND a real palette are absent (a blank/"still loading" placeholder read). A
 * harvested logo is deliberately NOT counted as a usable signal here: the
 * favicon-service fallback returns an icon for essentially any hostname, so it
 * would wrongly rescue an empty/placeholder page.
 */
export declare function browserHarvestIsUnusable(material: PrefetchResult): boolean;
/**
 * Re-run programmatic extraction against HTML the web already rendered (the
 * in-app browser tab the user unblocked), instead of fetching. Same
 * harvest → synthesize → finalize pipeline as `runProgrammaticExtraction`, but
 * fed the post-wall DOM via `prefetchFromHtml` (no network fetch, no Chrome).
 * On success the brand is finalized `ready` and its `user:<id>` design system
 * registered (reusing the existing id — never duplicated). Returns null when the
 * provided page is still too thin to synthesize a system.
 */
export declare function extractBrandFromHtml(opts: ExtractBrandFromHtmlOptions): Promise<BrandFinalizeResponse | null>;
export interface RenderBrandPreviewOptions {
    id: string;
    brandsRoot: string;
    skillsRoot: string;
    projectsRoot: string;
    /** Overrides the brand's recorded backing project. */
    projectId?: string;
    /** Explicit preview lifecycle for caller-known states such as user stop. */
    previewStatus?: BrandKitStatus;
    /** Optional override; defaults to the locale stored in brand meta. */
    locale?: string;
}
export interface RenderBrandPreviewResult {
    id: string;
    projectId: string;
    file: string;
    /** True when a brand.json was found and rendered; false means an empty
     *  scaffold was (re)written so the page still shows progress. */
    rendered: boolean;
}
/**
 * Re-render `brand.html` from whatever the agent has written into the project's
 * `brand.json` so far. Lenient by design — partial / in-progress brand data
 * renders with skeletons for the missing modules, which is exactly the live
 * "filling in" experience. Called after each measurement pass via
 * `POST /api/brands/:id/preview` (`od brand preview`).
 */
export declare function renderBrandPreviewIntoProject(opts: RenderBrandPreviewOptions): Promise<RenderBrandPreviewResult>;
/** List every stored brand as a summary (meta + provisional brand). */
export declare function listBrandSummaries(brandsRoot: string): BrandSummary[];
/** Full detail for one brand, or null when it is missing. */
export declare function readBrandDetail(brandsRoot: string, id: string): BrandDetailResponse | null;
/**
 * Remove a brand and its registered user design system. Returns false when the
 * brand dir did not exist.
 */
export declare function removeBrand(brandsRoot: string, userDesignSystemsRoot: string, id: string, removeDesignSystem?: typeof deleteUserDesignSystem): Promise<boolean>;
/**
 * Absolute path to the brand's primary logo file, or null when none exists.
 * Prefers brand.logo.primary, then the first logo in `logos/` by extension
 * priority (vector/raster before icon).
 */
export declare function resolveBrandLogoPath(brandsRoot: string, id: string): string | null;
