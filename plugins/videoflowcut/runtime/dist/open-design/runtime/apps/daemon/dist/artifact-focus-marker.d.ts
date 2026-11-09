/**
 * Streaming half of the `<od-focus …/>` marker (shape lives in
 * `@open-design/contracts`, `api/artifact-focus-marker`).
 *
 * Three jobs, in order of how badly each fails when it is wrong:
 *
 *  1. **The marker never reaches the reader.** SSE cuts the stream wherever it
 *     likes; real recordings show `<od-done` arriving alone in one delta and
 *     `<od-done key="8` in another. Anything that could still grow into a
 *     marker is held until the next delta resolves it, and a marker that never
 *     completes is dropped rather than painted. Stripping does NOT depend on
 *     the key matching — a wrongly-keyed marker is still protocol noise, which
 *     is the rule `<od-title>` and `<MUST_FIX>` both had to learn the hard way.
 *
 *  2. **Never swallow the user's words.** Holding back is a bet that more
 *     characters are coming. When the bet loses — the held tail was prose that
 *     happened to start with `<` — `flush()` returns it verbatim.
 *
 *  3. **A marker never causes a read outside the project.** The declared path
 *     is untrusted input. It is rebased against the project root, refused if it
 *     escapes, and refused again after `realpath` so a symlink cannot walk out
 *     of the project between the check and the stat.
 *
 * **The empty-preview gate.** The product ruling is that a preview must not
 * open while the file is still empty — a blank page reads as a bug — but must
 * also not wait for the whole turn to finish. So an accepted `open` is not
 * emitted until the file is proven non-empty on disk. If it is not yet, the
 * marker is *held*, not dropped, and re-probed by `settle()` — which the run
 * loop calls after each file-writing tool result and once more at turn end.
 * That makes the trigger "the marker, and the bytes, whichever lands second".
 */
import { type ArtifactFocusSelection } from '@open-design/contracts';
export interface ArtifactFocusMarkerStripper {
    /** Remove markers from one delta, returning the text that may be shown. */
    strip(delta: string): string;
    /**
     * Re-probe a held `open` whose file was absent or empty when its marker
     * arrived. Safe to call at any time and any number of times; resolves to
     * `true` when this call is what released the pending selection.
     */
    settle(): Promise<boolean>;
    /** Stream ended: give back held prose verbatim, and drop a half-written tag. */
    flush(): string;
}
/** A probe of one candidate file. `null` means "not a readable in-project file". */
export type ArtifactFocusFileProbe = (absolutePath: string) => Promise<{
    size: number;
} | null>;
export interface ArtifactFocusMarkerStripperOptions {
    /**
     * This turn's nonce. A marker is only *accepted* when its key matches.
     * `null` means the turn has no key, so every marker is stripped and none is
     * accepted.
     */
    key: string | null;
    /** Absolute path of the project directory. `null` disables acceptance. */
    projectRoot: string | null;
    /** Called each time a selection resolves. May fire more than once per turn. */
    emit: (selection: ArtifactFocusSelection) => void;
    /** Injected by tests. Defaults to a realpath-guarded `stat`. */
    probeFile?: ArtifactFocusFileProbe;
}
/**
 * Turn one declared path into a project-relative POSIX path, or `null`.
 *
 * Absolute inputs are the common case, not the exception: every `Write` in the
 * recorded runs carries an absolute `file_path`, so an agent naming the file it
 * just wrote will naturally write an absolute path here too. Those are rebased
 * against the project root; anything that lands outside is refused.
 *
 * The rebased result goes back through the pure normalizer, so the "no `..`
 * anywhere" rule applies to it as well and there is exactly one definition of
 * an acceptable path.
 */
export declare function resolveArtifactFocusProjectPath(raw: unknown, projectRoot: string | null): string | null;
export declare function createArtifactFocusMarkerStripper(options: ArtifactFocusMarkerStripperOptions): ArtifactFocusMarkerStripper;
