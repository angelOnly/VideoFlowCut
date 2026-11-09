import { type NotInvocableCause } from './diagnostics.js';
import type { AgentDiagnostic, DetectedAgent, RuntimeAgentDef, RuntimeCapabilityMap, RuntimeModelSource, RuntimeModelOption } from './types.js';
export interface DetectedRuntimeVersions {
    /** The configured executable successfully spawned, independent of version parsing. */
    invocable: true;
    agentCliVersion?: string;
    runtimeCompanionName?: string;
    runtimeCompanionVersion?: string;
}
export declare function getDetectedRuntimeVersions(agentId: string | null | undefined): DetectedRuntimeVersions | null;
/**
 * Resolve exact runtime provenance for one selected agent without requiring a
 * prior Settings or `/api/agents` request to have warmed the daemon cache.
 *
 * OD Next uses this at its capability boundary. The cache remains the normal
 * fast path; after a daemon restart, the selected CLI is probed once through
 * the same bounded detection path used by the agent picker. A successfully
 * spawned probe remains non-null even when version output is
 * unavailable; only a non-invocable runtime stays null.
 */
export declare function ensureDetectedRuntimeVersions(agentId: string | null | undefined, configuredAgentEnv?: Record<string, string>): Promise<DetectedRuntimeVersions | null>;
/**
 * Resolve the advertised `--help` capability flags for one selected agent
 * without requiring a prior Settings or `/api/agents` request to have warmed
 * `agentCapabilities`.
 *
 * `ensureDetectedRuntimeVersions` deliberately probes only `--version`, so an
 * admission path that never ran full detection sees an empty capability map
 * and cannot tell "this CLI does not advertise the flag" apart from "nobody
 * asked the CLI yet". Callers that gate behaviour on an advertised flag must
 * establish the answer through this probe first; it reuses the same bounded
 * `--help` read and the same `agentCapabilities` cache as full detection.
 *
 * Returns null only when the runtime is not resolvable or declares no
 * capability metadata; a CLI whose `--help` simply omits every known flag
 * resolves to a populated map of `false` values.
 */
export declare function ensureDetectedRuntimeCapabilities(agentId: string | null | undefined, configuredAgentEnv?: Record<string, string>): Promise<RuntimeCapabilityMap | null>;
export type VersionProbeOutcome = {
    kind: 'not-invocable';
    cause: NotInvocableCause;
} | {
    kind: 'spawned';
    version: string | null;
};
/**
 * Classify a rejected `--version` probe. There are two distinct failure modes
 * to discriminate:
 *
 *   - **Not invocable.** The OS rejected the spawn outright, OR the
 *     wrapper script spawned but its underlying interpreter / target
 *     failed. We split permission failures (EACCES / exit 126) from
 *     missing-target failures (ENOENT / ENOTDIR / exit 127 / cmd.exe's 9009,
 *     plus the launcher stderr Windows wrappers report instead) so Settings
 *     can offer permission-specific copy instead of treating every failure as
 *     a broken shim. We still mark the agent unavailable so Settings does not
 *     advertise a ghost entry (issue #658, lefarcen review P2 on PR #1301).
 *
 *   - **Spawned but `--version` was unhappy.** The binary itself ran
 *     (any other rejection: timeout, generic non-zero exit, stderr
 *     noise) so the CLI is invocable; we just can't read a version
 *     string. Adapters whose `--version` flag is unsupported land
 *     here and must keep working with `version: null`.
 *
 * `child_process.execFile` reports OS-level rejections with a string
 * `err.code` (`'ENOENT'`, `'EACCES'`, `'ENOTDIR'`) and non-zero exit
 * codes with a *numeric* `err.code` equal to the exit status, so those
 * two arms are unambiguous. Windows wrappers are the case they cannot
 * decide on their own — see `launcherTargetMissing` above.
 *
 * Exported because half of what it decides cannot be reached from a test that
 * spawns a fixture. `9009` and cmd.exe / PowerShell's wording only ever come
 * from a real Windows launcher, and POSIX masks exit statuses to 8 bits, so a
 * shell asked for 9009 reports 49. Since the daemon suite runs on Linux in CI,
 * driving this directly is the only way the merge gate can catch a regression
 * in a signature the Windows fix depends on.
 */
export declare function classifyVersionProbeFailure(err: unknown): VersionProbeOutcome;
export declare function detectAgent(def: RuntimeAgentDef, configuredEnv?: Record<string, string>): Promise<DetectedAgent>;
export declare function detectAgents(configuredEnvByAgent?: Record<string, Record<string, string>>): Promise<(Omit<RuntimeAgentDef, "authProbe" | "buildArgs" | "capabilityFlags" | "encodeStdinPrompt" | "env" | "fallbackBins" | "fallbackModels" | "fetchModels" | "firstOutputTimeoutMs" | "helpArgs" | "hiddenCapabilityFlags" | "inactivityTimeoutMs" | "listModels" | "maxPromptArgBytes" | "versionPolicy" | "versionProbeTimeoutMs"> & {
    models: RuntimeModelOption[];
    modelsSource: RuntimeModelSource;
    available: boolean;
    authStatus?: 'ok' | 'missing' | 'unknown';
    authMessage?: string;
    path?: string;
    version?: string | null;
    diagnostics?: AgentDiagnostic[];
})[]>;
export declare function detectAgentsStream(configuredEnvByAgent?: Record<string, Record<string, string>>): AsyncGenerator<DetectedAgent>;
