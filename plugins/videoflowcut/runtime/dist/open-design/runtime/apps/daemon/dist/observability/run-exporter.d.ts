import type { TelemetryPrefs } from '../app-config.js';
/**
 * Protocol-neutral eligibility state for exporting one completed run.
 *
 * The daemon deliberately keeps this separate from the legacy Langfuse
 * delivery field names. Future normalizers and exporters can depend on this
 * seam without importing a provider wire contract.
 */
export type RunTelemetryExportExpectation = {
    expected: false;
    status: 'not_expected';
    reason: 'metrics_consent_off' | 'content_consent_off' | 'missing_sink_config';
} | {
    expected: true;
    status: 'queued';
};
export declare function deriveRunTelemetryExportExpectation(prefs: TelemetryPrefs, hasEffectiveSink: boolean): RunTelemetryExportExpectation;
/**
 * Exporter boundary between daemon-owned observation facts and a concrete
 * provider adapter. Facts, options, and delivery state remain generic so the
 * coordinator and future normalized observation layer never need provider
 * event types.
 */
export interface RunObservationExporter<TFacts, TOptions, TDelivery> {
    readonly id: string;
    exportRun(facts: TFacts, options: TOptions): Promise<TDelivery>;
}
export declare function exportRunObservation<TFacts, TOptions, TDelivery>(exporter: RunObservationExporter<TFacts, TOptions, TDelivery>, facts: TFacts, options: TOptions): Promise<TDelivery>;
