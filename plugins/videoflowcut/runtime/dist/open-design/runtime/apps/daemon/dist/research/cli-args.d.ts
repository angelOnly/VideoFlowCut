export interface ResearchSubcommandArgs {
    sub: string | undefined;
    subArgs: string[];
}
export declare function splitResearchSubcommand(args: string[]): ResearchSubcommandArgs;
