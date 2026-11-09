import { automaticStrategyTaskProfileForProjectMetadata } from '@open-design/contracts';
const TASK_PROFILES = new Set([
    'prototype',
    'ppt',
    'marketing',
    'hyperframes',
    'motion-design',
]);
export function createAutomaticProjectStrategyBinding(input) {
    if (automaticStrategyTaskProfileForProjectMetadata(input.metadata)
        !== input.taskProfile)
        return null;
    return {
        schemaVersion: 1,
        provenance: 'automatic_default',
        taskProfile: input.taskProfile,
        boundAt: input.boundAt ?? Date.now(),
    };
}
export function readVerifiedProjectStrategyBinding(metadata) {
    const binding = metadata?.strategyBinding;
    if (!binding || typeof binding !== 'object')
        return null;
    if (binding.schemaVersion !== 1
        || binding.provenance !== 'automatic_default'
        || !TASK_PROFILES.has(binding.taskProfile)
        || typeof binding.boundAt !== 'number'
        || !Number.isFinite(binding.boundAt))
        return null;
    return automaticStrategyTaskProfileForProjectMetadata(metadata) === binding.taskProfile
        ? binding
        : null;
}
//# sourceMappingURL=strategy-binding.js.map