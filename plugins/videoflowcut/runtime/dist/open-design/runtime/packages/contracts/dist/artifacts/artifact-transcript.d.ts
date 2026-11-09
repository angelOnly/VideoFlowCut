import type { ChatMessage } from '../api/chat.js';
export declare function parseArtifactAttrs(raw: string): Record<string, string>;
/**
 * A project file that an artifact save confirmed wrote to disk, as recorded on
 * the assistant message after a successful `persistArtifact` (producedFiles).
 * `identifier` is the artifact-manifest `metadata.identifier` when present.
 */
export interface PersistedArtifactFileRef {
    name: string;
    identifier?: string | undefined;
}
/**
 * Find the persisted project file this artifact block was saved to, or null
 * when persistence cannot be confirmed. Match order mirrors
 * `findExistingArtifactProjectFile`: manifest identifier first (strongest —
 * survives the `-2`/`-3` collision-suffix renames), then the derived
 * `<slug><ext>` / `<slug>-<n><ext>` file names.
 */
export declare function matchPersistedArtifactFile(attrs: Record<string, string>, persistedFiles: ReadonlyArray<PersistedArtifactFileRef>): PersistedArtifactFileRef | null;
/**
 * Replace every real `<artifact …>…</artifact>` block whose body is CONFIRMED
 * persisted to a project file with a one-line summary, for use in the
 * multi-turn transcript sent to the agent.
 *
 * Once the artifact lives on disk the agent reads/edits it from there via
 * grep/sed, never from this transcript copy, so re-sending the whole HTML each
 * turn is pure waste — a 30K-token artifact balloons every subsequent turn's
 * input. The summary keeps the metadata the agent needs (`identifier` /
 * `title` / `type` and the saved file name) and points it at the on-disk file.
 *
 * Persistence is confirmed against `persistedFiles` — the producedFiles
 * recorded on the assistant message after a successful save. `persistArtifact`
 * has explicit refusal (validateHtmlArtifact) and write-failure
 * (writeProjectTextFile → null) branches; on those paths the transcript copy
 * is the ONLY surviving artifact body, so an unmatched block is left verbatim
 * and a
 * follow-up turn can still inspect or repair it.
 *
 * Uses the same skip-range / real-open detection as the artifact renderer, so
 * a literal `<artifact …>` recited inside a code fence (a user or assistant
 * explaining the protocol) is left intact — only genuine protocol blocks are
 * summarized. Malformed / still-streaming blocks (real open, no real close)
 * are left untouched so an incomplete body's only copy survives.
 */
export declare function summarizeArtifactsForTranscript(content: string, persistedFiles: ReadonlyArray<PersistedArtifactFileRef>): string;
export declare function persistedArtifactFilesOf(message: Pick<ChatMessage, 'producedFiles'>): PersistedArtifactFileRef[];
//# sourceMappingURL=artifact-transcript.d.ts.map