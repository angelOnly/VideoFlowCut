export interface CommentTargetTitleInput {
    elementId: string;
    label: string;
    text: string;
    htmlHint: string;
}
export type CommentTargetKind = 'pin' | 'image' | 'control' | 'link' | 'text' | 'section' | 'page' | 'area';
export interface CommentTargetTitle {
    kind: CommentTargetKind;
    name?: string;
}
/**
 * Shared presentation rule for OD and public-share consumers (no DOM/React/I/O).
 * Pin/page semantics first; otherwise explicit data-screen-label, then the
 * persisted element-text snapshot, then a localized type supplied by the UI.
 * label/elementId are classification hints, NEVER names. text is element text,
 * not the comment body (PreviewComment.note). htmlHint may be opening-tag-only;
 * do not pretend it contains recoverable visible text or evaluate its markup.
 * Normalize names to one line; UI owns width-dependent ellipsis, not locale-
 * dependent arbitrary character clipping. Render name as text, never HTML.
 */
export declare function resolveCommentTargetTitle(comment: CommentTargetTitleInput): CommentTargetTitle;
//# sourceMappingURL=comment-target-title.d.ts.map