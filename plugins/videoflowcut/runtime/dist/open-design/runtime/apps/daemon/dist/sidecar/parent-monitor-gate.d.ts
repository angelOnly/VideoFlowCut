export declare function holdParentMonitorExit(): () => void;
export declare function isParentMonitorExitHeld(): boolean;
export declare function waitForParentMonitorRelease(): Promise<void>;
export declare function resetParentMonitorExitHoldForTests(): void;
