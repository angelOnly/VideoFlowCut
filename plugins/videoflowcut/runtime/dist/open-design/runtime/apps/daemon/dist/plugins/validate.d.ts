import type { RegistryView } from '@open-design/plugin-runtime';
import { type DoctorReport, type Diagnostic } from './doctor.js';
import type { ConnectorProbe } from './connector-gate.js';
export interface ValidatePluginFolderInput {
    folder: string;
    registry?: RegistryView;
    connectorProbe?: ConnectorProbe;
}
export interface ValidatePluginFolderResult {
    ok: boolean;
    resolveErrors: string[];
    resolveWarnings: string[];
    doctor?: DoctorReport;
    folder: string;
}
export declare function validatePluginFolder(input: ValidatePluginFolderInput): Promise<ValidatePluginFolderResult>;
export declare function flattenValidationDiagnostics(result: ValidatePluginFolderResult): Diagnostic[];
