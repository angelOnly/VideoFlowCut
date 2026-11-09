import type { DesktopRenderFramesInput, DesktopRenderFramesResult } from '@open-design/sidecar-proto';
import { type AudioKind, type MediaSurface } from './models.js';
import { type ImageGenerationRequestSummary } from './image-generation-retry.js';
type ProgressFn = (message: string) => void;
type DesktopFrameRenderer = (input: DesktopRenderFramesInput) => Promise<DesktopRenderFramesResult>;
type MediaRequestInit = Pick<RequestInit, 'dispatcher'>;
/**
 * Generate a media artifact and write it into the project's files dir.
 *
 * @param {Object} args
 * @param {string} args.projectRoot   - Repo root (.od/ lives directly under).
 * @param {string} args.projectsRoot  - Absolute path to <repo>/.od/projects.
 * @param {string} args.projectId
 * @param {'image'|'video'|'audio'} args.surface
 * @param {string} args.model
 * @param {string} [args.prompt]
 * @param {string} [args.output]
 * @param {string} [args.aspect]
 * @param {number} [args.length]
 * @param {number} [args.duration]
 * @param {string} [args.voice]
 * @param {string} [args.audioKind]
 * @param {string} [args.language]
 * @returns {Promise<{ name: string, size: number, mtime: number, kind: string, mime: string, model: string, surface: string, providerNote: string, providerId: string }>}
 */
export declare function generateMedia(args: {
    projectRoot: string;
    projectsRoot: string;
    projectId: string;
    surface: MediaSurface;
    model: string;
    prompt?: string;
    output?: string;
    aspect?: string;
    quality?: string;
    resolution?: string;
    length?: number;
    duration?: number;
    voice?: string;
    audioKind?: AudioKind;
    language?: string;
    loop?: boolean;
    promptInfluence?: number;
    compositionDir?: string;
    image?: string;
    images?: string[];
    onProgress?: ProgressFn;
    requestInit?: MediaRequestInit;
    desktopFrameRenderer?: DesktopFrameRenderer | null;
    workspaceId?: string;
    onProviderRequestSettled?: (summary: ImageGenerationRequestSummary & {
        providerId: string;
    }) => void;
    /**
     * Called once with the EXACT provider bytes that were just written, while
     * they are still in memory.
     *
     * This is the strongest capture point in the daemon: the caller receives the
     * very buffer that produced the file, so an immutable snapshot never has to
     * re-read a path that the next turn may already have overwritten. The media
     * layer stays a pure dispatcher — it hands over bytes and a project-relative
     * name and knows nothing about snapshots, runs, or messages.
     *
     * Failures here must never fail the generation, so the caller's rejection is
     * swallowed by design.
     */
    onBytesWritten?: (written: {
        bytes: Buffer;
        name: string;
        mime: string;
        kind: string;
        mtime: number;
    }) => void | Promise<void>;
}): Promise<{
    name: string;
    size: number;
    mtime: number;
    kind: string;
    mime: any;
    model: string;
    surface: MediaSurface;
    providerNote: string;
    providerId: string;
    providerError: string | null;
    usedStubFallback: boolean;
    intentionalStub: boolean;
    warnings: (string | null)[];
}>;
export declare function hyperFramesCompositionMetrics(html: string): {
    fps: number;
    height: number;
    width: number;
};
export declare function injectHyperFramesFrameBridge(sourceHtml: string, runtimeScript: string): string;
export {};
