import type { AutomaticDiagnosticManifest } from '@open-design/diagnostics';
export interface DiagnosticDevice {
    device_id: string;
    device_token: string;
}
export declare class DiagnosticRelayError extends Error {
    readonly code: string;
    readonly retryAfterMs: number;
    readonly permanent: boolean;
    constructor(code: string, retryAfterMs?: number, permanent?: boolean);
}
export declare function diagnosticRelayUrl(env: NodeJS.ProcessEnv): string | null;
export declare class DiagnosticRelay {
    readonly origin: string;
    private readonly allowed;
    private readonly fetcher;
    constructor(origin: string, allowed: () => boolean, fetcher?: typeof fetch);
    private post;
    register(signal: AbortSignal): Promise<DiagnosticDevice>;
    upload(device: DiagnosticDevice, manifest: AutomaticDiagnosticManifest, directory: string, signal: AbortSignal): Promise<string>;
}
