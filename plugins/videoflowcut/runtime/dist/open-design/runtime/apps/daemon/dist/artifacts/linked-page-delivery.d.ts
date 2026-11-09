/**
 * A prototype's linked pages belong to its canonical entry. Accept a changed
 * page only after following real local HTML navigation from that entry; an
 * unrelated HTML file, external URL, or old untouched page is not delivery.
 * This reads markup only and never executes scripts or fetches resources.
 */
export declare function findTouchedLinkedPage(input: {
    projectRoot: string;
    entryFile: string;
    htmlPaths: ReadonlySet<string>;
    touchedPaths: ReadonlySet<string>;
}): Promise<string | null>;
