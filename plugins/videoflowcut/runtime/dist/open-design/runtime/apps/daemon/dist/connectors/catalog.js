const destructiveHintPattern = /(?:^|[._:\-/\s])(?:destructive|destroy|drop|truncate|purge|erase|wipe|remove-all|remove_all|revoke|reset)(?:$|[._:\-/\s])/i;
const writeHintPattern = /(?:^|[._:\-/\s])(?:write|create|update|delete|admin|send|post|manage)(?:$|[._:\-/\s])/i;
const readOnlyHintPattern = /(?:^|[._:\-/\s])(?:read|readonly|read-only|read_only|get|list|search|fetch|view|query|inspect|summary|status)(?:$|[._:\-/\s])/i;
function connectorToolSafetyHaystack(input) {
    return [input.name, input.title, input.description, ...(input.requiredScopes ?? [])]
        .filter((value) => typeof value === 'string' && value.length > 0)
        .join(' ');
}
function connectorToolPrimarySafetyHaystack(input) {
    return [input.name, input.title, ...(input.requiredScopes ?? [])]
        .filter((value) => typeof value === 'string' && value.length > 0)
        .join(' ');
}
export function classifyConnectorToolSafety(input) {
    const haystack = connectorToolSafetyHaystack(input);
    if (destructiveHintPattern.test(haystack)) {
        return {
            sideEffect: 'destructive',
            approval: 'disabled',
            reason: 'Tool name, scope, or description contains destructive hints; destructive tools are not refreshable.',
        };
    }
    const primaryHaystack = connectorToolPrimarySafetyHaystack(input);
    if (writeHintPattern.test(primaryHaystack)) {
        return {
            sideEffect: 'write',
            approval: 'confirm',
            reason: 'Tool name or required scope indicates write-capable behavior; explicit confirmation is required.',
        };
    }
    if (readOnlyHintPattern.test(primaryHaystack)) {
        return {
            sideEffect: 'read',
            approval: 'auto',
            reason: 'Tool name or scope indicates explicit read-only behavior.',
        };
    }
    if (writeHintPattern.test(input.description ?? '')) {
        return {
            sideEffect: 'write',
            approval: 'confirm',
            reason: 'Tool description indicates write-capable behavior; explicit confirmation is required.',
        };
    }
    if (readOnlyHintPattern.test(input.description ?? '')) {
        return {
            sideEffect: 'read',
            approval: 'auto',
            reason: 'Tool description indicates explicit read-only behavior.',
        };
    }
    return {
        sideEffect: 'write',
        approval: 'confirm',
        reason: 'Tool safety could not be proven read-only; defaulting to confirmation-required write policy.',
    };
}
export function isRefreshEligibleConnectorToolSafety(safety) {
    return safety.sideEffect === 'read' && safety.approval === 'auto';
}
export function defineConnectorTool(tool) {
    const safety = tool.safety ?? classifyConnectorToolSafety(tool);
    return {
        ...tool,
        safety,
        refreshEligible: tool.refreshEligible ?? isRefreshEligibleConnectorToolSafety(safety),
    };
}
function cloneBoundedJsonValue(value) {
    if (Array.isArray(value))
        return value.map((item) => cloneBoundedJsonValue(item));
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneBoundedJsonValue(entry)]));
    }
    return value;
}
function cloneBoundedJsonObject(value) {
    return cloneBoundedJsonValue(value);
}
function toolDefinitionToDetail(tool) {
    return {
        name: tool.name,
        title: tool.title,
        ...(tool.description === undefined ? {} : { description: tool.description }),
        ...(tool.inputSchemaJson === undefined ? {} : { inputSchemaJson: cloneBoundedJsonObject(tool.inputSchemaJson) }),
        ...(tool.outputSchemaJson === undefined ? {} : { outputSchemaJson: cloneBoundedJsonObject(tool.outputSchemaJson) }),
        safety: { ...tool.safety },
        refreshEligible: tool.refreshEligible,
        ...(tool.curation === undefined
            ? {}
            : { curation: { ...(tool.curation.useCases === undefined ? {} : { useCases: [...tool.curation.useCases] }), ...(tool.curation.reason === undefined ? {} : { reason: tool.curation.reason }) } }),
    };
}
export function connectorDefinitionToDetail(definition) {
    return {
        id: definition.id,
        name: definition.name,
        provider: definition.provider,
        category: definition.category,
        ...(definition.description === undefined ? {} : { description: definition.description }),
        status: definition.disabled ? 'disabled' : 'available',
        tools: definition.tools.map((tool) => toolDefinitionToDetail(tool)),
        allowedToolNames: [...definition.allowedToolNames],
        // Fall back to `allowedToolNames` when `curatedToolNames` isn't
        // explicitly set — non-Composio connectors don't go through a
        // dynamic merge, so for them the two are equivalent and the badge
        // is stable either way (issue #748).
        curatedToolNames: [...(definition.curatedToolNames ?? definition.allowedToolNames)],
        ...(definition.toolCount === undefined ? {} : { toolCount: definition.toolCount }),
        ...(definition.toolsNextCursor === undefined ? {} : { toolsNextCursor: definition.toolsNextCursor }),
        ...(definition.toolsHasMore === undefined ? {} : { toolsHasMore: definition.toolsHasMore }),
        ...(definition.featuredToolNames === undefined
            ? {}
            : { featuredToolNames: [...definition.featuredToolNames] }),
        ...(definition.minimumApproval === undefined ? {} : { minimumApproval: definition.minimumApproval }),
        auth: {
            provider: definition.authentication ?? (definition.provider === 'open-design' ? 'local' : 'oauth'),
            configured: definition.authentication === 'local' || definition.authentication === 'none',
        },
    };
}
//# sourceMappingURL=catalog.js.map