import type { DshProfileRuntimeFrame, DshProfileStreamError } from './types.js';
export declare const DEFAULT_DSH_PROFILE_MAX_FRAME_BYTES: number;
export type DshProfileStreamOptions = {
    onFrame: (frame: DshProfileRuntimeFrame) => void;
    onError: (error: DshProfileStreamError) => void;
    maxFrameBytes?: number;
};
export declare function createDshProfileJsonlStream({ onFrame, onError, maxFrameBytes, }: DshProfileStreamOptions): {
    feed(chunk: string | Uint8Array): void;
    flush(): void;
    failIfIncomplete(): void;
    hasFailed(): boolean;
};
