import type { ProjectShareHistoryResponse } from '@open-design/contracts';
import type { PublicFilePublicationScope } from './public-file-publication-store.js';
import { readVelaControlApiContext } from '../integrations/vela.js';
import { fetchVelaWorkspaceDirectory } from './vela-workspace-context.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
import { type AmrShareLink } from './public-share-viewer-url.js';
/** Project share history plus, per active publication, what AMR said about its
 * address. `amrLink` is daemon-internal: HTTP responses built from this state
 * present the link through the Viewer link rule instead of echoing it. */
export interface ProjectShareState extends ProjectShareHistoryResponse {
    publications: Array<ProjectShareHistoryResponse['publications'][number] & {
        amrLink?: AmrShareLink;
    }>;
}
export type ReadProjectShareState = (scope: Omit<PublicFilePublicationScope, 'filePath'>) => Promise<ProjectShareState>;
export declare function createVelaProjectShareState(options: {
    dataRoot: string;
    configuredEnv?: Record<string, string> | (() => Record<string, string>);
    readSession?: typeof readVelaControlApiContext;
    fetchDirectory?: typeof fetchVelaWorkspaceDirectory;
    runCommand?: typeof runPinnedVelaCommand;
    /** Persisted local authorship, never inferred from the current reader. */
    resolveLocalProjectOwner?: (projectId: string, workspaceId: string) => string | null;
    /** Read-only status probes must never create a missing creator catalog row. */
    registerLocallyOwnedProject?: boolean;
}): ReadProjectShareState;
/** Missing/unauthorized/error replies never become an empty history. */
export declare function parseProjectShareState(output: string, projectId: string): ProjectShareState;
export declare class UnboundFileShareIdentityError extends Error {
    constructor();
}
/** History contains retired aliases at reused paths. Only the current lifetime
 * may drive file status/resume; an unbound live share is neither absence nor
 * authority to infer/migrate its identity. Existing project history/stop stays usable. */
export declare function currentFileSharePublication(history: ProjectShareState, filePath: string, sourceFileId?: string): ({
    sourceFilePath: string;
    sourceFileId?: string;
    slug: string;
    status: 'active' | 'stopped';
} & {
    amrLink?: AmrShareLink;
}) | undefined;
