export declare const consumedImportNonces: Map<string, number>;
export declare function setDesktopAuthSecret(secret: Buffer | null): void;
export declare function getDesktopAuthSecret(): Buffer | null;
export declare function isDesktopAuthRegistered(): boolean;
export declare function isDesktopAuthGateActive(): boolean;
export declare function resetDesktopAuthForTests(): void;
export declare function pruneExpiredImportNonces(now: number): void;
export declare function signDesktopImportToken(secret: Buffer, baseDir: string, options: {
    nonce: string;
    exp: string;
}): string;
export type DesktopImportTokenVerification = {
    ok: true;
    nonce: string;
    exp: number;
} | {
    ok: false;
    reason: string;
};
export declare function verifyDesktopImportToken(secret: Buffer, baseDir: string, token: string, now: number, consumedNonces: Map<string, number>): DesktopImportTokenVerification;
