export function deriveRunTelemetryExportExpectation(prefs, hasEffectiveSink) {
    if (prefs.metrics !== true) {
        return {
            expected: false,
            status: 'not_expected',
            reason: 'metrics_consent_off',
        };
    }
    if (prefs.content !== true) {
        return {
            expected: false,
            status: 'not_expected',
            reason: 'content_consent_off',
        };
    }
    if (!hasEffectiveSink) {
        return {
            expected: false,
            status: 'not_expected',
            reason: 'missing_sink_config',
        };
    }
    return { expected: true, status: 'queued' };
}
export function exportRunObservation(exporter, facts, options) {
    return exporter.exportRun(facts, options);
}
//# sourceMappingURL=run-exporter.js.map