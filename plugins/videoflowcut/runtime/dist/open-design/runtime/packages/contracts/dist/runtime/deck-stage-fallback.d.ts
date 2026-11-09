export declare const DECK_SLIDE_SELECTOR: string;
export declare const DECK_EXPLICIT_SLIDE_SELECTOR: string;
export declare const DECK_SCREEN_SLIDE_SELECTOR = "[data-screen-label]";
export declare const DECK_LEGACY_SCREEN_SLIDE_SELECTOR = "section[data-screen-label]";
export declare const DECK_LEGACY_SCREEN_LABEL_RE_SOURCE = "^\\s*(\\d{1,3})(?:\\s|[.)\\u00b7:_-]|$)";
/**
 * Bare `data-screen-label` is also used by prototype annotations. Legacy decks
 * without an explicit stage are distinguishable because each page is a
 * numbered section (`01 Cover`, `02 Agenda`, ...). Callers must additionally
 * require at least two of these sections to share one direct parent.
 */
export declare function legacyDeckScreenNumber(label: string | null | undefined): number | null;
/**
 * Prefer direct children of known deck containers before using generic marker
 * fallbacks. `body` is deliberately not a container: `data-screen-label` is
 * also the annotation identity used by ordinary prototypes, so one annotated
 * body descendant is not sufficient evidence of a deck.
 */
export declare const DECK_STRUCTURED_SLIDE_SELECTOR: string;
export declare function htmlUsesDeckStageElement(html: string): boolean;
export declare function injectDeckStageFallback(html: string): string;
//# sourceMappingURL=deck-stage-fallback.d.ts.map