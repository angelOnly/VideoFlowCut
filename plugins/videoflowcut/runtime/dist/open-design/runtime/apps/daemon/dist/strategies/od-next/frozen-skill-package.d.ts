import type Database from 'better-sqlite3';
import { type SkillInfo } from '../../skills.js';
type SqliteDb = Database.Database;
export declare const OD_NEXT_FROZEN_SKILL_PACKAGE_SCHEMA: 'open-design.od-next-frozen-skill-package/v1';
export interface FrozenSkillFileV1 {
    path: string;
    bytesBase64: string;
    byteLength: number;
    digest: string;
}
export interface FrozenSkillSelectionV1 {
    canonicalId: string;
    name: string;
    body: string;
    bodyByteLength: number;
    bodyDigest: string;
    files: FrozenSkillFileV1[];
}
export interface FrozenSkillPackageV1 {
    schema: typeof OD_NEXT_FROZEN_SKILL_PACKAGE_SCHEMA;
    identity: string;
    selections: FrozenSkillSelectionV1[];
}
interface FrozenSkillCaptureIoHooks {
    /** Internal deterministic race hook used only by focused filesystem tests. */
    afterOpen?: (filePath: string) => void | Promise<void>;
}
export declare class InvalidFrozenSkillPackageError extends Error {
    constructor(message: string);
}
export declare function normalizeSelectedSkillIds(input: {
    skillId?: unknown;
    skillIds?: unknown;
}): string[];
export declare function captureFrozenSkillPackage(input: {
    skillId?: unknown;
    skillIds?: unknown;
    catalog: readonly SkillInfo[];
    ioHooks?: FrozenSkillCaptureIoHooks;
}): Promise<FrozenSkillPackageV1>;
/**
 * Resolve explicitly selected Skill ids against a catalogue listing.
 *
 * Split out from capture so a caller that mixes selection channels can decide
 * what an unavailable Skill means for it. Capture itself has no opinion: it
 * freezes the entries it is handed.
 */
export declare function resolveSelectedCatalogSkills(input: {
    skillId?: unknown;
    skillIds?: unknown;
    catalog: readonly SkillInfo[];
}): SkillInfo[];
/**
 * Capture one package from every channel a session selected a Skill through.
 *
 * A task has exactly one frozen package, so the channels have to converge
 * before capture rather than each producing a package of its own: the package
 * identity is a digest over the whole selection list, and two packages would
 * mean two identities for one task. `skills` come from the Skill catalogue
 * (the composer's @-mention popover, `od run --skill`); `sources` are
 * skill-like folders the caller resolved itself (an official example card).
 *
 * Order is authority order, and it survives into `skill_names` and into the
 * body order the model reads: a Skill the user named explicitly precedes
 * material that came along with a card they picked.
 */
export declare function captureFrozenSkillPackageFromSelections(input: {
    skills?: readonly SkillInfo[] | undefined;
    sources?: readonly ResolvedFrozenSkillSourceV1[] | undefined;
    ioHooks?: FrozenSkillCaptureIoHooks | undefined;
}): Promise<FrozenSkillPackageV1>;
/**
 * A skill-like folder the caller has already resolved, for entry points whose
 * material does not live in a Skill catalogue.
 *
 * The official example cards are the first such entry point. Their folders sit
 * under `plugins/_official/examples/`, deliberately outside the skill-like
 * roots, so the 183 shipped examples never appear in the Skill picker or in
 * any other consumer of that catalogue. Capture therefore takes the resolved
 * folder rather than an id plus a catalogue to look it up in — a new entry
 * point adds a resolver, not a catalogue root.
 *
 * The canonical id is ADOPTED from the folder's own SKILL.md, by exactly the
 * rule `listSkills` uses (`frontmatter.name` falling back to the folder
 * basename, then alias resolution). It is deliberately NOT the caller's
 * catalogue id: those are two namespaces. An example card's plugin id is
 * `example-web-prototype` while its SKILL.md declares `web-prototype`, so
 * forcing the plugin id onto the selection would reject every shipped example.
 * The plugin id belongs on `metadata.exampleBinding.pluginId`; the id the model
 * sees in `skill_names` is the Skill's own name.
 *
 * Adoption does not weaken the freeze. The catalogue entry point cross-checks
 * the declared name because the caller's id came from an earlier, separate
 * listing pass — that check catches a folder swapped between listing and
 * capture. Here the caller hands over the directory itself, and the read is
 * already bracketed by the realpath / `O_NOFOLLOW` / dev-ino fencing below, so
 * the manifest is read inside the fence rather than claimed outside it.
 * `expectedManifestDigest` is the caller's optional stronger check.
 */
export interface ResolvedFrozenSkillSourceV1 {
    /** Absolute path of the directory that holds SKILL.md. */
    dir: string;
    /** Display name recorded on the selection and used as its body heading. */
    name: string;
    /**
     * sha256 (`sha256:<hex>`) of the raw SKILL.md bytes the caller read when it
     * resolved this source. When present, capture refuses a manifest whose bytes
     * no longer reproduce it: the caller's binding pinned a specific example and
     * a changed manifest is a stale binding, not a silent substitution. Omit it
     * only when the caller never recorded one.
     */
    expectedManifestDigest?: string;
    /** Human label used in this source's error messages. */
    label?: string;
}
/**
 * Capture already-resolved skill-like folders into a frozen package.
 *
 * Sibling of `captureFrozenSkillPackage`: same bounds, same digests, same
 * `O_NOFOLLOW` / TOCTOU guarantees, same package identity — only the way a
 * selection is named differs (see `ResolvedFrozenSkillSourceV1`).
 */
export declare function captureFrozenSkillPackageFromSources(input: {
    sources: readonly ResolvedFrozenSkillSourceV1[];
    ioHooks?: FrozenSkillCaptureIoHooks;
}): Promise<FrozenSkillPackageV1>;
export declare function createEmptyFrozenSkillPackage(): FrozenSkillPackageV1;
export declare function migrateFrozenSkillPackageStore(db: SqliteDb): void;
export declare function insertFrozenSkillPackage(db: SqliteDb, taskExecutionId: string, frozen: FrozenSkillPackageV1): void;
export declare function getFrozenSkillPackage(db: SqliteDb, taskExecutionId: string): FrozenSkillPackageV1;
/**
 * The frozen Skill roster for the Bundle's `context/frozen_skill_package` slot:
 * identity, digests and the side-file roster, with no Skill body.
 *
 * 可读取的技能入口单独放在 `session_skills/user_selected_skills`；
 * 正文只保存在同版本冻结文件中，由作者按需读取。
 *
 * Returns '' when the user selected no Skill: an empty roster carries only a
 * schema string and a digest of nothing, so the slot is omitted rather than
 * emitted empty — the same no-empty-slot rule the spec mandates for
 * `attachments`. The package identity itself stays verifiable through the
 * persisted strategy task record.
 */
export declare function renderFrozenSkillRosterContext(frozen: FrozenSkillPackageV1): string;
/** 只提供冻结版本入口；正文和引用文件由作者按任务读取。 */
export declare function resolveFrozenSkillBundleEntries(frozen: FrozenSkillPackageV1): {
    skillNames: string[];
    body: string;
} | null;
export declare function materializeFrozenSkillPackage(input: {
    frozen: FrozenSkillPackageV1;
    cwd: string;
}): Promise<string[]>;
export {};
