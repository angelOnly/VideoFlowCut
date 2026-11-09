interface ArtifactCliResult {
    exitCode: number;
}
export declare function runArtifactsCli(args: string[]): Promise<ArtifactCliResult>;
export {};
