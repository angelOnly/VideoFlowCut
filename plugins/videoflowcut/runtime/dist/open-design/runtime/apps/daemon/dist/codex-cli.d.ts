import { type CommandInvocation } from '@open-design/platform';
export interface CodexRunnerResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}
export interface CodexRunner {
    run(args: string[], opts?: {
        env?: Record<string, string>;
    }): Promise<CodexRunnerResult>;
}
type CodexBinaryResolver = (id: string, configuredEnv?: Record<string, string>) => string | null;
export declare function createCodexCliInvocation(args: string[], env: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>, resolveBin?: CodexBinaryResolver): CommandInvocation;
export declare function setCodexRunner(runner: CodexRunner | null): void;
export interface CodexInstallStatus {
    available: boolean;
    installed: boolean;
}
export declare function probeCodexInstall(name: string): Promise<CodexInstallStatus>;
export interface CodexInstallSpec {
    name: string;
    command: string;
    args: string[];
    env: Record<string, string>;
}
export declare function installCodexMcp(spec: CodexInstallSpec): Promise<void>;
export interface CodexMcpRegistration {
    command: string;
    args: string[];
    env: Record<string, string>;
}
export declare function parseCodexMcpRegistration(stdout: string): CodexMcpRegistration | null;
export type CodexRegistrationRefresh = 'refreshed' | 'absent' | 'unavailable' | 'foreign' | 'unreadable';
export declare function refreshOwnedCodexMcp(spec: CodexInstallSpec, isOwned: (existing: CodexMcpRegistration) => boolean): Promise<CodexRegistrationRefresh>;
export declare function uninstallCodexMcp(name: string): Promise<void>;
export {};
