import { type AppliedStrategyBindingV2, type BundledStrategyDeclarationV2, type InstalledPluginRecord } from '@open-design/contracts';
type StrategyProvenanceInput = Pick<InstalledPluginRecord, 'sourceKind' | 'manifest'>;
export type BundledStrategyProvenanceV2 = {
    kind: 'none';
} | {
    kind: 'invalid';
    errors: string[];
} | {
    kind: 'inactive';
    declaration: BundledStrategyDeclarationV2;
};
/**
 * Interpret the V2 strategy sidecar only after installed provenance proves
 * that the bytes came from the daemon's bundled tree. `PluginManifestSchema`
 * deliberately keeps this field as unknown passthrough data so community and
 * older manifests cannot be forced through an internal contract.
 *
 * Task 04 ships content and contracts only. Until the later activation task
 * supplies hash-gated binding, every valid bundled declaration is internal
 * and every invalid bundled declaration fails closed as internal too.
 */
export declare function inspectBundledStrategyProvenanceV2(plugin: StrategyProvenanceInput): BundledStrategyProvenanceV2;
export declare function isInternalBundledStrategyV2(plugin: StrategyProvenanceInput): boolean;
export declare class InvalidBundledStrategyActivationV2Error extends Error {
    constructor(message: string);
}
/**
 * Validate the hash-gated activation produced by the daemon content reader.
 * Generic/public apply callers never receive this binding and remain closed.
 */
export declare function validateBundledStrategyActivationV2(plugin: StrategyProvenanceInput & Pick<InstalledPluginRecord, 'id' | 'version'>, candidate: unknown): AppliedStrategyBindingV2;
export {};
