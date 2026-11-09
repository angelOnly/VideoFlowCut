import type { TrackingRunTerminalTrigger } from '@open-design/contracts/analytics';
export declare const RESTART_ERROR_CODE = "DAEMON_RESTARTED";
export declare const RESTART_ERROR_MESSAGE = "Run interrupted because the daemon restarted.";
export interface RestartRecoverableDurableRunState {
    error?: string | null;
    errorCode?: string | null;
    exitCode?: number | null;
    signal?: string | null;
    status: string;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
    terminalRecoveryReason?: 'daemon_restart' | 'analytics_incomplete';
    terminalAt?: number | null;
    updatedAt: number;
}
export declare function interruptDurableRunAfterDaemonRestart(state: RestartRecoverableDurableRunState, now?: number): boolean;
