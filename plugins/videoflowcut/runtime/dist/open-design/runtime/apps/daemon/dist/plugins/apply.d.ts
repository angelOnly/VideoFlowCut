import { type RegistryView } from '@open-design/plugin-runtime';
import { renderPluginBlock, type AppliedStrategyBindingV2, type ApplyResult, type InstalledPluginRecord, type McpServerSpec, type PluginManifest, type TrustTier } from '@open-design/contracts';
import { type ConnectorProbe } from './connector-gate.js';
export declare class MissingInputError extends Error {
    readonly fields: string[];
    constructor(fields: string[]);
}
export declare class InternalBundledStrategyApplyError extends Error {
    readonly pluginId: string;
    constructor(pluginId: string);
}
export type ApplyTrust = 'trusted' | 'restricted';
export interface ApplyInput {
    plugin: InstalledPluginRecord;
    inputs: Record<string, unknown>;
    registry: RegistryView;
    trust?: TrustTier | undefined;
    activeProjectDesignSystem?: {
        id: string;
        title?: string;
    } | undefined;
    locale?: string | undefined;
    connectorProbe?: ConnectorProbe | undefined;
    /** Daemon-internal, controlled-I/O proof for OD Next activation. */
    internalStrategyBinding?: AppliedStrategyBindingV2 | undefined;
}
export interface ApplyComputed {
    result: ApplyResult;
    manifestSourceDigest: string;
    warnings: string[];
}
export declare function applyPlugin(input: ApplyInput): ApplyComputed;
export declare function pickFirstLocalSkillPath(manifest: PluginManifest): string | undefined;
export declare const pluginPromptBlock: typeof renderPluginBlock;
export type { McpServerSpec };
