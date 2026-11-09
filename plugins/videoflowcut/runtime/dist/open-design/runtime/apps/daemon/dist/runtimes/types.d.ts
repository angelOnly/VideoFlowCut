import type { ExecFileOptions } from 'node:child_process';
import type { AgentDiagnostic, ModelMetadata } from '@open-design/contracts';
export type { AgentDiagnostic } from '@open-design/contracts';
export type RuntimeEnv = NodeJS.ProcessEnv | Record<string, string>;
export type RuntimeModelOption = {
    id: string;
    label: string;
    enabled?: boolean;
    default?: boolean;
    inputPriceUsdPerMillion?: number;
    outputPriceUsdPerMillion?: number;
    metadata?: ModelMetadata;
    additionalSpeedTiers?: string[];
    serviceTierOptions?: RuntimeModelOption[];
    reasoningOptions?: RuntimeModelOption[];
};
export type RuntimeModelSource = 'live' | 'fallback';
export type RuntimeReasoningOption = RuntimeModelOption;
export type RuntimeBuildOptions = {
    model?: string | null;
    reasoning?: string | null;
    serviceTier?: string | null;
};
export type RuntimeContext = {
    cwd?: string;
    hasPriorAssistantTurn?: boolean;
    agentLogFilePath?: string;
    antigravitySettingsPath?: string;
    promptFilePath?: string;
    resumeSessionId?: string | null;
    newSessionId?: string;
    disablePlugins?: boolean;
    /** 受管作品以自身目录为根，避免继承宿主开发仓库规则。 */
    isolateManagedProjectRoot?: boolean;
    /**
     * Enables provider-owned native Child behavior frames for an OD Next mapped
     * Run. Runtime definitions must keep this off for ordinary Runs, and stream
     * handlers must consume the frames as an evidence-only side channel rather
     * than forwarding Child text into the parent UI stream.
     */
    observeNativeChildBehavior?: boolean;
};
export type RuntimeCapabilityMap = Record<string, boolean>;
export type RuntimeListModels = {
    args: string[];
    timeoutMs?: number;
    parse: (stdout: string) => RuntimeModelOption[] | null;
};
export type RuntimeVersionPolicy = {
    /** Exact version strings exercised by this OpenDesign build. */
    supportedVersions: string[];
    /**
     * Optional shape of versions this build accepts without having exercised
     * each one. Some agent CLIs ship as a stream of release candidates that
     * moves faster than our releases do, so naming individual ones warns every
     * user who followed our own install instructions the week after we bump
     * them. Matching the line keeps the check meaningful instead of removing
     * it — a version off that line still warns.
     *
     * Must not carry the `g` flag: `RegExp.test` is stateful with it, so the
     * same version would alternate between supported and untested.
     */
    supportedVersionPattern?: RegExp;
    /** Fail closed when the version probe fails or returns no usable version. */
    requireVersion: true;
    /** Normalize and validate the first output line; null means unusable. */
    parse?: (raw: string) => string | null;
};
export type RuntimeCompatibilityProbe = {
    /** Arguments for a side-effect-free runtime/profile handshake. */
    args: string[];
    timeoutMs?: number;
    /** Optional read-only gate used when invoking the probe would create state. */
    preflight?: (env: NodeJS.ProcessEnv) => boolean;
    /** Returns the companion/profile version when the output is compatible. */
    parse: (stdout: string) => string;
};
export type RuntimePromptBudgetError = {
    code: 'AGENT_PROMPT_TOO_LARGE';
    message: string;
    bytes?: number;
    commandLineLength?: number;
    limit: number;
};
export type RuntimeAgentDef = {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    fallbackModels: RuntimeModelOption[];
    buildArgs: (prompt: string, imagePaths: string[], extraAllowedDirs?: string[], options?: RuntimeBuildOptions, runtimeContext?: RuntimeContext) => string[];
    streamFormat: string;
    fallbackBins?: string[];
    versionProbeTimeoutMs?: number;
    versionPolicy?: RuntimeVersionPolicy;
    compatibilityProbe?: RuntimeCompatibilityProbe;
    helpArgs?: string[];
    capabilityFlags?: Record<string, string>;
    hiddenCapabilityFlags?: {
        probeArgsPrefix: string[];
        flags: Record<string, string>;
    };
    promptViaFile?: boolean;
    promptViaStdin?: boolean;
    promptInputFormat?: 'text' | 'stream-json';
    encodeStdinPrompt?: (prompt: string) => string;
    eventParser?: string;
    env?: Record<string, string>;
    listModels?: RuntimeListModels;
    fetchModels?: (resolvedBin: string, env: RuntimeEnv) => Promise<RuntimeModelOption[] | null>;
    reasoningOptions?: RuntimeReasoningOption[];
    supportsImagePaths?: boolean;
    maxPromptArgBytes?: number;
    mcpDiscovery?: string;
    externalMcpInjection?: 'claude-mcp-json' | 'acp-merge' | 'opencode-env-content' | 'mimo-env-content';
    installUrl?: string;
    docsUrl?: string;
    supportsCustomModel?: boolean;
    resumesSessionViaCli?: boolean;
    resumesSessionViaProfileStdio?: boolean;
    capturesSessionIdFromStream?: boolean;
    resumesSessionViaAcpLoad?: boolean;
    defaultModelEnvVar?: string;
    inactivityTimeoutMs?: number;
    firstOutputTimeoutMs?: number;
    acpTurnEndCompletesPrompt?: boolean;
    authProbe?: {
        args: string[];
        timeoutMs?: number;
        classifierAgentId?: string;
    };
    acpMcpEnvFormat?: 'array' | 'map';
    acpStdioMcpRemovedInVersion?: string;
};
export type DetectedAgent = Omit<RuntimeAgentDef, 'buildArgs' | 'listModels' | 'fetchModels' | 'fallbackModels' | 'helpArgs' | 'capabilityFlags' | 'hiddenCapabilityFlags' | 'fallbackBins' | 'versionProbeTimeoutMs' | 'versionPolicy' | 'maxPromptArgBytes' | 'encodeStdinPrompt' | 'env' | 'inactivityTimeoutMs' | 'firstOutputTimeoutMs' | 'authProbe'> & {
    models: RuntimeModelOption[];
    modelsSource: RuntimeModelSource;
    available: boolean;
    authStatus?: 'ok' | 'missing' | 'unknown';
    authMessage?: string;
    path?: string;
    version?: string | null;
    diagnostics?: AgentDiagnostic[];
};
export type RuntimeExecOptions = ExecFileOptions & {
    env?: NodeJS.ProcessEnv;
};
export declare function runtimeResumesSessionById(def: Pick<RuntimeAgentDef, 'resumesSessionViaCli' | 'resumesSessionViaProfileStdio'>): boolean;
