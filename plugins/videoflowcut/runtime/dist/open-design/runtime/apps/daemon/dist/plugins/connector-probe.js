function toGateStatus(status) {
    if (status === 'connected')
        return 'connected';
    if (status === 'available')
        return 'pending';
    return 'unavailable';
}
function catalogEntryFor(service, definition) {
    const status = service.getStatus(definition);
    return {
        id: definition.id,
        status: toGateStatus(status.status),
        ...(status.accountLabel === undefined ? {} : { accountLabel: status.accountLabel }),
        allowedToolNames: definition.allowedToolNames.slice(),
    };
}
export function buildConnectorProbe(service) {
    const entries = new Map();
    for (const definition of service.listFastDefinitions()) {
        entries.set(definition.id, catalogEntryFor(service, definition));
    }
    return {
        get(connectorId) {
            return entries.get(connectorId);
        },
    };
}
//# sourceMappingURL=connector-probe.js.map