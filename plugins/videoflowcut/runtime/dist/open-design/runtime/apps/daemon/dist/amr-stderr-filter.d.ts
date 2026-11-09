export declare function createAgentStderrVisibilityFilter(agentId: string | undefined): {
    write(chunk: unknown): string;
    flush(): string;
};
