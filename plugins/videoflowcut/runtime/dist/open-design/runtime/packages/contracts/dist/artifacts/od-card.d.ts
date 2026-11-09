/** The card kinds. Mirrors the `type` attribute and the payload `kind`. */
export type OdCardKind = 'task-brief' | 'memory-applied' | 'verify-scorecard' | 'rule-proposal' | 'brand-browser-assist';
export declare const OD_CARD_KINDS: readonly OdCardKind[];
/** A single labelled fact row used by the task-brief card. */
export interface OdCardField {
    label: string;
    value: string;
}
/** PRE: the rewritten task brief. Rendered as a collapsed chip
 *  (`summary`) that expands to the full `fields` list. */
export interface OdCardTaskBrief {
    kind: 'task-brief';
    /** One-line chip label, e.g. "Polish the exec deck". */
    summary: string;
    /** Optional longer headline shown when expanded. */
    title?: string;
    /** The expanded brief: audience, tone, files, constraints, done-means, … */
    fields: OdCardField[];
    /** Optional trailing note shown under the fields. */
    note?: string;
}
/** A reference to a memory entry that shaped the turn. */
export interface OdCardMemoryRef {
    /** Memory type bucket — drives the chip's category dot. */
    type: 'user' | 'feedback' | 'project' | 'reference' | 'profile' | 'rule';
    /** Human display name of the entry. */
    name: string;
    /** Optional entry id for deep-linking into the settings panel. */
    id?: string;
}
/** A compact chip stating that memory shaped this turn + what was used. */
export interface OdCardMemoryApplied {
    kind: 'memory-applied';
    /** One-line summary, e.g. "Applied your profile and 2 rules". */
    summary: string;
    used: OdCardMemoryRef[];
}
export type OdCardRowStatus = 'pass' | 'fail' | 'fixed';
/** One rubric row in the verify scorecard. */
export interface OdCardScoreRow {
    /** The verified rule / check that was evaluated. */
    rule: string;
    status: OdCardRowStatus;
    /** What was wrong / what was fixed. Shown for fail + fixed rows. */
    note?: string;
}
/** POST: the self-verify scorecard. `status` is the rolled-up verdict. */
export interface OdCardVerifyScorecard {
    kind: 'verify-scorecard';
    /** Rolled-up verdict across the rows. */
    status: 'pass' | 'partial' | 'fail';
    /** Optional one-line summary, e.g. "5/6 checks passed · 1 auto-fixed". */
    summary?: string;
    rows: OdCardScoreRow[];
}
/** A verified rule proposed for the user to Keep / Edit / Discard. Approving
 *  it writes a `type:'rule'` memory entry that future verify passes enforce. */
export interface OdCardRuleProposal {
    kind: 'rule-proposal';
    /** Short display name for the rule. */
    name: string;
    /** One-line description / hook. */
    description?: string;
    /** The thing that must hold (human-readable). */
    assertion: string;
    /** How to check it — the rubric line a verify pass evaluates. */
    check: string;
    /** Why this was inferred (e.g. "you corrected the CTA color twice"). */
    rationale?: string;
}
/** A client-action card shown when brand extraction is blocked by an anti-bot
 *  wall: it opens/focuses the in-app browser tab so the user can solve the
 *  challenge, then the normal continue-extraction action reads the unblocked
 *  DOM and re-runs extraction from it. */
export interface OdCardBrandBrowserAssist {
    kind: 'brand-browser-assist';
    /** Brand whose extraction to re-run from the rendered page. */
    brandId: string;
    /** In-app browser tab to harvest from. Defaults to the brand browser tab. */
    browserTabId?: string;
    /** Page URL, shown to the user and used as the extraction base URL. */
    url?: string;
    /** Human label for the wall that blocked extraction (e.g. "Cloudflare"). */
    reason?: string;
}
export type OdCard = OdCardTaskBrief | OdCardMemoryApplied | OdCardVerifyScorecard | OdCardRuleProposal | OdCardBrandBrowserAssist;
export type OdCardSegment = {
    kind: 'text';
    text: string;
} | {
    kind: 'card';
    card: OdCard;
    raw: string;
};
/**
 * Split a final assistant text payload into ordered prose + card segments so
 * the renderer can interleave cards inline. Anything that doesn't parse as a
 * valid od-card stays in the prose stream (never swallowed).
 */
export declare function splitOnOdCards(input: string): OdCardSegment[];
/** True when the message contains at least one parseable od-card. */
export declare function hasOdCard(input: string): boolean;
/**
 * Drop a trailing, not-yet-closed `<od-card>` block from streaming text so the
 * chat doesn't flash raw `<od-card>{…` markup before the JSON finishes.
 * Returns the visible text plus whether such an open block existed.
 */
export declare function stripTrailingOpenOdCard(input: string): {
    text: string;
    hadOpenCard: boolean;
};
/**
 * Parse one od-card body. The `type` attribute wins for selecting the kind;
 * falls back to a `kind` field in the JSON. Returns null on any shape
 * mismatch so the caller keeps the raw text in the prose stream.
 */
export declare function tryParseOdCard(body: string, attrs: Record<string, string>): OdCard | null;
export interface ParsedFormAnswers {
    /** The form id from the header, e.g. "discovery". */
    id: string;
    /** Ordered label/value pairs; "(skipped)" answers are dropped. */
    pairs: OdCardField[];
}
/**
 * Parse a `[form answers — <id>]` block out of a user message. Returns null
 * when the message isn't a form-answer payload. Skipped answers ("(skipped)",
 * empty) are omitted so they don't overwrite known profile fields with blanks.
 */
export declare function parseFormAnswers(message: string): ParsedFormAnswers | null;
//# sourceMappingURL=od-card.d.ts.map