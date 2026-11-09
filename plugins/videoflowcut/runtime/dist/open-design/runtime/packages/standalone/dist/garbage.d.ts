export type StandaloneGarbageSweepResult = Readonly<{
    discardedBlobs: number;
    discardedMaterializations: number;
}>;
/** Conservative global mark/quarantine sweep across every channel and namespace. */
export declare function sweepStandaloneStore(root: string): Promise<StandaloneGarbageSweepResult>;
//# sourceMappingURL=garbage.d.ts.map