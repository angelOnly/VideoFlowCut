/**
 * OD Next handheld device shell ("phone frame") resolution.
 *
 * The prototype task profile ships three presentation shells as package
 * resources (iPhone, Android, platform-neutral). Open Design resolves which
 * one a task wants from two sources only — the project's platform metadata and
 * the user's own words — and never from the model's judgement: a missed
 * resolution still leaves every shell staged on disk for the rule card to point
 * at, while a resolved one additionally quotes the selected shell into the
 * stable request context so the Build cannot "forget to read" it.
 *
 * Pure: no filesystem, no daemon state. The daemon owns staging and the
 * run-finish observation.
 */
export type OdNextDevicePlatformV1 = 'ios' | 'android' | 'mobile-neutral';
export type OdNextDevicePlatformSourceV1 = 'request-text' | 'project-metadata';
export interface OdNextDevicePlatformResolutionV1 {
    platform: OdNextDevicePlatformV1;
    resolvedFrom: OdNextDevicePlatformSourceV1;
}
/** Project-relative directory the daemon stages the shells into. */
export declare const OD_NEXT_DEVICE_FRAME_ROOT: '.od-frames';
/** Shell file per platform, as staged under {@link OD_NEXT_DEVICE_FRAME_ROOT}. */
export declare const OD_NEXT_DEVICE_FRAME_FILES: Readonly<Record<OdNextDevicePlatformV1, string>>;
export declare const OD_NEXT_DEVICE_PLATFORMS: ReadonlyArray<OdNextDevicePlatformV1>;
/** Attribute every shipped shell carries on its outermost handset element. */
export declare const OD_NEXT_DEVICE_SHELL_MARKER: 'data-phone-shell';
/**
 * Structure-only layout primitives the prototype profile ships beside the
 * shells. Staged under the same root and quoted as the `layout-primitives`
 * fact, so the Build composes stacked text, truncation, rails, and screen
 * chrome from classes that already behave instead of re-deriving them.
 */
export declare const OD_NEXT_LAYOUT_PRIMITIVES_FILE: 'layout.css';
export declare const OD_NEXT_LAYOUT_PRIMITIVES_MARKER: 'OD-LAYOUT-PRIMITIVES v1';
/** Every file name the daemon may stage under {@link OD_NEXT_DEVICE_FRAME_ROOT}. */
export declare const OD_NEXT_MANAGED_RESOURCE_FILES: ReadonlyArray<string>;
/** Basename of a task resource when it is one the daemon stages, else null. */
export declare function odNextManagedResourceName(resourcePath: string): string | null;
/** The layout primitives stylesheet out of the task profile's resources, if shipped. */
export declare function selectOdNextLayoutPrimitivesCss(taskResources: ReadonlyArray<{
    path: string;
    text: string;
}> | null | undefined): string | null;
export type OdNextLayoutPrimitivesPresenceV1 = 'verbatim' | 'modified' | 'linked' | 'absent';
/**
 * How a delivered document carries the layout primitives: the block copied
 * byte-for-byte (whitespace aside), copied but altered, linked from the staged
 * file, or not at all. An observation, not a gate — it tells the rollout
 * whether a model tier reproduces a ~50-line block faithfully enough for
 * inlining, or whether the rule card should point at `<link>` instead.
 */
export declare function detectOdNextLayoutPrimitives(html: string | null | undefined, primitivesCss: string | null | undefined): OdNextLayoutPrimitivesPresenceV1;
/**
 * Classify the user's own words into a device platform, or null when the
 * brief does not name a phone app.
 */
export declare function detectOdNextDevicePlatformFromText(...texts: Array<string | null | undefined>): OdNextDevicePlatformV1 | null;
interface DevicePlatformMetadataLike {
    platform?: string | null | undefined;
    platformTargets?: ReadonlyArray<string> | null | undefined;
}
/**
 * Combine the project's platform metadata with the text classification.
 *
 * Precedence: an explicit platform in the user's words (iOS / Android) wins
 * over everything; then explicit mobile metadata (the Home "Mobile app" chip
 * stamps both mobile targets, which reads as platform-neutral); then the
 * platform-less text class, unless the project explicitly targets a non-phone
 * surface. Anything else is null — no shell is quoted and the rule card's
 * "no shell" row applies.
 */
export declare function resolveOdNextDevicePlatform(input: {
    metadata?: DevicePlatformMetadataLike | null | undefined;
    textPlatform?: OdNextDevicePlatformV1 | null | undefined;
}): OdNextDevicePlatformResolutionV1 | null;
/** Project-relative path of the staged shell for a platform. */
export declare function odNextDeviceFramePath(platform: OdNextDevicePlatformV1): string;
/** Basename → platform, for matching package resources to shells. */
export declare function odNextDevicePlatformForResource(resourcePath: string): OdNextDevicePlatformV1 | null;
export interface OdNextDeviceFrameContextV2 {
    platform: OdNextDevicePlatformV1;
    resolvedFrom: OdNextDevicePlatformSourceV1;
    /** Project-relative path of the selected shell. */
    shell: string;
    /** Every staged shell, so a Build can still switch platform on new evidence. */
    availableShells: string[];
    /** Source of the selected shell, quoted into the stable request context. */
    shellHtml: string;
}
/**
 * Pick the selected shell out of the task profile's resources.
 *
 * Returns null when the profile ships no shell for the platform — the fact is
 * then omitted rather than emitted with an empty body.
 */
export declare function selectOdNextDeviceFrameContextV2(input: {
    resolution: OdNextDevicePlatformResolutionV1 | null | undefined;
    taskResources: ReadonlyArray<{
        path: string;
        text: string;
    }> | null | undefined;
}): OdNextDeviceFrameContextV2 | null;
/**
 * Does a delivered document carry a shipped handset shell? Both the outer
 * marker and the inner content slot must be present — a document that kept
 * the attribute but dropped the scroll container has lost the shell contract.
 */
export declare function hasOdNextDeviceShell(html: string | null | undefined): boolean;
export {};
//# sourceMappingURL=od-next-device-frame.d.ts.map