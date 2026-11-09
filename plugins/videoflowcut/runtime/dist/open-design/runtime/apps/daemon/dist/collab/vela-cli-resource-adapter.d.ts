import { type WorkspaceCollabContext } from '@open-design/contracts';
import { projectResourceIdFor } from '../integrations/vela-team-projects.js';
import type { ResourcePublishAdapter } from './publish-scheduler.js';
import type { ResourceHubPrincipal } from './resource-principal.js';
/**
 * Every entry name a `vela resource push` snapshot skips.
 *
 * Two families with DIFFERENT matching semantics, which is why they are not
 * one flat list:
 *
 * - {@link MEMBER_MIRROR_EXCLUDED_ENTRIES} — secret-bearing entries
 *   (credentials, tool state, OpenDesign private bookkeeping). These must
 *   never leave the author's machine whether they are a file, a directory, or
 *   a symlink, so they are sent bare and match any entry of that name.
 * - {@link IGNORED_PROJECT_DIR_NAMES} — generated/installed/cache trees the
 *   owner's own file list already hides. The owner hides them as DIRECTORIES
 *   only (`collectFiles` consults `shouldSkipDir` inside its `isDirectory()`
 *   branch), so a bare name here would over-match: a project holding a regular
 *   file called `target` or `out` would have it silently dropped from every
 *   member mirror while the owner still sees it. These are therefore sent with
 *   a trailing slash, the directory-only form.
 *
 * The trailing slash is also the compatibility seam. A Vela build that does
 * not yet understand it compares `"dist/"` against entry names that never
 * contain a slash, so the rule matches nothing and the tree is published in
 * full — the pre-optimization payload, never a missing file. Once the CLI
 * understands the form, the same push starts skipping those directories with
 * no further OpenDesign change. A new `--exclude-dir` flag could NOT degrade
 * this way: older CLIs reject unknown flags, which would fail every publish.
 */
export declare const MEMBER_MIRROR_PUSH_EXCLUDED_ENTRIES: readonly string[];
/** The same entry rules used by published snapshots, local hashes and preservation. */
export declare function isExcludedProjectContentEntry(name: string, isDirectory: boolean): boolean;
/** Run `vela resource <args>` and resolve its stdout. */
export type RunVelaResource = (args: string[], workspaceId?: string) => Promise<string>;
export interface VelaResourcePullBatchRequest {
    key: string;
    kind: 'design_system' | 'plugin' | 'skill';
    resourceId: string;
    dir: string;
    ref: string;
}
export interface VelaCliResourceAdapterOptions {
    /** The project's source directory to publish (managed-project root). */
    resolveProjectDir: (projectId: string) => string | Promise<string>;
    /** Optional resource-index metadata for team project discovery/cards. */
    describeProject?: (projectId: string) => Record<string, unknown> | null | Promise<Record<string, unknown> | null>;
    /** Where a member materializes pulled content. Defaults to the project dir. */
    resolvePullDir?: (projectId: string) => string | Promise<string>;
    /** (projectId, principal) → hub resourceId. Colon-free (routed as a path param). */
    resourceIdFor?: (projectId: string, principal?: ResourceHubPrincipal | null) => string;
    /** Exact server-backed root; missing authority throws and has no legacy fallback. */
    resolveResourceId?: (projectId: string, principal?: ResourceHubPrincipal | null) => string | Promise<string>;
    /** Hub resource kind (project / design_system / plugin / skill). */
    kind?: string;
    /**
     * Whether the caller currently has a team identity. Null/false → no-op, the
     * same single-identity gate the SDK adapter applies, so a personal / signed-out
     * session never publishes. The CLI itself resolves the concrete member/team
     * from the vela session; this only gates whether we invoke it at all.
     */
    hasTeamIdentity: (principal?: ResourceHubPrincipal | null) => boolean | Promise<boolean>;
    /** Injectable child-process runner; defaults to spawning the vela binary. */
    run?: RunVelaResource;
}
export interface VelaResourceSnapshotRecord {
    slug: string;
    name: string;
    kind: string;
    versionId: string;
    createdAt: string;
}
export declare function createVelaCliResourceAdapter(options: VelaCliResourceAdapterOptions): ResourcePublishAdapter;
export declare function projectResourceIdsFor(projectId: string, principal?: ResourceHubPrincipal | null, resourceIdFor?: typeof projectResourceIdFor): string[];
export declare function isMissingResourceError(error: unknown): boolean;
/**
 * True when the hub itself answered `resource_not_found` — its tombstone gate
 * refuses every resource-scoped call once `resources.deleted_at` is set (and
 * answers the same for an id that never existed). Deliberately NARROWER than
 * {@link isMissingResourceError}: `ref_not_found` / bare-404 shapes can mean
 * "live resource with nothing published yet", which must never be read as
 * "this resource was retracted".
 */
export declare function isRetractedHubResourceError(error: unknown): boolean;
/** The push wire ID identifies this upload; display version/ref are not identities. */
export declare function parseVelaPushVersionId(stdout: string): string;
export declare function parseVelaResourceSnapshot(stdout: string): VelaResourceSnapshotRecord | null;
export declare const runVelaResourceCommand: RunVelaResource;
/** Run one workspace-scoped batch through stdin to avoid argv size limits. */
export declare function runVelaResourceBatchCommand(requests: readonly VelaResourcePullBatchRequest[], workspaceId: string): Promise<string>;
/**
 * Whether this run should drive resource sharing through the `vela resource` CLI
 * transport instead of the in-process SDK. An explicit `OD_RESOURCE_TRANSPORT`
 * wins; otherwise the Vela-backed team/collab modes imply the same CLI identity
 * for bytes so the daemon does not publish catalog rows through Vela while
 * leaving project content on the local stub.
 */
export declare function shouldUseVelaCliResourceTransport(env?: NodeJS.ProcessEnv): boolean;
/**
 * Derive the resource-identity gate from the one workspace context: does this
 * daemon's live vela session currently belong to an ACTIVE member of the
 * project's team?
 *
 * `workspaceContextHasTeamIdentity` alone is not enough here. It only proves
 * the context can ADDRESS the resource hub — `workspaceType`/`workspaceId`/
 * `workspaceMemberId` all resolve — and those fields keep resolving for a
 * member B has already removed from the team; only `memberStatus` flips to
 * `'removed'`. The publish/pull/syncLatest/unpublish operations this gates all
 * shell out to `vela resource …`, authenticated by the same vela CLI login
 * session AMR uses, which does not itself re-derive OD's team membership per
 * call. Without the explicit `memberStatus` check below, a member removed
 * from a team while their daemon keeps running would keep passing this gate
 * on every project they used to own, and the file watcher in
 * `collab-publish-watcher.ts` would keep pushing their local edits to the
 * team's resource hub through a vela session that is still locally valid.
 *
 * `hasTeamIdentity` is re-evaluated fresh on every publish/pull/syncLatest/
 * unpublish attempt. The runtime supplies the immutable principal captured by
 * the request or project watch; it never re-targets through daemon-global
 * active Workspace state.
 */
export declare function contextHasTeamIdentity(context: WorkspaceCollabContext | null): boolean;
