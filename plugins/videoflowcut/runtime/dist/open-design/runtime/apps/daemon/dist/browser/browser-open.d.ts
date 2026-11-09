import type { ChildProcess, SpawnOptions } from 'node:child_process';
type SupportedPlatform = NodeJS.Platform;
export type BrowserOpenInvocation = {
    command: string;
    args: string[];
    options: SpawnOptions;
};
type OpenBrowserDeps = {
    platform?: SupportedPlatform;
    spawn?: (command: string, args: string[], options: SpawnOptions) => ChildProcess;
    warn?: (message: string) => void;
    env?: NodeJS.ProcessEnv;
};
export declare function createBrowserOpenInvocation(platform: SupportedPlatform, url: string, env?: NodeJS.ProcessEnv): BrowserOpenInvocation;
export declare function openBrowser(url: string, deps?: OpenBrowserDeps): ChildProcess | null;
export {};
