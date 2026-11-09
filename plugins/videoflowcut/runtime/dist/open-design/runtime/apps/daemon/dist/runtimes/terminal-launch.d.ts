export type TerminalLaunchResult = {
    ok: true;
    platform: NodeJS.Platform;
    via: string;
} | {
    ok: false;
    platform: NodeJS.Platform;
    reason: string;
};
export declare function launchAgentInSystemTerminal(command: string, platform?: NodeJS.Platform): Promise<TerminalLaunchResult>;
