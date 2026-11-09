const hostSynthesizedEmissions = new WeakSet();
/**
 * Retain host provenance on the live payload identity even when a consumer only
 * stores { event, data }. Weak references neither retain transcripts nor add
 * fields to SSE, persisted JSON, or Langfuse. Deserialized legacy events have
 * no provenance and keep the existing pairing behavior.
 */
export function withAcpEmissionProvenance(payload, meta) {
    if (meta?.hostSynthesized === true)
        hostSynthesizedEmissions.add(payload);
    return payload;
}
export function isHostSynthesizedAcpEmission(payload) {
    return hostSynthesizedEmissions.has(payload);
}
//# sourceMappingURL=emission-provenance.js.map