type EnvMap = NodeJS.ProcessEnv | Record<string, string | undefined>;
export type AmrAccountErrorCode = 'AMR_AUTH_REQUIRED' | 'AMR_INSUFFICIENT_BALANCE' | 'AMR_TIER_UPGRADE_REQUIRED';
export interface AmrAccountFailure {
    code: AmrAccountErrorCode;
    message: string;
    action: 'relogin' | 'recharge' | 'upgrade';
    actionUrl?: string;
}
export interface AmrAccountFailureSignal {
    details?: unknown;
    message?: unknown;
    errorMessage?: unknown;
    errorCode?: unknown;
    stdoutTail?: unknown;
    stderrTail?: unknown;
}
export declare const DEFAULT_AMR_RECHARGE_URL = "https://open-design.ai/cloud/dashboard?source=open_design";
export declare function amrRechargeUrl(configuredEnv?: EnvMap): string;
export declare function reportsPlatformProviderCredentialFault(text: string): boolean;
export declare function classifyAmrAccountFailureDetails(details: unknown, configuredEnv?: EnvMap): AmrAccountFailure | null;
export declare function classifyAmrAccountFailureSignal(signal: AmrAccountFailureSignal, configuredEnv?: EnvMap): AmrAccountFailure | null;
export declare function classifyAmrAccountFailure(text: string, configuredEnv?: EnvMap): AmrAccountFailure | null;
export declare function amrAccountFailureDetails(failure: AmrAccountFailure): {
    kind: string;
    action: "recharge" | "relogin" | "upgrade";
    actionUrl?: string;
};
export {};
