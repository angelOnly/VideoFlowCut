import type { OrchestratorWorkspace, RunWorkspace } from '@open-design/contracts';
export declare function normalizeOrchestratorWorkspace(value: unknown): OrchestratorWorkspace | null;
export declare function parseOrchestratorWorkspace(value: unknown): {
    ok: true;
    value: OrchestratorWorkspace | null;
} | {
    ok: false;
    message: string;
};
export declare function isOrchestratorScratchWorkspace(metadata: unknown): boolean;
export declare function projectWorkspaceProvenance(metadata: unknown): RunWorkspace;
