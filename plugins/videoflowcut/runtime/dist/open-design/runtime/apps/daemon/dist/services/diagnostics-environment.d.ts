import { networkInterfaces } from 'node:os';
/** Only this allowlist may enter diagnostics; never serialize an environment object. */
export declare function summarizeProxyEnvironment(env: NodeJS.ProcessEnv): {
    http: {
        configured: boolean;
        valid?: never;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol: string;
        port: string | null;
        endpointFingerprint: string;
        loopback: boolean;
        credentialsPresent: boolean;
    };
    https: {
        configured: boolean;
        valid?: never;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol: string;
        port: string | null;
        endpointFingerprint: string;
        loopback: boolean;
        credentialsPresent: boolean;
    };
    all: {
        configured: boolean;
        valid?: never;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol?: never;
        port?: never;
        endpointFingerprint?: never;
        loopback?: never;
        credentialsPresent?: never;
    } | {
        configured: boolean;
        valid: boolean;
        protocol: string;
        port: string | null;
        endpointFingerprint: string;
        loopback: boolean;
        credentialsPresent: boolean;
    };
    noProxy: {
        configured: boolean;
        wildcard: boolean;
        fingerprint: string | null;
    };
    nodeUseEnvProxy: boolean;
};
export type DiagnosticProxyEnvironment = ReturnType<typeof summarizeProxyEnvironment>;
export declare function diagnosticId(value: unknown): string | null;
export type DiagnosticFailureCode = 'timeout' | 'aborted' | 'dns' | 'connection-refused' | 'tls' | 'proxy' | 'http' | 'other';
/** Error text, argv, stdout and stderr can contain secrets. Never retain them. */
export declare function diagnosticFailureCode(error: unknown): DiagnosticFailureCode;
export interface SystemEnvironmentSnapshot {
    sampledAt: string;
    status: 'collected' | 'unavailable' | 'unsupported';
    systemProxy: DiagnosticProxyEnvironment | null;
    pacConfigured: boolean | null;
    daemonProxy: DiagnosticProxyEnvironment;
    interfaces: {
        ipv4: number;
        ipv6: number;
    } | null;
}
declare function runSystemQuery(command: string, args: string[]): Promise<string>;
/** On-demand only: no requests to the network, process scans or synchronous subprocesses. */
export declare function collectSystemEnvironment(options?: {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    query?: typeof runSystemQuery;
    interfaces?: typeof networkInterfaces;
}): Promise<SystemEnvironmentSnapshot>;
export {};
