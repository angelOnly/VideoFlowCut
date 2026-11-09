export type AtomStatus = 'implemented' | 'planned';
export interface AtomCatalogEntry {
    id: string;
    label: string;
    description: string;
    status: AtomStatus;
    taskKinds: ReadonlyArray<'new-generation' | 'code-migration' | 'figma-migration' | 'tune-collab'>;
}
export declare const FIRST_PARTY_ATOMS: ReadonlyArray<AtomCatalogEntry>;
export declare function findAtom(id: string): AtomCatalogEntry | undefined;
export declare function isKnownAtom(id: string): boolean;
export declare function isImplementedAtom(id: string): boolean;
