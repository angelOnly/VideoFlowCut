import type Database from 'better-sqlite3';
import type { LibraryConnectionStatus } from '@open-design/contracts';
import { type LibraryTokenRow } from './library-store.js';
type SqliteDb = Database.Database;
export declare function seedLibraryExtensionOrigins(origins: string[]): void;
export declare function libraryExtensionAllowedOrigins(): string[];
export declare function isAllowedExtensionOrigin(origin: string | undefined | null): boolean;
export declare function startPairing(now?: number): {
    code: string;
    expiresAt: number;
};
export type ConfirmPairingResult = {
    ok: true;
    token: string;
    label: string;
} | {
    ok: false;
    error: string;
};
export declare function confirmPairing(db: SqliteDb, opts: {
    code: string;
    extensionOrigin: string;
    label?: string;
}, now?: number): ConfirmPairingResult;
export declare function validateLibraryToken(db: SqliteDb, token: string | undefined | null): {
    ok: true;
    row: LibraryTokenRow;
} | {
    ok: false;
};
export declare function libraryConnectionStatus(db: SqliteDb): LibraryConnectionStatus;
export {};
