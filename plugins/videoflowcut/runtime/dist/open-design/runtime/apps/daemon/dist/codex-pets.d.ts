export interface CodexPetSummaryRecord {
    id: string;
    displayName: string;
    description: string;
    spritesheetUrl: string;
    spritesheetExt: string;
    hatchedAt: number;
    bundled?: boolean;
}
export interface CodexPetListResult {
    pets: CodexPetSummaryRecord[];
    rootDir: string;
}
interface SpritesheetPick {
    absPath: string;
    ext: string;
}
export declare function resolveCodexPetsRoot(): string;
export declare function listCodexPets(options?: {
    baseUrl?: string;
    bundledRoot?: string;
}): Promise<CodexPetListResult>;
export declare function readCodexPetSpritesheet(id: string, options?: {
    bundledRoot?: string;
}): Promise<SpritesheetPick | null>;
export {};
