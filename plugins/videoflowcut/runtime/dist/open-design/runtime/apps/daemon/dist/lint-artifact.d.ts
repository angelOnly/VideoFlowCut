/**
 * Anti-slop linter for generated HTML artifacts.
 *
 * Runs grep-style checks against an artifact body and returns a list of
 * structured findings. P0 findings indicate the artifact is regressing
 * to AI-slop tropes (purple gradients, emoji feature icons, sans-serif
 * display, invented metrics, lorem-style filler) and are surfaced back
 * to the agent as a system message so it can self-correct on the next
 * turn. P1/P2 findings are advisories.
 *
 * The linter is deliberately greppy: cheap, deterministic, and trivial
 * to extend. It does NOT parse HTML — false positives are tolerable
 * because each finding includes a snippet so the agent can verify.
 *
 * Wired into the artifact save flow (POST /api/artifacts/save) and
 * exposed standalone at POST /api/artifacts/lint for the chat UI to
 * surface badges next to each saved artifact.
 */
import type { ArtifactLintFinding } from '@open-design/contracts';
export type LintFinding = ArtifactLintFinding;
/**
 * Run all checks against an HTML artifact body. Returns an array of
 * findings. The checks are intentionally independent so adding a new
 * one only means appending to this function.
 *
 * @param {unknown} rawHtml
 * @returns {LintFinding[]}
 */
export declare function lintArtifact(rawHtml: unknown): LintFinding[];
/**
 * Format findings as a Markdown block ready to splice into a system
 * reminder back to the agent. P0 findings appear first.
 *
 * @param {LintFinding[]} findings
 * @returns {string}
 */
export declare function renderFindingsForAgent(findings: LintFinding[]): string;
