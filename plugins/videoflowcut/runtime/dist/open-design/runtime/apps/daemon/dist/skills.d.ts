import type Database from "better-sqlite3";
import type { SkillCritiquePolicy } from "./critique/rollout.js";
type SqliteDb = Database.Database;
export declare const SKILL_ID_ALIASES: Readonly<{
    "editorial-collage": "open-design-landing";
    "editorial-collage-deck": "open-design-landing-deck";
    "taste-skill": "design-taste-frontend";
}>;
type SkillMode = "utility" | "image" | "video" | "audio" | "deck" | "design-system" | "template" | "prototype";
type SkillSurface = "web" | "image" | "video" | "audio";
type SkillPlatform = "desktop" | "mobile" | null;
export type SkillSource = "user" | "built-in";
export interface SkillInfo {
    id: string;
    name: string;
    displayName?: Record<string, string>;
    description: string;
    descriptionI18n?: Record<string, string>;
    triggers: unknown[];
    mode: SkillMode;
    surface: SkillSurface;
    source: SkillSource;
    craftRequires: string[];
    platform: SkillPlatform;
    scenario: string;
    category: string | null;
    previewType: string;
    designSystemRequired: boolean;
    defaultFor: string[];
    upstream: string | null;
    featured: number | null;
    fidelity: "wireframe" | "high-fidelity" | null;
    speakerNotes: boolean | null;
    animations: boolean | null;
    examplePrompt: string;
    examplePromptI18n?: Record<string, string>;
    aggregatesExamples: boolean;
    /**
     * Per-skill Critique Theater override declared via `od.critique.policy`
     * in the skill's SKILL.md frontmatter. The daemon's rollout resolver
     * uses this as the highest-priority signal when deciding whether to
     * wire the critique pipeline for a generation: `required` forces the
     * panel on regardless of project / env / phase defaults, `opt-out`
     * forces it off, `opt-in` lets the panel run only at M2+ rollout
     * phases, `null` means the skill has no opinion and the lower-priority
     * tiers (project override, env override, phase default) decide.
     */
    critiquePolicy: SkillCritiquePolicy;
    body: string;
    dir: string;
    /**
     * True for a skill materialized locally from a TEAMMATE's team share — the
     * puller's copy, never the sharer's own (mirrors design-systems'
     * `metadata.json` `teamSynced` flag; see `isTeamSyncedUserDesignSystem` in
     * design-systems/index.ts). Sourced from the generic `workspace_resources`
     * binding's `visibility` column (`'team'` — written by `syncSharedTeamSkill`'s
     * `markTeamSynced` in server.ts), so it only appears when the caller asked to
     * be workspace-scoped (`db` + `workspaceId` both passed to `listSkills`).
     * Without this, a skill pulled from the team was indistinguishable from one
     * the caller authored, and unsharing it team-side let it silently reappear
     * in "Personal" instead of just leaving the Team scope.
     */
    teamSynced?: boolean;
}
export interface DerivedSkillIdParts {
    parentId: string;
    childKey: string;
}
export declare function resolveSkillId(id: unknown): unknown;
export declare function findSkillById(skills: unknown, id: unknown): SkillInfo | undefined;
export interface ListSkillsOptions {
    /**
     * Narrow the listing to skills visible from this workspace (see
     * `workspace_resources` in `db.ts`). Requires `db` — both are optional so
     * legacy callers can deliberately keep an unscoped local catalog. HTTP
     * resource routes and project/run prompt resolution pass the exact
     * Workspace plus creator member.
     */
    db?: SqliteDb;
    workspaceId?: string | null;
    workspaceMemberId?: string | null;
}
export declare function listSkills(skillsRoots: string | readonly string[], options?: ListSkillsOptions): Promise<SkillInfo[]>;
export declare function resolveDerivedExamplePath(parentDir: string, childKey: string): string | null;
export declare function splitDerivedSkillId(id: unknown): DerivedSkillIdParts | null;
/**
 * Add the same staged-root contract to every file-backed skill source.
 *
 * Global skills already flow through this helper while the registry is
 * scanned. Plugin-local SKILL.md files are loaded through a separate path, so
 * that loader calls this export too; otherwise their companion files are
 * staged correctly but the model is never told where the staged copy lives.
 */
export declare function skillBodyWithRootPreamble(body: string, dir: string): Promise<string>;
/**
 * Coerce `od.critique.policy` from SKILL.md frontmatter into the
 * three-value union the rollout resolver expects. Anything unrecognised
 * resolves to `null` (no opinion), which falls through to the
 * project / env / phase default tiers. The frontmatter value is
 * authored as a YAML scalar:
 *
 *   od:
 *     critique:
 *       policy: required   # or 'opt-in', 'opt-out'
 */
export declare function normalizeCritiquePolicy(value: unknown): SkillCritiquePolicy;
export type SkillImportErrorCode = "BAD_REQUEST" | "CONFLICT" | "NOT_FOUND" | "INTERNAL_ERROR";
export declare class SkillImportError extends Error {
    readonly code: SkillImportErrorCode;
    constructor(code: SkillImportErrorCode, message: string);
}
export declare function slugifySkillName(name: unknown): string;
export interface SkillImportInput {
    name?: unknown;
    description?: unknown;
    body?: unknown;
    triggers?: unknown;
}
export interface SkillImportResult {
    id: string;
    slug: string;
    dir: string;
}
export declare function importUserSkill(userSkillsRoot: string, input: SkillImportInput): Promise<SkillImportResult>;
export interface SkillUpdateInput {
    name: string;
    description?: unknown;
    body?: unknown;
    triggers?: unknown;
    sourceDir?: string;
}
export declare function updateUserSkill(userSkillsRoot: string, input: SkillUpdateInput): Promise<SkillImportResult>;
export interface SkillFileEntry {
    path: string;
    kind: "file" | "directory";
    size: number | null;
}
export declare function listSkillFiles(skillDir: string): Promise<SkillFileEntry[]>;
export declare function deleteUserSkill(userSkillsRoot: string, id: string): Promise<void>;
export {};
