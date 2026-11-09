import type { AmrWalletSnapshot } from '@open-design/contracts';
type FetchLike = typeof fetch;
interface VelaWalletReaderOptions {
    fetch?: FetchLike;
    now?: () => Date;
    timeoutMs?: number;
    ttlMs?: number;
}
interface ReadVelaWalletSnapshotOptions {
    env?: NodeJS.ProcessEnv;
    configuredEnv?: Record<string, string>;
    refresh?: boolean;
}
export declare function createVelaWalletSnapshotReader(options?: VelaWalletReaderOptions): {
    clear(): void;
    read: (readOptions?: ReadVelaWalletSnapshotOptions) => Promise<AmrWalletSnapshot>;
};
export declare const velaWalletSnapshotReader: {
    clear(): void;
    read: (readOptions?: ReadVelaWalletSnapshotOptions) => Promise<AmrWalletSnapshot>;
};
export declare function clearVelaWalletSnapshotCache(): void;
export {};
