import { type OdNextLayoutPrimitivesPresenceV1, type AppliedPluginSnapshot, type OdNextDevicePlatformResolutionV1 } from '@open-design/contracts';
export interface OdNextTaskResource {
    path: string;
    text: string;
}
export declare class InvalidOdNextDeviceFrameRootError extends Error {
    constructor(message: string);
}
/**
 * Ownership record the materializer keeps beside the shells it wrote.
 *
 * `.od-frames/` is a name this feature introduces inside a directory the user
 * owns, so an imported or older project can already hold a folder of that name
 * with arbitrary files in it. The manifest is the only thing that makes a file
 * ours, and it only ever makes it *provisionally* ours: a name has to be listed
 * here AND the bytes on disk have to still match the digest we recorded, or the
 * file is treated as the user's. That covers both a user's own `iphone.html`
 * that happens to share a managed name and a shell we staged that the user has
 * since edited.
 *
 * The control file is itself a name inside the user's directory, so it is
 * subject to the same rule: when it is occupied by something we did not write,
 * there is no trustworthy ownership record and the directory is left alone
 * entirely. "Something we did not write" is decided against what this
 * materializer can ever produce — a key set inside {@link MANAGED_SHELL_FILES}
 * and 64-hex digests. A manifest naming anything else is not a manifest of
 * ours, and must not be allowed to nominate that name for deletion.
 */
export declare const OD_NEXT_DEVICE_FRAME_MANIFEST: '.od-next-device-frames.json';
export interface OdNextDeviceFrameStagingResult {
    /** Project-relative paths of the shells now staged and daemon-owned. */
    staged: string[];
    /**
     * Managed names left alone because the bytes on disk are not provably ours:
     * a file we never wrote, a shell edited since we staged it, or — when the
     * control file itself is occupied — every managed name under the root.
     */
    skipped: string[];
}
/**
 * Load the selected task profile's declared resources for an applied OD Next
 * snapshot, re-verified against the snapshot's package identity. Returns an
 * empty list for non-strategy snapshots and for profiles that ship nothing.
 */
export declare function loadOdNextTaskResourcesForSnapshot(input: {
    bundledPluginsDir: string;
    snapshot: Pick<AppliedPluginSnapshot, 'pluginId' | 'strategy'> | null | undefined;
}): Promise<OdNextTaskResource[]>;
/**
 * Stage the device shells into `<cwd>/.od-frames/` so the rule card's
 * `.od-frames/<shell>.html` paths resolve for every prototype run, whether or
 * not a platform was resolved up front.
 *
 * Non-destructive by construction. A managed name is written or removed only
 * when the manifest claims it *and* the bytes on disk still hash to what we
 * recorded there, so neither a pre-existing `iphone.html` nor a shell the user
 * edited after we staged it is ever overwritten; both are reported as skipped
 * and drop out of the manifest, which hands the name back to the user for good.
 * If the manifest name is itself occupied by something we did not write, the
 * whole directory is left alone. Unrelated files are never written or deleted.
 * The root is refused when it is a symlink or a non-directory, mirroring the
 * frozen Skill guard. In every skipped case the quoted `device-frame-shell`
 * fact still carries the shell source, so the run keeps working.
 */
export declare function materializeOdNextDeviceFrames(input: {
    cwd: string;
    resources: ReadonlyArray<OdNextTaskResource>;
}): Promise<OdNextDeviceFrameStagingResult>;
export interface OdNextDeviceShellObservation {
    platform: OdNextDevicePlatformResolutionV1['platform'];
    resolvedFrom: OdNextDevicePlatformResolutionV1['resolvedFrom'];
    entryFile: string;
    shellPresent: boolean;
}
/**
 * After a prototype run delivered, record whether the canonical entry carries
 * a shipped handset shell. Observation only: this branch has no repair loop
 * to send the finding back to, so the value feeds run analytics and the
 * daemon log, where the rollout can measure how often a resolved platform
 * actually reached the artifact. Null when nothing was resolved or the entry
 * cannot be read.
 */
export declare function observeOdNextDeviceShell(input: {
    projectRoot: string;
    entryFile: string | null | undefined;
    resolution: OdNextDevicePlatformResolutionV1 | null | undefined;
}): Promise<OdNextDeviceShellObservation | null>;
export interface OdNextLayoutPrimitivesObservation {
    entryFile: string;
    presence: OdNextLayoutPrimitivesPresenceV1;
}
/**
 * Did the delivered entry carry the staged layout primitives, and how? Pure
 * observation for run analytics (see {@link observeOdNextDeviceShell}); it
 * decides nothing about the run.
 */
export declare function observeOdNextLayoutPrimitives(input: {
    projectRoot: string;
    entryFile: string | null | undefined;
    primitivesCss: string | null | undefined;
}): Promise<OdNextLayoutPrimitivesObservation | null>;
