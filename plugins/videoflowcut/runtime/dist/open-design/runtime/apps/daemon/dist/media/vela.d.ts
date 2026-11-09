import { runVelaCommand } from '../integrations/vela-command.js';
type VelaCommandRunner = typeof runVelaCommand;
type ProgressFn = (message: string) => void;
export type VelaMediaImageRef = {
    abs: string;
};
export interface VelaImageRenderInput {
    aspect: string | undefined;
    imageRefs: VelaMediaImageRef[];
    model: string;
    prompt: string;
    /**
     * Published quality tier the caller asked for, or undefined when they did
     * not ask. Undefined must stay undefined all the way to the command line:
     * omitting `--quality` is how the server's own default tier (the cheapest
     * one the model publishes) stays in charge. Inventing a tier here would
     * silently re-price every unqualified request.
     */
    quality: string | undefined;
    /**
     * Published output resolution the caller asked for, or undefined to let the
     * model's default profile decide. Vela's CLI refuses a resolution without an
     * aspect ratio, so this only takes effect alongside `aspect`.
     */
    resolution: string | undefined;
    wireModel: string;
    workspaceId: string | undefined;
}
/**
 * Video shares the image input shape but not its output vocabulary: it sends a
 * fixed `--resolution` and publishes no quality tier, so the inherited
 * `quality` and `resolution` fields are deliberately ignored here rather than
 * forwarded. Wiring them up needs the video capability envelope, which is a
 * separate change.
 */
export interface VelaVideoRenderInput extends VelaImageRenderInput {
    length: number | undefined;
    onProgress: ProgressFn | undefined;
}
export interface VelaRenderResult {
    bytes: Buffer;
    providerNote: string;
    suggestedExt?: string;
}
/** The installed local media runtime predates Vela's media command surface. */
export declare const VELA_MEDIA_CLI_INCOMPATIBLE_CODE = "MEDIA_CLI_INCOMPATIBLE";
export declare function renderVelaImage(input: VelaImageRenderInput, runCommand?: VelaCommandRunner): Promise<VelaRenderResult>;
/**
 * The stable, provider-neutral code Vela publishes when a content-safety
 * policy refused an image request. It is the same string at every layer from
 * the provider adapter through the API and the CLI, which is what makes it
 * safe to key product behaviour on.
 */
export declare const VELA_SAFETY_REJECTION_CODE = "safety_rejection";
/**
 * Optional, non-authoritative hint about what a safety policy objected to.
 * Absent whenever the upstream supplier could not prove it — callers must then
 * fall back to naming both possibilities rather than picking one.
 */
export type VelaSafetySubject = 'prompt' | 'input_image' | 'output_image';
/**
 * A Vela media failure that arrived with a machine-readable verdict rather
 * than only a human sentence.
 *
 * `code` is carried on the error itself because the media task route copies
 * `err.code` straight into the persisted task snapshot; that is what lets the
 * web client render a definite explanation instead of depending on the agent
 * to repeat one correctly.
 */
export declare class VelaMediaError extends Error {
    readonly code: string;
    readonly subject: VelaSafetySubject | undefined;
    readonly retryable: boolean | undefined;
    constructor(message: string, detail: {
        code: string;
        subject?: VelaSafetySubject | undefined;
        retryable?: boolean | undefined;
    });
}
/**
 * Rebuild a structured failure from a rejected `vela image --json` run.
 *
 * Returns undefined for every failure that carried no task JSON — a CLI
 * validation error, a crash, a timeout — so those keep their existing generic
 * handling. An unrecognised or absent `code` is deliberately NOT promoted to a
 * safety rejection: mislabelling an outage as a policy refusal would send a
 * user off to rewrite a prompt that was never the problem.
 */
export declare function velaMediaErrorFromFailure(error: unknown, label: string): VelaMediaError | undefined;
export declare function renderVelaVideo(input: VelaVideoRenderInput, runCommand?: VelaCommandRunner): Promise<VelaRenderResult>;
/** Account/workspace-filtered catalogue. Never treat a failed read as an empty catalogue. */
export declare function fetchVelaVideoModels(workspaceId?: string, runCommand?: VelaCommandRunner): Promise<string[]>;
export {};
