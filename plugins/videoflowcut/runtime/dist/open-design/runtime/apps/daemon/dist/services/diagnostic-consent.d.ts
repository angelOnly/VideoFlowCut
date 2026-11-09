import type { AutomaticDiagnosticSource, LogSource } from '@open-design/diagnostics';
/** File watermarks prevent a later opt-in from backfilling text produced while opted out. */
export declare class DiagnosticConsentFence {
    needsBaseline: boolean;
    private state;
    private readonly file;
    constructor(directory: string, enabled: boolean);
    private persist;
    change(enabled: boolean): boolean;
    /** Adds a boundary at the current size for existing files that no baseline covered yet. */
    extend(sources: LogSource[]): Promise<void>;
    baseline(sources: LogSource[]): Promise<void>;
    /**
     * Remembers logs re-created under a baselined path (Windows tunneling) as they are
     * seen at startup, so a session without any incident still keeps its log admitted
     * once the next launch rotates it to another path. Identities no longer present are
     * dropped; `sources` must be the complete baseline set.
     */
    observe(sources: LogSource[]): Promise<void>;
    apply(sources: LogSource[]): Promise<AutomaticDiagnosticSource[]>;
}
