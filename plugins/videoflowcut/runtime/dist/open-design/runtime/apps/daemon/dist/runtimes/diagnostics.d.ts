import type { AgentLaunchResolution } from './launch.js';
import type { AgentAuthProbeResult } from './auth.js';
import type { AgentDiagnostic, RuntimeAgentDef } from './types.js';
export declare function buildExecutableDiagnostic(def: Pick<RuntimeAgentDef, 'id' | 'name' | 'bin'>, configuredEnv?: Record<string, string>): AgentDiagnostic;
export type NotInvocableCause = 'not-executable' | 'missing-target';
export declare function buildNotInvocableDiagnostic(def: Pick<RuntimeAgentDef, 'id' | 'name'>, launch: Pick<AgentLaunchResolution, 'selectedPath' | 'launchPath'>, cause: NotInvocableCause): AgentDiagnostic;
export declare function buildVersionDiagnostic(def: Pick<RuntimeAgentDef, 'name' | 'versionPolicy'>, version: string | null): AgentDiagnostic;
export declare function buildCompatibilityDiagnostic(def: Pick<RuntimeAgentDef, 'name'>): AgentDiagnostic;
export declare function buildAuthDiagnostic(def: Pick<RuntimeAgentDef, 'id' | 'name'>, auth: AgentAuthProbeResult): AgentDiagnostic | null;
