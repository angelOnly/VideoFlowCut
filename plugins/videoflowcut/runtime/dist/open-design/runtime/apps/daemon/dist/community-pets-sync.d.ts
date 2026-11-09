export interface SyncOptions {
    source?: 'petshare' | 'hatchery' | 'all';
    force?: boolean;
    limit?: number | null;
    concurrency?: number;
}
export interface SyncResult {
    wrote: number;
    skipped: number;
    failed: number;
    total: number;
    rootDir: string;
    errors: string[];
}
export declare function syncCommunityPets(options?: SyncOptions): Promise<SyncResult>;
