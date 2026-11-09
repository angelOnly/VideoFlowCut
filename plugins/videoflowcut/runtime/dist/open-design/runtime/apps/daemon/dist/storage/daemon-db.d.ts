export type DaemonDbKind = 'sqlite' | 'postgres';
export interface DaemonDbConfig {
    kind: DaemonDbKind;
    postgres?: {
        host: string;
        port: number;
        database: string;
        user: string;
        sslMode?: 'disable' | 'require' | 'verify-full';
    };
}
export declare class DaemonDbConfigError extends Error {
    constructor(message: string);
}
export declare function resolveDaemonDbConfig(env?: Record<string, string | undefined>): DaemonDbConfig;
