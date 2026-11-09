export declare const BYOK_SENSEAUDIO_IMAGE_MODELS: readonly string[];
export declare const BYOK_SENSEAUDIO_DEFAULT_IMAGE_MODEL: string;
export declare function isSenseAudioImageModel(value: unknown): value is string;
export declare const BYOK_AIHUBMIX_IMAGE_MODELS: readonly string[];
export declare const BYOK_AIHUBMIX_DEFAULT_IMAGE_MODEL: string;
export declare function isAIHubMixImageModel(value: unknown): value is string;
export declare function isAIHubMixVideoModel(value: unknown): value is string;
export declare const BYOK_AIHUBMIX_DEFAULT_VIDEO_MODEL = "aihubmix-doubao-seedance-2-0-fast-260128";
export declare function isAIHubMixSpeechModel(value: unknown): value is string;
export declare const BYOK_AIHUBMIX_DEFAULT_SPEECH_MODEL = "aihubmix-tts-1";
/**
 * OpenAI-compatible tool definition for image generation. Injected into
 * the upstream `tools` array on every /api/proxy/senseaudio/stream
 * request so the LLM can decide on its own when to call it. The
 * description deliberately tells the model to embed the returned URL
 * in markdown — the chat UI already renders markdown images inline,
 * so no client-side wiring is required for the bytes to show up.
 */
export declare const BYOK_SENSEAUDIO_TOOLS: ({
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                text?: never;
                prompt: {
                    type: string;
                    description: string;
                };
                aspect_ratio: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                model: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                voice_id?: never;
                duration?: never;
                resolution?: never;
                generate_audio?: never;
            };
            required: string[];
        };
    };
} | {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                prompt?: never;
                model?: never;
                text: {
                    type: string;
                    description: string;
                };
                voice_id: {
                    type: string;
                    description: string;
                };
                aspect_ratio?: never;
                duration?: never;
                resolution?: never;
                generate_audio?: never;
            };
            required: string[];
        };
    };
} | {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                model?: never;
                text?: never;
                voice_id?: never;
                prompt: {
                    type: string;
                    description: string;
                };
                aspect_ratio: {
                    type: string;
                    enum: ("16:9" | "1:1" | "3:4" | "4:3" | "9:16")[];
                    description: string;
                };
                duration: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                };
                resolution: {
                    type: string;
                    enum: ("1080p" | "480p" | "720p")[];
                    description: string;
                };
                generate_audio: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
})[];
/**
 * OpenAI-compatible tool definitions injected into /api/proxy/aihubmix/stream.
 * AIHubMix routes image generation to `/v1/images/generations` (OpenAI shape),
 * speech to `/v1/audio/speech`, and video to the async `/v1/videos` endpoint
 * (Sora-style submit → poll → download), so the chat session gets full
 * image + voiceover + video parity with the Media panel.
 */
export declare const BYOK_AIHUBMIX_TOOLS: ({
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                text?: never;
                voice_id?: never;
                duration?: never;
                prompt: {
                    type: string;
                    description: string;
                };
                aspect_ratio: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                model: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                image_url?: never;
            };
            required: string[];
        };
    };
} | {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                prompt?: never;
                aspect_ratio?: never;
                duration?: never;
                text: {
                    type: string;
                    description: string;
                };
                voice_id: {
                    type: string;
                    description: string;
                };
                model: {
                    enum?: never;
                    type: string;
                    description: string;
                };
                image_url?: never;
            };
            required: string[];
        };
    };
} | {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                text?: never;
                voice_id?: never;
                prompt: {
                    type: string;
                    description: string;
                };
                aspect_ratio: {
                    type: string;
                    enum: ("16:9" | "1:1" | "3:4" | "4:3" | "9:16")[];
                    description: string;
                };
                duration: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    description: string;
                };
                model: {
                    enum?: never;
                    type: string;
                    description: string;
                };
                image_url: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
})[];
/**
 * Runtime context the BYOK tool executor needs. Passed by the chat
 * route on every call so the tool layer stays free of global state and
 * can be unit-tested with a temp directory.
 */
export interface BYOKToolContext {
    /** Daemon project root — used to look up media-config when the chat
     *  session key is missing. */
    projectRoot: string;
    /** Daemon's PROJECTS_DIR (the `<projectRoot>/.od/projects/` folder
     *  that holds per-project file trees). Generated images land in
     *  `<projectsRoot>/<projectId>/byok-<id>.png` so the project's
     *  FileViewer / DesignFilesPanel discover them automatically and
     *  the file travels with the project on export, archive, rename. */
    projectsRoot: string;
    /** Active project id from the chat surface. Required — the BYOK
     *  chat always runs inside a project, so the tool dispatch refuses
     *  to fire without one rather than dump bytes into a global cache.
     *  Validated upstream via `isSafeId`. */
    projectId: string;
    /** The BYOK chat session's API key — first credential we try. Bypasses
     *  the media-config indirection so the same key the user just pasted
     *  for chat is the same key the image call uses. */
    upstreamApiKey: string;
    /** The BYOK chat session's base URL (may be a custom gateway). Falls
     *  back to api.senseaudio.cn. */
    upstreamBaseUrl?: string;
    /** Default image model the user picked in BYOK Settings, used when the
     *  LLM didn't pass `model` in tool args. Validated upstream — anything
     *  outside `BYOK_SENSEAUDIO_IMAGE_MODELS` is dropped so a stale
     *  client-side config can't smuggle an unregistered model id through.
     *  Falls back to `BYOK_SENSEAUDIO_DEFAULT_IMAGE_MODEL` (the registry's
     *  first SenseAudio image entry) when missing. */
    defaultImageModel?: string;
    /** Default video model the user picked in BYOK Settings / the composer
     *  video picker, used when the LLM didn't pass `model` in tool args.
     *  Validated upstream against `isAIHubMixVideoModel`; falls back to
     *  `BYOK_AIHUBMIX_DEFAULT_VIDEO_MODEL` when missing. */
    defaultVideoModel?: string;
    /** Default speech (TTS) model the user picked in the composer; authoritative
     *  over the LLM's `model` arg. Falls back to BYOK_AIHUBMIX_DEFAULT_SPEECH_MODEL. */
    defaultSpeechModel?: string;
    /** Default speech voice the user picked in the composer; used when neither the
     *  LLM nor the caller supplies a `voice_id`. */
    defaultSpeechVoice?: string;
    /** Test-only override for the video polling interval (ms). Production
     *  uses 5 s (SenseAudio's recommendation) — tests pass small values
     *  (e.g. 1 ms) to keep the suite fast without changing the polling
     *  semantics. */
    videoPollIntervalMs?: number;
    /** Optional per-request init copied from the live chat turn. Used to
     *  forward the current proxy dispatcher AND the client-cancellation
     *  signal into every upstream fetch the BYOK tool executor performs,
     *  so a disconnected client stops the tool loop's paid work.
     *
     *  Exception — asset downloads: when a provider result URL is fetched
     *  through `assertAndFetchExternalAsset` (connectionTest.ts), that
     *  helper intentionally OVERRIDES `init.dispatcher` with the shared
     *  asset-validating dispatcher whose connect-time DNS lookup rejects
     *  non-public addresses (issue #5478). Asset downloads therefore never
     *  ride the turn proxy dispatcher; submit/poll hops keep it. */
    requestInit?: Pick<RequestInit, 'dispatcher' | 'signal'>;
}
export interface ImageToolResult {
    ok: boolean;
    /** Daemon-served URL on success. */
    url?: string;
    /** Short human-readable failure reason. Stuffed into the `tool` role
     *  reply so the LLM can apologize / retry. */
    error?: string;
}
export declare function executeGenerateSpeech(args: {
    text?: unknown;
    voice_id?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
/**
 * Execute the `generate_image` tool. Calls SenseAudio /v1/image/sync,
 * downloads the rendered bytes, writes them to <byokImagesDir>/<id>.png,
 * and returns a daemon-served URL. Pure async — caller is responsible
 * for emitting any SSE events (e.g. "tool result ready").
 *
 * Failure modes return `{ok: false, error}` rather than throwing so the
 * caller can feed the message back to the LLM as a tool_result; that
 * lets the model apologize / suggest a retry instead of the chat
 * silently stopping.
 */
export declare function executeGenerateImage(args: {
    prompt?: unknown;
    aspect_ratio?: unknown;
    model?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
/**
 * Execute the `generate_video` tool. SenseAudio's video API is
 * asynchronous-only: POST /v1/video/create returns a task_id, then
 * GET /v1/video/status?id=<task_id> reports `pending` / `processing`
 * → `completed` (with `video_url`) or `failed` (with `error_message`).
 * We poll every `videoPollIntervalMs` (default 5 s) and bail after
 * `SENSEAUDIO_VIDEO_MAX_POLLS` so a stuck upstream can't pin the
 * chat stream forever.
 *
 * The chat tool waits for the whole loop, so the daemon's outbound
 * SSE response from /api/proxy/senseaudio/stream stays open for the
 * duration. That's intentional — the next chat turn cannot begin
 * until we have a URL to feed back into the tool_result.
 */
export declare function executeGenerateVideo(args: {
    prompt?: unknown;
    aspect_ratio?: unknown;
    duration?: unknown;
    resolution?: unknown;
    generate_audio?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
export declare function executeAIHubMixGenerateImage(args: {
    prompt?: unknown;
    aspect_ratio?: unknown;
    model?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
export declare function executeAIHubMixGenerateSpeech(args: {
    text?: unknown;
    voice_id?: unknown;
    model?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
/**
 * AIHubMix in-chat video generation. Mirrors renderAIHubMixVideo (media.ts) for
 * the wire shape — POST {base}/videos → poll GET {base}/videos/{id} → download
 * the inline URL or {base}/videos/{id}/content — and executeGenerateVideo above
 * for the chat-executor scaffolding (project storage, proxy dispatcher
 * forwarding, SSRF re-validation of the returned asset URL). Supports both
 * text-to-video and image-to-video: i2v models (id contains "i2v") take a
 * reference image from `args.image_url` or, failing that, the newest image in
 * the project, sent as the `input_reference` data URL.
 */
export declare function executeAIHubMixGenerateVideo(args: {
    prompt?: unknown;
    aspect_ratio?: unknown;
    duration?: unknown;
    model?: unknown;
    image_url?: unknown;
}, ctx: BYOKToolContext): Promise<ImageToolResult>;
